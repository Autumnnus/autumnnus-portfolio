import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

async function checkAdmin() {
  const session = await auth();
  if (!session || !session.user || session.user.email !== ADMIN_EMAIL) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sourceType = searchParams.get("sourceType");
    const sourceId = searchParams.get("sourceId");

    if (!sourceType || !sourceId) {
      return NextResponse.json(
        { error: "Missing sourceType or sourceId" },
        { status: 400 },
      );
    }

    const embeddings = await prisma.embedding.findMany({
      where: {
        sourceType,
        sourceId,
      },
      orderBy: [{ language: "asc" }, { chunkIndex: "asc" }],
      select: {
        id: true,
        chunkText: true,
        chunkIndex: true,
        language: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ embeddings });
  } catch (error) {
    console.error("Failed to fetch embedding details:", error);
    return NextResponse.json(
      { error: "Failed to fetch details." },
      { status: 500 },
    );
  }
}
