import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const umamiUrl =
    process.env.UMAMI_INTERNAL_URL || process.env.NEXT_PUBLIC_UMAMI_URL;

  if (!umamiUrl) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const body = await req.text();

  const res = await fetch(`${umamiUrl}/api/send`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": req.headers.get("user-agent") ?? "",
      "x-forwarded-for":
        req.headers.get("x-forwarded-for") ??
        req.headers.get("x-real-ip") ??
        "",
    },
    body,
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
