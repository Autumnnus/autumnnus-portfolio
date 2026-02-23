/* eslint-disable @typescript-eslint/no-explicit-any */
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

    const projects = await prisma.project.findMany({
      select: {
        id: true,
        slug: true,
        updatedAt: true,
        translations: { select: { title: true, language: true } },
      },
    });
    const blogs = await prisma.blogPost.findMany({
      select: {
        id: true,
        slug: true,
        updatedAt: true,
        translations: { select: { title: true, language: true } },
      },
    });
    const profiles = await prisma.profile.findMany({
      select: {
        id: true,
        updatedAt: true,
        translations: { select: { name: true, language: true } },
      },
    });
    const experiences = await prisma.workExperience.findMany({
      select: {
        id: true,
        company: true,
        updatedAt: true,
        translations: { select: { role: true, language: true } },
      },
    });

    const embeddings = await prisma.embedding.groupBy({
      by: ["sourceType", "sourceId"],
      _max: {
        updatedAt: true,
      },
    });

    const items: any[] = [];

    const getEmbUpdate = (type: string, id: string) =>
      embeddings.find((e) => e.sourceType === type && e.sourceId === id)?._max
        .updatedAt;

    const getStatus = (
      sourceUpdate: Date,
      embUpdate: Date | undefined | null,
    ) => {
      if (!embUpdate) return "missing";
      return sourceUpdate.getTime() - embUpdate.getTime() > 5000
        ? "outdated"
        : "synced";
    };

    projects.forEach((p: any) => {
      const embTime = getEmbUpdate("project", p.id);
      items.push({
        id: p.id,
        sourceType: "project",
        title:
          p.translations?.find((t: any) => t.language === "en")?.title ||
          p.translations?.[0]?.title ||
          p.slug,
        lastUpdated: p.updatedAt,
        status: getStatus(p.updatedAt, embTime),
      });
    });

    blogs.forEach((b: any) => {
      const embTime = getEmbUpdate("blog", b.id);
      items.push({
        id: b.id,
        sourceType: "blog",
        title:
          b.translations?.find((t: any) => t.language === "en")?.title ||
          b.translations?.[0]?.title ||
          b.slug,
        lastUpdated: b.updatedAt,
        status: getStatus(b.updatedAt, embTime),
      });
    });

    profiles.forEach((p: any) => {
      const embTime = getEmbUpdate("profile", p.id);
      items.push({
        id: p.id,
        sourceType: "profile",
        title:
          p.translations?.find((t: any) => t.language === "en")?.name ||
          p.translations?.[0]?.name ||
          "Profile",
        lastUpdated: p.updatedAt || new Date(),
        status: getStatus(p.updatedAt || new Date(), embTime),
      });
    });

    experiences.forEach((e: any) => {
      const embTime = getEmbUpdate("experience", e.id);
      const translate =
        e.translations?.find((t: any) => t.language === "en") ||
        e.translations?.[0];
      items.push({
        id: e.id,
        sourceType: "experience",
        title: `${e.company} - ${translate?.role || "Experience"}`,
        lastUpdated: e.updatedAt,
        status: getStatus(e.updatedAt, embTime),
      });
    });

    items.sort((a, b) => {
      if (a.status !== b.status) {
        if (a.status === "missing") return -1;
        if (b.status === "missing") return 1;
        if (a.status === "outdated") return -1;
        if (b.status === "outdated") return 1;
      }
      return (
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch embedding items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items." },
      { status: 500 },
    );
  }
}
