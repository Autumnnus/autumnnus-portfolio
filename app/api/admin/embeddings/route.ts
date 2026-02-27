import { auth } from "@/auth";
import { db } from "@/lib/db";
import { embedding } from "@/lib/db/schema";
import { syncAllContent } from "@/lib/embeddings";
import { deleteAllEmbeddings, deleteEmbeddingsBySource } from "@/lib/vectordb";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

async function checkAdmin() {
  const session = await auth();
  if (!session || !session.user || session.user.email !== ADMIN_EMAIL) {
    return false;
  }
  return true;
}

export async function POST(_req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAllContent();

    return NextResponse.json({
      success: true,
      message: "Embeddings synced successfully.",
    });
  } catch (error) {
    console.error("Embedding Sync Error:", error);
    return NextResponse.json(
      { error: "Failed to sync embeddings." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sourceType, sourceId, all } = await req.json();

    if (all) {
      await deleteAllEmbeddings();
      return NextResponse.json({
        success: true,
        message: "All embeddings deleted.",
      });
    }

    if (sourceType && sourceId) {
      await deleteEmbeddingsBySource(sourceType, sourceId);
      return NextResponse.json({
        success: true,
        message: `Embeddings for ${sourceType} ${sourceId} deleted.`,
      });
    }

    return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
  } catch (error) {
    console.error("Embedding Delete Error:", error);
    return NextResponse.json(
      { error: "Failed to delete embeddings." },
      { status: 500 },
    );
  }
}

export async function GET(_req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(embedding)
      .then((res) => Number(res[0].count));
    const bySourceRaw = await db
      .select({
        sourceType: embedding.sourceType,
        count: sql<number>`count(*)`,
      })
      .from(embedding)
      .groupBy(embedding.sourceType);

    const bySource = bySourceRaw.map((row) => ({
      sourceType: row.sourceType,
      _count: {
        _all: Number(row.count),
      },
    }));

    return NextResponse.json({
      totalCount,
      bySource,
    });
  } catch (error) {
    console.error("Embedding Stats Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats." },
      { status: 500 },
    );
  }
}
