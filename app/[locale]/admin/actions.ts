"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  _projectToSkill,
  blogPost,
  blogPostTranslation,
  comment as commentTable,
  LanguageType as Language,
  profile,
  profileTranslation,
  project,
  projectTranslation,
  quest,
  questTranslation,
  skill,
  socialLink,
  workExperience,
  workExperienceTranslation,
} from "@/lib/db/schema";
import { deleteFolder, uploadFile } from "@/lib/minio";
import { deleteEmbeddingsBySource } from "@/lib/vectordb";
import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ProjectTranslationInput {
  language: Language;
  title: string;
  shortDescription: string;
  fullDescription: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface ProjectData {
  slug: string;
  status: string;
  category: string;
  github?: string | null;
  liveDemo?: string | null;
  featured: boolean;
  coverImage?: string | null;
  imageAlt?: string | null;
  images: string[];
  translations: ProjectTranslationInput[];
  technologies: string[];
}

export interface BlogTranslationInput {
  language: Language;
  title: string;
  description: string;
  content: string;
  readTime: string;
  date: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface BlogData {
  slug: string;
  coverImage?: string | null;
  imageAlt?: string | null;
  featured: boolean;
  tags: string[];
  category?: string;
  status: string;
  commentsEnabled: boolean;
  translations: BlogTranslationInput[];
}

export interface ProfileTranslationInput {
  language: Language;
  name: string;
  title: string;
  greetingText: string;
  description: string;
  aboutTitle: string;
  aboutDescription: string;
}

export interface ProfileData {
  avatar: string;
  email: string;
  github: string;
  linkedin: string;
  translations: ProfileTranslationInput[];
  quests: QuestData[];
}

export interface ExperienceTranslationInput {
  language: Language;
  role: string;
  description: string;
  locationType: string;
}

export interface ExperienceData {
  company: string;
  logo: string;
  startDate?: Date | null;
  endDate?: Date | null;
  translations: ExperienceTranslationInput[];
}

export interface QuestTranslationInput {
  language: Language;
  title: string;
}

export interface QuestData {
  completed: boolean;
  order: number;
  translations: QuestTranslationInput[];
}

export async function uploadImageAction(formData: FormData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  const customPath = formData.get("path") as string;

  if (!file) throw new Error("No file provided");

  const buffer = Buffer.from(await file.arrayBuffer());
  const cleanFileName = file.name.replace(/\s+/g, "-");
  const filename = customPath
    ? `${customPath}/${Date.now()}-${cleanFileName}`
    : `${Date.now()}-${cleanFileName}`;

  const url = await uploadFile(filename, buffer, file.type);
  return { url };
}

export async function createProjectAction(data: ProjectData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, technologies, images, ...projectData } = data;

  const existingProject = await db.query.project.findFirst({
    where: eq(project.slug, projectData.slug),
  });

  if (existingProject) {
    throw new Error(
      "Bu slug (URL) zaten başka bir proje tarafından kullanılıyor.",
    );
  }

  const [newProject] = await db
    .insert(project)
    .values({
      ...projectData,
      images,
    })
    .returning();

  if (translations && translations.length > 0) {
    await db.insert(projectTranslation).values(
      translations.map((t) => ({
        ...t,
        projectId: newProject.id,
      })),
    );
  }

  if (technologies && technologies.length > 0) {
    await db.insert(_projectToSkill).values(
      technologies.map((techId) => ({
        A: newProject.id,
        B: techId,
      })),
    );
  }

  return newProject;
}

export async function updateProjectAction(id: string, data: ProjectData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, technologies, images, ...projectData } = data;

  const existingProject = await db.query.project.findFirst({
    where: and(eq(project.slug, projectData.slug), ne(project.id, id)),
  });

  if (existingProject) {
    throw new Error(
      "Bu slug (URL) zaten başka bir proje tarafından kullanılıyor.",
    );
  }

  await db
    .delete(projectTranslation)
    .where(eq(projectTranslation.projectId, id));
  await db.delete(_projectToSkill).where(eq(_projectToSkill.A, id));

  const [updatedProject] = await db
    .update(project)
    .set({
      ...projectData,
      images,
    })
    .where(eq(project.id, id))
    .returning();

  if (translations && translations.length > 0) {
    await db.insert(projectTranslation).values(
      translations.map((t) => ({
        ...t,
        projectId: id,
      })),
    );
  }

  if (technologies && technologies.length > 0) {
    await db.insert(_projectToSkill).values(
      technologies.map((techId) => ({
        A: id,
        B: techId,
      })),
    );
  }

  return updatedProject;
}

export async function deleteProjectAction(id: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const existingProject = await db.query.project.findFirst({
    where: eq(project.id, id),
    columns: { slug: true },
  });

  if (existingProject?.slug) {
    await deleteFolder(`projects/${existingProject.slug}`);
  }

  await deleteEmbeddingsBySource("project", id);

  return await db.delete(project).where(eq(project.id, id)).returning();
}

export async function createBlogAction(data: BlogData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, ...blogData } = data;

  const existingBlog = await db.query.blogPost.findFirst({
    where: eq(blogPost.slug, blogData.slug),
  });

  if (existingBlog) {
    throw new Error(
      "Bu slug (URL) zaten başka bir blog yazısı tarafından kullanılıyor.",
    );
  }

  const [newBlog] = await db.insert(blogPost).values(blogData).returning();

  if (translations && translations.length > 0) {
    await db.insert(blogPostTranslation).values(
      translations.map((t) => ({
        ...t,
        blogPostId: newBlog.id,
      })),
    );
  }

  return newBlog;
}

export async function updateBlogAction(id: string, data: BlogData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, ...blogData } = data;

  const existingBlog = await db.query.blogPost.findFirst({
    where: and(eq(blogPost.slug, blogData.slug), ne(blogPost.id, id)),
  });

  if (existingBlog) {
    throw new Error(
      "Bu slug (URL) zaten başka bir blog yazısı tarafından kullanılıyor.",
    );
  }

  await db
    .delete(blogPostTranslation)
    .where(eq(blogPostTranslation.blogPostId, id));

  const [updatedBlog] = await db
    .update(blogPost)
    .set(blogData)
    .where(eq(blogPost.id, id))
    .returning();

  if (translations && translations.length > 0) {
    await db.insert(blogPostTranslation).values(
      translations.map((t) => ({
        ...t,
        blogPostId: id,
      })),
    );
  }

  return updatedBlog;
}

export async function deleteBlogAction(id: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const existingBlog = await db.query.blogPost.findFirst({
    where: eq(blogPost.id, id),
    columns: { slug: true },
  });

  if (existingBlog?.slug) {
    await deleteFolder(`blog/${existingBlog.slug}`);
  }

  await deleteEmbeddingsBySource("blog", id);

  return await db.delete(blogPost).where(eq(blogPost.id, id)).returning();
}

export async function createSkillAction(data: { name: string; icon: string }) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const key = data.name.toUpperCase().replace(/\s+/g, "_");

  const [newSkill] = await db
    .insert(skill)
    .values({
      name: data.name,
      icon: data.icon,
      key,
    })
    .returning();

  return newSkill;
}
export async function updateProfileAction(data: ProfileData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, quests, ...profileData } = data;

  const existingProfile = await db.query.profile.findFirst();

  if (existingProfile) {
    await db.transaction(async (tx) => {
      await tx
        .delete(profileTranslation)
        .where(eq(profileTranslation.profileId, existingProfile.id));

      const existingQuests = await tx.query.quest.findMany({
        where: eq(quest.profileId, existingProfile.id),
      });

      if (existingQuests.length > 0) {
        const questIds = existingQuests.map((q) => q.id);
        await tx
          .delete(questTranslation)
          .where(inArray(questTranslation.questId, questIds));
        await tx.delete(quest).where(eq(quest.profileId, existingProfile.id));
      }

      await tx
        .update(profile)
        .set(profileData)
        .where(eq(profile.id, existingProfile.id));

      if (translations && translations.length > 0) {
        await tx
          .insert(profileTranslation)
          .values(
            translations.map((t) => ({ ...t, profileId: existingProfile.id })),
          );
      }

      for (const q of quests) {
        const [newQuest] = await tx
          .insert(quest)
          .values({
            completed: q.completed,
            order: q.order,
            profileId: existingProfile.id,
          })
          .returning();

        if (q.translations && q.translations.length > 0) {
          await tx.insert(questTranslation).values(
            q.translations.map((t) => ({
              language: t.language,
              title: t.title,
              questId: newQuest.id,
            })),
          );
        }
      }
    });

    revalidatePath("/[locale]", "layout");
    return { success: true };
  } else {
    let newProfileData: any = null;
    await db.transaction(async (tx) => {
      const [newProfile] = await tx
        .insert(profile)
        .values(profileData)
        .returning();
      newProfileData = newProfile;

      if (translations && translations.length > 0) {
        await tx
          .insert(profileTranslation)
          .values(
            translations.map((t) => ({ ...t, profileId: newProfile.id })),
          );
      }

      for (const q of quests) {
        const [newQuest] = await tx
          .insert(quest)
          .values({
            completed: q.completed,
            order: q.order,
            profileId: newProfile.id,
          })
          .returning();

        if (q.translations && q.translations.length > 0) {
          await tx.insert(questTranslation).values(
            q.translations.map((t) => ({
              language: t.language,
              title: t.title,
              questId: newQuest.id,
            })),
          );
        }
      }
    });

    revalidatePath("/[locale]", "layout");
    return newProfileData;
  }
}

export async function createExperienceAction(data: ExperienceData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, ...experienceData } = data;

  const [newExp] = await db
    .insert(workExperience)
    .values(experienceData)
    .returning();

  if (translations && translations.length > 0) {
    await db.insert(workExperienceTranslation).values(
      translations.map((t) => ({
        ...t,
        workExperienceId: newExp.id,
      })),
    );
  }

  return newExp;
}

export async function updateExperienceAction(id: string, data: ExperienceData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, ...experienceData } = data;

  await db
    .delete(workExperienceTranslation)
    .where(eq(workExperienceTranslation.workExperienceId, id));

  const [updatedExp] = await db
    .update(workExperience)
    .set(experienceData)
    .where(eq(workExperience.id, id))
    .returning();

  if (translations && translations.length > 0) {
    await db.insert(workExperienceTranslation).values(
      translations.map((t) => ({
        ...t,
        workExperienceId: id,
      })),
    );
  }

  return updatedExp;
}

export async function deleteExperienceAction(id: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  return await db
    .delete(workExperience)
    .where(eq(workExperience.id, id))
    .returning();
}

export async function createQuestAction(data: QuestData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const profileRow = await db.query.profile.findFirst();
  if (!profileRow)
    throw new Error("Profil bulunamadı. Lütfen önce profil oluşturun.");

  const { translations, ...questData } = data;

  const [newQuest] = await db
    .insert(quest)
    .values({
      ...questData,
      profileId: profileRow.id,
    })
    .returning();

  if (translations && translations.length > 0) {
    await db.insert(questTranslation).values(
      translations.map((t) => ({
        language: t.language,
        title: t.title,
        questId: newQuest.id,
      })),
    );
  }

  revalidatePath("/[locale]", "layout");
  return newQuest;
}

export async function updateQuestAction(id: string, data: QuestData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, ...questData } = data;

  await db.delete(questTranslation).where(eq(questTranslation.questId, id));

  const [updatedQuest] = await db
    .update(quest)
    .set(questData)
    .where(eq(quest.id, id))
    .returning();

  if (translations && translations.length > 0) {
    await db.insert(questTranslation).values(
      translations.map((t) => ({
        language: t.language,
        title: t.title,
        questId: id,
      })),
    );
  }

  revalidatePath("/[locale]", "layout");
  return updatedQuest;
}

export async function deleteQuestAction(id: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const deletedQuest = await db
    .delete(quest)
    .where(eq(quest.id, id))
    .returning();

  revalidatePath("/[locale]", "layout");
  return deletedQuest[0];
}

export async function toggleQuestStatusAction(id: string, completed: boolean) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const updatedQuest = await db
    .update(quest)
    .set({ completed })
    .where(eq(quest.id, id))
    .returning();

  revalidatePath("/[locale]", "layout");
  return updatedQuest[0];
}

export async function exportDatabaseAction() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const [projects, blogs, profile, experiences, socialLinks, skills, quests] =
    await Promise.all([
      db.query.project.findMany({
        with: { translations: true, technologies: { with: { skill: true } } },
      }),
      db.query.blogPost.findMany({
        with: { translations: true },
      }),
      db.query.profile.findFirst({
        with: { translations: true },
      }),
      db.query.workExperience.findMany({
        with: { translations: true },
      }),
      db.query.socialLink.findMany(),
      db.query.skill.findMany(),
      db.query.quest.findMany({
        with: { translations: true },
      }),
    ]);

  return {
    timestamp: new Date().toISOString(),
    data: {
      projects,
      blogs,
      profile,
      experiences,
      skills,
      quests,
      socialLinks,
    },
  };
}

export async function importDatabaseAction(jsonData: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { data } = JSON.parse(jsonData);
  const {
    projects: impProjects,
    blogs: impBlogs,
    profile: impProfile,
    experiences: impExperiences,
    skills: impSkills,
    quests: impQuests,
  } = data;

  try {
    await db.transaction(async (tx) => {
      await tx.delete(projectTranslation);
      await tx.delete(_projectToSkill);
      await tx.delete(project);
      await tx.delete(blogPostTranslation);
      await tx.delete(blogPost);
      await tx.delete(workExperienceTranslation);
      await tx.delete(workExperience);
      await tx.delete(profileTranslation);
      await tx.delete(profile);
      await tx.delete(skill);
      await tx.delete(questTranslation);
      await tx.delete(quest);

      if (impSkills && impSkills.length > 0) {
        await tx.insert(skill).values(
          (
            impSkills as {
              id: string;
              key: string;
              name: string;
              icon: string;
            }[]
          ).map((s) => ({
            id: s.id,
            key: s.key,
            name: s.name,
            icon: s.icon,
          })),
        );
      }
      if (impProfile) {
        const p = impProfile as ProfileData;
        const [createdProfile] = await tx
          .insert(profile)
          .values({
            avatar: p.avatar,
            email: p.email,
            github: p.github,
            linkedin: p.linkedin,
          })
          .returning();

        if (p.translations && p.translations.length > 0) {
          await tx.insert(profileTranslation).values(
            p.translations.map((t) => ({
              language: t.language,
              name: t.name,
              title: t.title,
              greetingText: t.greetingText,
              description: t.description,
              aboutTitle: t.aboutTitle,
              aboutDescription: t.aboutDescription,
              profileId: createdProfile.id,
            })),
          );
        }

        if (impQuests && impQuests.length > 0) {
          for (const q of impQuests as {
            completed: boolean;
            order: number;
            translations: { language: Language; title: string }[];
          }[]) {
            const [newQuest] = await tx
              .insert(quest)
              .values({
                completed: q.completed,
                order: q.order,
                profileId: createdProfile.id,
              })
              .returning();

            if (q.translations && q.translations.length > 0) {
              await tx.insert(questTranslation).values(
                q.translations.map((t) => ({
                  language: t.language,
                  title: t.title,
                  questId: newQuest.id,
                })),
              );
            }
          }
        }
      }

      if (impExperiences && impExperiences.length > 0) {
        for (const exp of impExperiences as ExperienceData[]) {
          const [newExp] = await tx
            .insert(workExperience)
            .values({
              company: exp.company,
              logo: exp.logo,
              startDate: exp.startDate,
              endDate: exp.endDate,
            })
            .returning();

          if (exp.translations && exp.translations.length > 0) {
            await tx.insert(workExperienceTranslation).values(
              exp.translations.map((t) => ({
                language: t.language,
                role: t.role,
                description: t.description,
                locationType: t.locationType,
                workExperienceId: newExp.id,
              })),
            );
          }
        }
      }

      if (impBlogs && impBlogs.length > 0) {
        for (const b of impBlogs as BlogData[]) {
          const [newBlog] = await tx
            .insert(blogPost)
            .values({
              slug: b.slug,
              coverImage: b.coverImage,
              imageAlt: b.imageAlt,
              status: b.status || "published",
              category: b.category,
              commentsEnabled: b.commentsEnabled ?? true,
              featured: b.featured,
              tags: b.tags,
            })
            .returning();

          if (b.translations && b.translations.length > 0) {
            await tx.insert(blogPostTranslation).values(
              b.translations.map((t) => ({
                language: t.language,
                title: t.title,
                description: t.description,
                content: t.content,
                readTime: t.readTime,
                date: t.date,
                excerpt: t.excerpt,
                metaTitle: t.metaTitle,
                metaDescription: t.metaDescription,
                keywords: t.keywords,
                blogPostId: newBlog.id,
              })),
            );
          }
        }
      }

      if (impProjects && impProjects.length > 0) {
        for (const prj of impProjects as ProjectData[]) {
          const [newProject] = await tx
            .insert(project)
            .values({
              slug: prj.slug,
              status: prj.status,
              category: prj.category,
              github: prj.github,
              liveDemo: prj.liveDemo,
              featured: prj.featured,
              coverImage: prj.coverImage,
              imageAlt: prj.imageAlt,
              images: prj.images,
            })
            .returning();

          if (prj.translations && prj.translations.length > 0) {
            await tx.insert(projectTranslation).values(
              prj.translations.map((t) => ({
                language: t.language,
                title: t.title,
                shortDescription: t.shortDescription,
                fullDescription: t.fullDescription,
                metaTitle: t.metaTitle,
                metaDescription: t.metaDescription,
                keywords: t.keywords,
                projectId: newProject.id,
              })),
            );
          }

          if (prj.technologies && prj.technologies.length > 0) {
            await tx.insert(_projectToSkill).values(
              (prj.technologies as unknown as { id: string }[]).map((tech) => ({
                A: newProject.id,
                B: tech.id,
              })),
            );
          }
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Import error:", error);
    throw new Error("Import failed: " + (error as Error).message);
  }
}

export async function deleteCommentAction(id: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const [deletedComment] = await db
    .delete(commentTable)
    .where(eq(commentTable.id, id))
    .returning();
  return deletedComment;
}

export async function fetchGithubReposAction() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const accessToken = (session as { accessToken?: string }).accessToken;
  if (!accessToken) {
    throw new Error(
      "GitHub erişim token'ı bulunamadı. Lütfen GitHub ile tekrar giriş yapın (logout/login).",
    );
  }

  try {
    const res = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 0 },
      },
    );

    if (!res.ok) {
      throw new Error(
        `GitHub Repoları alınamadı: ${res.status} ${res.statusText}`,
      );
    }

    const repos = await res.json();
    return repos.map(
      (repo: {
        id: number;
        name: string;
        description: string | null;
        html_url: string;
        homepage: string | null;
        language: string | null;
      }) => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        html_url: repo.html_url,
        homepage: repo.homepage,
        language: repo.language,
      }),
    );
  } catch (error) {
    console.error("Github repos fetch error:", error);
    throw new Error("GitHub istek hatası: " + (error as Error).message);
  }
}

export async function createSocialLinkAction(data: {
  name: string;
  href: string;
  icon: string;
}) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  )
    throw new Error("Unauthorized");
  const [newLink] = await db
    .insert(socialLink)
    .values({
      key: data.name.toLowerCase().replace(/\s+/g, "-"),
      name: data.name,
      href: data.href,
      icon: data.icon,
    })
    .returning();
  return newLink;
}

export async function deleteSocialLinkAction(id: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  )
    throw new Error("Unauthorized");
  await db.delete(socialLink).where(eq(socialLink.id, id));
  revalidatePath("/[locale]", "layout");
}

export async function deleteSkillAction(id: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  )
    throw new Error("Unauthorized");
  await db.delete(skill).where(eq(skill.id, id));
  revalidatePath("/[locale]", "layout");
}
