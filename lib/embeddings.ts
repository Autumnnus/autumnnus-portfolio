import { db } from "@/lib/db";
import { blogPost, profile, project, workExperience } from "@/lib/db/schema";
import { getEmbeddingModel } from "@/lib/gemini";
import { deleteEmbeddingsBySource, upsertEmbedding } from "@/lib/vectordb";
import { eq } from "drizzle-orm";

const Language = { tr: "tr", en: "en" } as const;

const MAX_CHUNK_SIZE = 1000;

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export function chunkText(
  text: string,
  maxChunkSize: number = MAX_CHUNK_SIZE,
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const word of words) {
    if ((currentChunk + " " + word).length > maxChunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${word}` : word;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function processAndEmbed(
  sourceType: "blog" | "project" | "profile" | "experience",
  sourceId: string,
  language: string,
  header: string,
  description: string,
  content: string,
) {
  const fullText = `${header}\nDescription: ${description}\nContent: ${content}`;
  const chunks = chunkText(fullText);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      const embedding = await generateEmbedding(chunk);
      await upsertEmbedding(
        sourceType,
        sourceId,
        language,
        i,
        chunk,
        embedding,
      );
    } catch (error) {
      console.error(
        `CRITICAL: Failed to embed chunk ${i} for ${sourceType} ${sourceId}:`,
        error,
      );
      throw error;
    }
  }
}

export async function syncSingleContent(
  sourceType: "blog" | "project" | "profile" | "experience",
  sourceId: string,
) {
  await deleteEmbeddingsBySource(sourceType, sourceId);

  if (sourceType === "blog") {
    const blog = await db.query.blogPost.findFirst({
      where: eq(blogPost.id, sourceId),
      with: { translations: true, category: true },
    });
    if (blog) {
      for (const t of blog.translations) {
        if (t.language === Language.tr || t.language === Language.en) {
          const header =
            `[blog] Title: ${t.title}` +
            ` | Slug: ${blog.slug}` +
            (blog.category ? ` | Category: ${blog.category.name}` : "") +
            (blog.tags?.length ? ` | Tags: ${blog.tags.join(", ")}` : "");
          await processAndEmbed(
            "blog",
            blog.id,
            t.language,
            header,
            t.description,
            t.content,
          );
        }
      }
    }
  } else if (sourceType === "project") {
    const prj = await db.query.project.findFirst({
      where: eq(project.id, sourceId),
      with: {
        translations: true,
        technologies: { with: { skill: true } },
        category: true,
      },
    });
    if (prj) {
      for (const t of prj.translations) {
        if (t.language === Language.tr || t.language === Language.en) {
          const techs = prj.technologies
            .map((tech) => tech.skill.name)
            .join(", ");
          const header =
            `[project] Title: ${t.title}` +
            ` | Slug: ${prj.slug}` +
            (prj.category ? ` | Category: ${prj.category.name}` : "") +
            ` | Status: ${prj.status}` +
            (techs ? ` | Technologies: ${techs}` : "") +
            (prj.github ? ` | GitHub: ${prj.github}` : "") +
            (prj.liveDemo ? ` | Live Demo: ${prj.liveDemo}` : "");
          await processAndEmbed(
            "project",
            prj.id,
            t.language,
            header,
            t.shortDescription,
            t.fullDescription,
          );
        }
      }
    }
  } else if (sourceType === "profile") {
    const prof = await db.query.profile.findFirst({
      where: eq(profile.id, sourceId),
      with: { translations: true },
    });
    if (prof) {
      for (const t of prof.translations) {
        if (t.language === Language.tr || t.language === Language.en) {
          const header =
            `[profile] Name: ${t.name}` +
            ` | Title: ${t.title}` +
            (prof.email ? ` | Email: ${prof.email}` : "") +
            (prof.github ? ` | GitHub: ${prof.github}` : "") +
            (prof.linkedin ? ` | LinkedIn: ${prof.linkedin}` : "");
          await processAndEmbed(
            "profile",
            prof.id,
            t.language,
            header,
            t.title,
            t.aboutDescription,
          );
        }
      }
    }
  } else if (sourceType === "experience") {
    const exp = await db.query.workExperience.findFirst({
      where: eq(workExperience.id, sourceId),
      with: { translations: true },
    });
    if (exp) {
      for (const t of exp.translations) {
        if (t.language === Language.tr || t.language === Language.en) {
          const startDate = exp.startDate
            ? exp.startDate.getFullYear().toString()
            : "";
          const endDate = exp.endDate
            ? exp.endDate.getFullYear().toString()
            : "Present";
          const header =
            `[experience] Company: ${exp.company}` +
            ` | Role: ${t.role}` +
            ` | Location Type: ${t.locationType}` +
            (startDate ? ` | Period: ${startDate} - ${endDate}` : "");
          await processAndEmbed(
            "experience",
            exp.id,
            t.language,
            header,
            t.locationType,
            t.description,
          );
        }
      }
    }
  }
}

export async function syncAllContent() {
  const blogs = await db.query.blogPost.findMany({
    with: { translations: true, category: true },
  });

  for (const blog of blogs) {
    for (const t of blog.translations) {
      if (t.language === Language.tr || t.language === Language.en) {
        const header =
          `[blog] Title: ${t.title}` +
          ` | Slug: ${blog.slug}` +
          (blog.category ? ` | Category: ${blog.category.name}` : "") +
          (blog.tags?.length ? ` | Tags: ${blog.tags.join(", ")}` : "");
        await processAndEmbed(
          "blog",
          blog.id,
          t.language,
          header,
          t.description,
          t.content,
        );
      }
    }
  }

  const projects = await db.query.project.findMany({
    with: {
      translations: true,
      technologies: { with: { skill: true } },
      category: true,
    },
  });

  for (const prj of projects) {
    for (const t of prj.translations) {
      if (t.language === Language.tr || t.language === Language.en) {
        const techs = prj.technologies
          .map((tech) => tech.skill.name)
          .join(", ");
        const header =
          `[project] Title: ${t.title}` +
          ` | Slug: ${prj.slug}` +
          (prj.category ? ` | Category: ${prj.category.name}` : "") +
          ` | Status: ${prj.status}` +
          (techs ? ` | Technologies: ${techs}` : "") +
          (prj.github ? ` | GitHub: ${prj.github}` : "") +
          (prj.liveDemo ? ` | Live Demo: ${prj.liveDemo}` : "");
        await processAndEmbed(
          "project",
          prj.id,
          t.language,
          header,
          t.shortDescription,
          t.fullDescription,
        );
      }
    }
  }

  const profiles = await db.query.profile.findMany({
    with: { translations: true },
  });

  for (const prof of profiles) {
    for (const t of prof.translations) {
      if (t.language === Language.tr || t.language === Language.en) {
        const header =
          `[profile] Name: ${t.name}` +
          ` | Title: ${t.title}` +
          (prof.email ? ` | Email: ${prof.email}` : "") +
          (prof.github ? ` | GitHub: ${prof.github}` : "") +
          (prof.linkedin ? ` | LinkedIn: ${prof.linkedin}` : "");
        await processAndEmbed(
          "profile",
          prof.id,
          t.language,
          header,
          t.title,
          t.aboutDescription,
        );
      }
    }
  }

  const experiences = await db.query.workExperience.findMany({
    with: { translations: true },
  });

  for (const exp of experiences) {
    for (const t of exp.translations) {
      if (t.language === Language.tr || t.language === Language.en) {
        const startDate = exp.startDate
          ? exp.startDate.getFullYear().toString()
          : "";
        const endDate = exp.endDate
          ? exp.endDate.getFullYear().toString()
          : "Present";
        const header =
          `[experience] Company: ${exp.company}` +
          ` | Role: ${t.role}` +
          ` | Location Type: ${t.locationType}` +
          (startDate ? ` | Period: ${startDate} - ${endDate}` : "");
        await processAndEmbed(
          "experience",
          exp.id,
          t.language,
          header,
          t.locationType,
          t.description,
        );
      }
    }
  }
}
