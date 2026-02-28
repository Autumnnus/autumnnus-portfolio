import { auth } from "@/auth";
import { db } from "@/lib/db";

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
        items: skills.map((s) => s.name).slice(0, 12),
      },
      experiences: {
        count: experiences.length,
        logoCount: expLogoCount,
        items: experiences.map((e) => e.company).slice(0, 8),
      },
      profile: {
        exists: !!profileData,
        hasAvatar: !!profileData?.avatar,
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
