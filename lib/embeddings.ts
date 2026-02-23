import { getEmbeddingModel } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { deleteEmbeddingsBySource, upsertEmbedding } from "@/lib/vectordb";
import { Language } from "@prisma/client";

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
        `Failed to embed chunk ${i} for ${sourceType} ${sourceId}:`,
        error,
      );
    }
  }
}

export async function syncSingleContent(
  sourceType: "blog" | "project" | "profile" | "experience",
  sourceId: string,
) {
  await deleteEmbeddingsBySource(sourceType, sourceId);

  if (sourceType === "blog") {
    const blog = await prisma.blogPost.findUnique({
      where: { id: sourceId },
      include: { translations: true },
    });
    if (blog) {
      for (const t of blog.translations) {
        if (t.language === Language.tr || t.language === Language.en) {
          const header =
            `[blog] Title: ${t.title}` +
            ` | Slug: ${blog.slug}` +
            (blog.category ? ` | Category: ${blog.category}` : "") +
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
    const project = await prisma.project.findUnique({
      where: { id: sourceId },
      include: { translations: true, technologies: true },
    });
    if (project) {
      for (const t of project.translations) {
        if (t.language === Language.tr || t.language === Language.en) {
          const techs = project.technologies
            .map((tech) => tech.name)
            .join(", ");
          const header =
            `[project] Title: ${t.title}` +
            ` | Slug: ${project.slug}` +
            ` | Category: ${project.category}` +
            ` | Status: ${project.status}` +
            (techs ? ` | Technologies: ${techs}` : "") +
            (project.github ? ` | GitHub: ${project.github}` : "") +
            (project.liveDemo ? ` | Live Demo: ${project.liveDemo}` : "");
          await processAndEmbed(
            "project",
            project.id,
            t.language,
            header,
            t.shortDescription,
            t.fullDescription,
          );
        }
      }
    }
  } else if (sourceType === "profile") {
    const profile = await prisma.profile.findUnique({
      where: { id: sourceId },
      include: { translations: true },
    });
    if (profile) {
      for (const t of profile.translations) {
        if (t.language === Language.tr || t.language === Language.en) {
          const header =
            `[profile] Name: ${t.name}` +
            ` | Title: ${t.title}` +
            (profile.email ? ` | Email: ${profile.email}` : "") +
            (profile.github ? ` | GitHub: ${profile.github}` : "") +
            (profile.linkedin ? ` | LinkedIn: ${profile.linkedin}` : "");
          await processAndEmbed(
            "profile",
            profile.id,
            t.language,
            header,
            t.title,
            t.aboutDescription,
          );
        }
      }
    }
  } else if (sourceType === "experience") {
    const exp = await prisma.workExperience.findUnique({
      where: { id: sourceId },
      include: { translations: true },
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
  const blogs = await prisma.blogPost.findMany({
    include: { translations: true },
  });

  for (const blog of blogs) {
    for (const t of blog.translations) {
      if (t.language === Language.tr || t.language === Language.en) {
        const header =
          `[blog] Title: ${t.title}` +
          ` | Slug: ${blog.slug}` +
          (blog.category ? ` | Category: ${blog.category}` : "") +
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

  const projects = await prisma.project.findMany({
    include: { translations: true, technologies: true },
  });

  for (const project of projects) {
    for (const t of project.translations) {
      if (t.language === Language.tr || t.language === Language.en) {
        const techs = project.technologies.map((tech) => tech.name).join(", ");
        const header =
          `[project] Title: ${t.title}` +
          ` | Slug: ${project.slug}` +
          ` | Category: ${project.category}` +
          ` | Status: ${project.status}` +
          (techs ? ` | Technologies: ${techs}` : "") +
          (project.github ? ` | GitHub: ${project.github}` : "") +
          (project.liveDemo ? ` | Live Demo: ${project.liveDemo}` : "");
        await processAndEmbed(
          "project",
          project.id,
          t.language,
          header,
          t.shortDescription,
          t.fullDescription,
        );
      }
    }
  }

  const profiles = await prisma.profile.findMany({
    include: { translations: true },
  });

  for (const profile of profiles) {
    for (const t of profile.translations) {
      if (t.language === Language.tr || t.language === Language.en) {
        const header =
          `[profile] Name: ${t.name}` +
          ` | Title: ${t.title}` +
          (profile.email ? ` | Email: ${profile.email}` : "") +
          (profile.github ? ` | GitHub: ${profile.github}` : "") +
          (profile.linkedin ? ` | LinkedIn: ${profile.linkedin}` : "");
        await processAndEmbed(
          "profile",
          profile.id,
          t.language,
          header,
          t.title,
          t.aboutDescription,
        );
      }
    }
  }

  const experiences = await prisma.workExperience.findMany({
    include: { translations: true },
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
