import { auth } from "@/auth";
import { syncAllContent } from "@/lib/embeddings";
import { prisma } from "@/lib/prisma";
import { deleteAllEmbeddings, deleteEmbeddingsBySource } from "@/lib/vectordb";
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

    // Trigger full sync
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

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalCount = await prisma.embedding.count();
    const bySource = await prisma.embedding.groupBy({
      by: ["sourceType"],
      _count: {
        _all: true,
      },
    });

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
