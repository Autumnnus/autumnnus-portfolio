import {
  verifyVisitorCookie,
  VISITOR_COOKIE,
  visitorKeyFor,
} from "@/lib/ai/chat/identity";
import { deleteThread, loadThread } from "@/lib/ai/chat/store";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THREAD_ID = /^[A-Za-z0-9_-]{8,64}$/;

async function visitorKey() {
  const jar = await cookies();
  const visitorId = verifyVisitorCookie(jar.get(VISITOR_COOKIE)?.value);
  return visitorId ? visitorKeyFor(visitorId) : null;
}

/** Restores a conversation for the visitor who owns it. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const key = await visitorKey();
  if (!THREAD_ID.test(id) || !key) return Response.json({ messages: [] });

  const thread = await loadThread(id, key);
  return Response.json(
    { messages: thread.status === "owned" ? thread.messages : [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** "Clear conversation" removes it from the server too. */
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const key = await visitorKey();
  if (THREAD_ID.test(id) && key) await deleteThread(id, key);
  return new Response(null, { status: 204 });
}
