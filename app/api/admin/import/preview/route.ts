/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth";
import JSZip from "jszip";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (
      !session?.user?.email ||
      session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return new Response("No file provided", { status: 400 });

    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const dataFile = zip.file("data.json");
    if (!dataFile)
      return new Response("Invalid backup: data.json missing", { status: 400 });

    const jsonContent = await dataFile.async("string");
    const parsed = JSON.parse(jsonContent);
    const { timestamp, data } = parsed;
    // Legacy backups may still contain an `embeddings` section. It is ignored:
    // the knowledge index is derived data and is rebuilt via reindex.
    const { projects, blogs, profile, experiences, skills, categories } =
      data ?? {};

    const projectTranslationCount = (projects ?? []).reduce(
      (acc: number, p: any) => acc + (p?.translations?.length ?? 0),
      0,
    );
    const blogTranslationCount = (blogs ?? []).reduce(
      (acc: number, b: any) => acc + (b?.translations?.length ?? 0),
      0,
    );
    const experienceTranslationCount = (experiences ?? []).reduce(
      (acc: number, e: any) => acc + (e?.translations?.length ?? 0),
      0,
    );
    const projectTechRelationCount = (projects ?? []).reduce(
      (acc: number, p: any) => acc + (p?.technologies?.length ?? 0),
      0,
    );
    const totalSkillRelations = projectTechRelationCount;

    const projectCategoryCount = (categories ?? []).filter(
      (c: any) => c?.type === "project",
    ).length;
    const blogCategoryCount = (categories ?? []).filter(
      (c: any) => c?.type === "blog",
    ).length;

    let assetCount = 0;
    zip.folder("assets")?.forEach((_, f) => {
      if (!f.dir) assetCount++;
    });

    return Response.json({
      timestamp,
      projects: {
        count: projects?.length ?? 0,
        translationCount: projectTranslationCount,
        categoryCount: projectCategoryCount,
        techRelationCount: projectTechRelationCount,
        items: (projects ?? [])
          .map((p: any) => {
            const t =
              p.translations?.find((t: any) => t.language === "en") ||
              p.translations?.[0];
            return t?.title || p.slug || "Untitled";
          })
          .slice(0, 8),
      },
      blogs: {
        count: blogs?.length ?? 0,
        translationCount: blogTranslationCount,
        categoryCount: blogCategoryCount,
        items: (blogs ?? [])
          .map((b: any) => {
            const t =
              b.translations?.find((t: any) => t.language === "en") ||
              b.translations?.[0];
            return t?.title || b.slug || "Untitled";
          })
          .slice(0, 8),
      },
      skills: {
        count: skills?.length ?? 0,
        usedInProjects: totalSkillRelations,
        items: (skills ?? []).map((s: any) => s.name).slice(0, 12),
      },
      experiences: {
        count: experiences?.length ?? 0,
        translationCount: experienceTranslationCount,
        items: (experiences ?? []).map((e: any) => e.company).slice(0, 8),
      },
      profile: {
        exists: !!profile,
        translationCount: profile?.translations?.length ?? 0,
        name:
          profile?.translations?.find((t: any) => t.language === "en")?.name ||
          profile?.translations?.[0]?.name,
        hasAvatar: !!profile?.avatar,
        questCount: profile?.quests?.length ?? 0,
      },
      assets: { count: assetCount },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
