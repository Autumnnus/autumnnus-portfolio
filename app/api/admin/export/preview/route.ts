import { auth } from "@/auth";
import { db } from "@/lib/db";
import { _projectToSkill, category, embedding } from "@/lib/db/schema";
import { and, count, eq, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (
      !session?.user?.email ||
      session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    const [projects, blogs, profileData, experiences, skills] =
      await Promise.all([
        db.query.project.findMany({
          with: { translations: true, technologies: true },
        }),
        db.query.blogPost.findMany({ with: { translations: true } }),
        db.query.profile.findFirst({
          with: { translations: true, quests: { with: { translations: true } } },
        }),
        db.query.workExperience.findMany({ with: { translations: true } }),
        db.query.skill.findMany(),
      ]);

    const projectIds = projects.map((p) => p.id);
    const blogIds = blogs.map((b) => b.id);
    const experienceIds = experiences.map((e) => e.id);
    const profileId = profileData?.id ?? null;

    const [
      projectCategoryCountRes,
      blogCategoryCountRes,
      projectEmbeddingCountRes,
      blogEmbeddingCountRes,
      experienceEmbeddingCountRes,
      profileEmbeddingCountRes,
      projectSkillRelationCountRes,
      totalSkillRelationCountRes,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(category)
        .where(eq(category.type, "project")),
      db
        .select({ count: count() })
        .from(category)
        .where(eq(category.type, "blog")),
      projectIds.length
        ? db
            .select({ count: count() })
            .from(embedding)
            .where(
              and(
                eq(embedding.sourceType, "project"),
                inArray(embedding.sourceId, projectIds),
              ),
            )
        : Promise.resolve([{ count: 0 }]),
      blogIds.length
        ? db
            .select({ count: count() })
            .from(embedding)
            .where(
              and(
                eq(embedding.sourceType, "blog"),
                inArray(embedding.sourceId, blogIds),
              ),
            )
        : Promise.resolve([{ count: 0 }]),
      experienceIds.length
        ? db
            .select({ count: count() })
            .from(embedding)
            .where(
              and(
                eq(embedding.sourceType, "experience"),
                inArray(embedding.sourceId, experienceIds),
              ),
            )
        : Promise.resolve([{ count: 0 }]),
      profileId
        ? db
            .select({ count: count() })
            .from(embedding)
            .where(
              and(
                eq(embedding.sourceType, "profile"),
                eq(embedding.sourceId, profileId),
              ),
            )
        : Promise.resolve([{ count: 0 }]),
      projectIds.length
        ? db
            .select({ count: count() })
            .from(_projectToSkill)
            .where(inArray(_projectToSkill.A, projectIds))
        : Promise.resolve([{ count: 0 }]),
      db.select({ count: count() }).from(_projectToSkill),
    ]);

    const projectTranslationCount = projects.reduce(
      (acc, p) => acc + p.translations.length,
      0,
    );
    const blogTranslationCount = blogs.reduce(
      (acc, b) => acc + b.translations.length,
      0,
    );
    const experienceTranslationCount = experiences.reduce(
      (acc, e) => acc + e.translations.length,
      0,
    );

    const projectImageCount = projects.reduce((acc, p) => {
      let count = 0;
      if (p.coverImage) count++;
      if (p.images) count += p.images.length;
      return acc + count;
    }, 0);

    const blogImageCount = blogs.filter((b) => b.coverImage).length;
    const skillIconCount = skills.filter((s) => s.icon).length;
    const expLogoCount = experiences.filter((e) => e.logo).length;
    const totalAssets =
      projectImageCount +
      blogImageCount +
      skillIconCount +
      expLogoCount +
      (profileData?.avatar ? 1 : 0);

    return Response.json({
      projects: {
        count: projects.length,
        imageCount: projectImageCount,
        translationCount: projectTranslationCount,
        categoryCount: projectCategoryCountRes[0]?.count ?? 0,
        techRelationCount: projectSkillRelationCountRes[0]?.count ?? 0,
        embeddingCount: projectEmbeddingCountRes[0]?.count ?? 0,
        items: projects
          .map((p) => {
            const t =
              p.translations.find((t) => t.language === "en") ||
              p.translations[0];
            return t?.title || p.slug;
          })
          .slice(0, 8),
      },
      blogs: {
        count: blogs.length,
        imageCount: blogImageCount,
        translationCount: blogTranslationCount,
        categoryCount: blogCategoryCountRes[0]?.count ?? 0,
        embeddingCount: blogEmbeddingCountRes[0]?.count ?? 0,
        items: blogs
          .map((b) => {
            const t =
              b.translations.find((t) => t.language === "en") ||
              b.translations[0];
            return t?.title || b.slug;
          })
          .slice(0, 8),
      },
      skills: {
        count: skills.length,
        iconCount: skillIconCount,
        usedInProjects: totalSkillRelationCountRes[0]?.count ?? 0,
        items: skills.map((s) => s.name).slice(0, 12),
      },
      experiences: {
        count: experiences.length,
        logoCount: expLogoCount,
        translationCount: experienceTranslationCount,
        embeddingCount: experienceEmbeddingCountRes[0]?.count ?? 0,
        items: experiences.map((e) => e.company).slice(0, 8),
      },
      profile: {
        exists: !!profileData,
        hasAvatar: !!profileData?.avatar,
        translationCount: profileData?.translations?.length ?? 0,
        embeddingCount: profileEmbeddingCountRes[0]?.count ?? 0,
        name:
          profileData?.translations.find((t) => t.language === "en")?.name ||
          profileData?.translations[0]?.name,
        questCount: profileData?.quests?.length ?? 0,
      },
      totalAssets,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
