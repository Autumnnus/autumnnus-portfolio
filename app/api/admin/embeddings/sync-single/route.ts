import { auth } from "@/auth";
import { syncSingleContent } from "@/lib/embeddings";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

async function checkAdmin() {
  const session = await auth();
  if (!session || !session.user || session.user.email !== ADMIN_EMAIL) {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sourceType, sourceId } = await req.json();

    if (!sourceType || !sourceId) {
      return NextResponse.json(
        { error: "sourceType and sourceId are required" },
        { status: 400 },
      );
    }

    await syncSingleContent(sourceType, sourceId);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${sourceType} ${sourceId}`,
    });
  } catch (error) {
    console.error("Single Sync Error:", error);
    return NextResponse.json(
      { error: "Failed to sync content." },
      { status: 500 },
    );
  }
}
