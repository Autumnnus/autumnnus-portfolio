import { cookies } from "next/headers";
import { verifyVisitorCookie, VISITOR_COOKIE, visitorKeyFor } from "./identity";

/** The signed-cookie visitor key for this request, or null for new visitors. */
export async function currentVisitorKey() {
  const jar = await cookies();
  const visitorId = verifyVisitorCookie(jar.get(VISITOR_COOKIE)?.value);
  return visitorId ? visitorKeyFor(visitorId) : null;
}
