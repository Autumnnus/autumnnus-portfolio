import { listThreads } from "@/lib/ai/chat/store";
import { currentVisitorKey } from "@/lib/ai/chat/visitor-key";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Conversation history for the visitor who owns it — never anyone else's. */
export async function GET() {
  const key = await currentVisitorKey();
  const threads = key ? await listThreads(key) : [];
  return Response.json({ threads }, { headers: { "Cache-Control": "no-store" } });
}
