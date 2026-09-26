import { auth } from "@/auth";
import { assistantTools } from "@/lib/ai/agent/tools";
import type { AssistantUIMessage } from "@/lib/ai/agent/portfolio-agent";
import {
  clientIp,
  createVisitorCookieValue,
  ipKeyFor,
  verifyVisitorCookie,
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  visitorKeyFor,
} from "@/lib/ai/chat/identity";
import { parsePathname, resolvePageContext } from "@/lib/ai/chat/page-context";
import { mergeApprovalResponses } from "@/lib/ai/chat/approvals";
import { consumeRateLimits } from "@/lib/ai/chat/rate-limit";
import { getAssistantSettings, runMaintenanceIfDue } from "@/lib/ai/chat/settings";
import { loadThread, saveTurn } from "@/lib/ai/chat/store";
import { runChatTurn } from "@/lib/ai/chat/turn";
import { CHAT_LIMITS, toAssistantLocale } from "@/lib/ai/config";
import { DEFAULT_MODELS, isKnownModel } from "@/lib/ai/models";
import { routeRequest, type RouteDecision } from "@/lib/ai/system-one/gate";
import { createUIMessageStreamResponse, safeValidateUIMessages } from "ai";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { hasGeminiKey } from "@/lib/ai/gemini-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  message: z.object({
    id: z.string().min(1).max(100),
    role: z.enum(["user", "assistant"]),
    parts: z.array(z.record(z.string(), z.unknown())).max(80),
  }),
  locale: z.string().optional(),
  pathname: z.string().max(200).optional(),
});

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const textOf = (message: AssistantUIMessage | undefined) =>
  message?.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim() ?? "";

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "bad_request" });

  const { id: threadId, message: incoming, pathname } = parsed.data;
  const locale = toAssistantLocale(parsed.data.locale);
  const t = await getTranslations({ locale, namespace: "Assistant.server" });

  const [settings, session] = await Promise.all([getAssistantSettings(), auth()]);
  const isAdmin =
    !!session?.user?.email && session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!settings.enabled && !isAdmin) return json(503, { error: "disabled" });
  if (!hasGeminiKey()) return json(503, { error: "not_configured" });

  // ── visitor identity ──────────────────────────────────────────────────────
  const jar = await cookies();
  let visitorId = verifyVisitorCookie(jar.get(VISITOR_COOKIE)?.value);
  if (!visitorId) {
    const value = createVisitorCookieValue();
    jar.set(VISITOR_COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE,
    });
    visitorId = verifyVisitorCookie(value)!;
  }
  const visitorKey = visitorKeyFor(visitorId);
  const ipKey = ipKeyFor(clientIp(req.headers));

  const thread = await loadThread(threadId, visitorKey);
  if (thread.status === "foreign" || thread.status === "deleted") {
    return json(409, { error: "thread_conflict" });
  }

  // ── build the conversation (server is the source of truth) ────────────────
  let messages: AssistantUIMessage[];
  let userMessage: AssistantUIMessage | null = null;
  let question: string;

  if (incoming.role === "user") {
    const textParts = incoming.parts.filter((part) => part.type === "text");
    if (!textParts.length || textParts.length !== incoming.parts.length) {
      return json(400, { error: "unsupported_parts" });
    }
    question = textParts.map((part) => String(part.text ?? "")).join("\n").trim();
    if (!question) return json(400, { error: "empty_message" });
    if (question.length > CHAT_LIMITS.maxUserMessageChars) {
      return json(413, { error: "message_too_long" });
    }
    if (thread.messages.some((message) => message.id === incoming.id)) {
      return json(409, { error: "duplicate_message" });
    }

    if (!isAdmin) {
      const limit = await consumeRateLimits([
        { key: `visitor:${visitorKey}`, limit: settings.visitorDailyLimit },
        { key: `ip:${ipKey}`, limit: settings.visitorDailyLimit * 3 },
        { key: "global", limit: settings.globalDailyLimit },
      ]);
      if (!limit.ok) {
        return json(429, {
          error: "rate_limited",
          scope: limit.exceeded,
          resetAt: limit.resetAt.toISOString(),
        });
      }
    }

    userMessage = {
      id: incoming.id,
      role: "user",
      parts: [{ type: "text", text: question }],
      metadata: { createdAt: Date.now() },
    };
    messages = [...thread.messages, userMessage];
  } else {
    // Continuation after the visitor approved / denied a tool call.
    const last = thread.messages.at(-1);
    if (!last || last.role !== "assistant" || last.id !== incoming.id) {
      return json(409, { error: "stale_continuation" });
    }
    const merged = mergeApprovalResponses(last, incoming.parts);
    if (!merged) return json(400, { error: "no_approval_response" });
    messages = [...thread.messages.slice(0, -1), merged];
    question = textOf(thread.messages.findLast((message) => message.role === "user"));
  }

  // Bounded context window; it must start at a user turn.
  const context = messages.slice(-CHAT_LIMITS.maxContextMessages);
  while (context.length > 1 && context[0].role !== "user") context.shift();

  const validated = await safeValidateUIMessages<AssistantUIMessage>({
    messages: context,
    tools: assistantTools,
  });
  let uiMessages: AssistantUIMessage[];
  if (validated.success) {
    uiMessages = validated.data;
  } else if (userMessage) {
    console.warn("[assistant] stored history failed validation, starting fresh:", validated.error);
    uiMessages = [userMessage];
  } else {
    return json(400, { error: "invalid_history" });
  }

  // ── System One gate + page context (in parallel) ──────────────────────────
  const previousAssistant = [...thread.messages].reverse().find((m) => m.role === "assistant");
  const parsedPage = parsePathname(pathname);
  const continuationRoute: RouteDecision = {
    tier: "fast",
    mode: "normal",
    intent: "portfolio",
    signals: { intentConfidence: null, injection: null, abuse: null, complexity: null },
    source: "heuristic",
    trace: { provider: "off", ms: 0, ok: false },
  };

  const [page, route] = await Promise.all([
    resolvePageContext(pathname, locale),
    userMessage
      ? routeRequest({
          latestMessage: question,
          previousAssistantMessage: textOf(previousAssistant),
          page: parsedPage ? { type: parsedPage.type, title: parsedPage.slug } : null,
          abortSignal: req.signal,
        })
      : Promise.resolve(continuationRoute),
  ]);

  const stream = runChatTurn({
    messages: uiMessages,
    locale,
    question,
    page,
    route,
    models: {
      fast: isKnownModel(settings.modelFast) ? settings.modelFast : DEFAULT_MODELS.fast,
      deep: isKnownModel(settings.modelDeep) ? settings.modelDeep : DEFAULT_MODELS.deep,
    },
    visitorKey,
    threadId,
    abortSignal: req.signal,
    cannedReply: route.mode === "blocked" ? t("blocked") : undefined,
    onComplete: async ({ responseMessage, usage }) => {
      // A turn that produced nothing (provider error, instant abort) is not
      // persisted, so the visitor can simply retry without a dangling turn.
      const produced = responseMessage.parts.some(
        (part) => part.type === "text" || part.type.startsWith("tool-"),
      );
      if (!produced) return;
      await saveTurn({
        threadId,
        visitorKey,
        ipKey,
        locale,
        entryPath: page?.path ?? null,
        title: textOf(messages.find((m) => m.role === "user")).slice(0, 120),
        messages: userMessage ? [userMessage, responseMessage] : [responseMessage],
        usage,
        flagged: route.mode === "strict" || route.mode === "blocked",
      });
    },
  });

  after(() =>
    runMaintenanceIfDue().catch((error) =>
      console.error("[assistant] maintenance failed:", error),
    ),
  );

  return createUIMessageStreamResponse({
    stream,
    headers: { "Cache-Control": "no-store" },
  });
}
