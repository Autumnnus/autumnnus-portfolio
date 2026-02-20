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
  title: string,
  description: string,
  content: string,
) {
  const fullText = `Title: ${title}\nDescription: ${description}\nContent: ${content}`;
  const chunks = chunkText(fullText);

  console.log(
    `Processing ${sourceType} ${sourceId} (${language}) - ${chunks.length} chunks`,
  );

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
  console.log(`Starting single content sync for ${sourceType} ${sourceId}...`);

  await deleteEmbeddingsBySource(sourceType, sourceId);

  if (sourceType === "blog") {
    const blog = await prisma.blogPost.findUnique({
      where: { id: sourceId },
      include: { translations: true },
    });
    if (blog && blog.status === "published") {
      for (const t of blog.translations) {
        if (t.language === Language.tr || t.language === Language.en) {
          await processAndEmbed(
            "blog",
            blog.id,
            t.language,
            t.title,
            t.description,
            t.content,
          );
        }
      }
    }
  } else if (sourceType === "project") {
    const project = await prisma.project.findUnique({
      where: { id: sourceId },
      include: { translations: true },
    });
    if (project && project.status === "Completed") {
      for (const t of project.translations) {
        if (t.language === Language.tr || t.language === Language.en) {
          await processAndEmbed(
            "project",
            project.id,
            t.language,
            t.title,
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
          await processAndEmbed(
            "profile",
            profile.id,
            t.language,
            t.name,
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
          await processAndEmbed(
            "experience",
            exp.id,
            t.language,
            t.role,
            t.locationType,
            t.description,
          );
        }
      }
    }
  }

  console.log(`Finished single content sync for ${sourceType} ${sourceId}`);
}

export async function syncAllContent() {
  console.log("Starting full content sync...");

  // 1. Sync Blogs
  const blogs = await prisma.blogPost.findMany({
    include: { translations: true },
    where: { status: "published" }, // Only published blogs
  });

  for (const blog of blogs) {
    for (const t of blog.translations) {
      if (t.language === Language.tr || t.language === Language.en) {
        await processAndEmbed(
          "blog",
          blog.id,
          t.language,
          t.title,
          t.description,
          t.content,
        );
      }
    }
  }

  // 2. Sync Projects
  const projects = await prisma.project.findMany({
    include: {
      translations: {
        include: { project: { select: { technologies: true } } },
      },
    }, // technologies needed?
    where: { status: "Completed" }, // Only completed projects? Or all. Let's do all.
  });

  for (const project of projects) {
    for (const t of project.translations) {
      if (t.language === Language.tr || t.language === Language.en) {
        // Include tech stack in content
        // const techs = project.technologies.map(t => t.name).join(", ");
        // We need to fetch techs separately or include differently.
        // Re-fetching project to get techs if not joined properly above.
        // Actually relations are fine.
        // Let's simplified process.
        await processAndEmbed(
          "project",
          project.id,
          t.language,
          t.title,
          t.shortDescription,
          t.fullDescription,
        );
      }
    }
  }

  // 3. Sync Profile
  const profiles = await prisma.profile.findMany({
    include: { translations: true },
  });

  for (const profile of profiles) {
    for (const t of profile.translations) {
      if (t.language === Language.tr || t.language === Language.en) {
        await processAndEmbed(
          "profile",
          profile.id,
          t.language,
          t.name,
          t.title,
          t.aboutDescription,
        );
      }
    }
  }

  // 4. Sync Work Experience
  const experiences = await prisma.workExperience.findMany({
    include: { translations: true },
  });

  for (const exp of experiences) {
    for (const t of exp.translations) {
      if (t.language === Language.tr || t.language === Language.en) {
        await processAndEmbed(
          "experience",
          exp.id,
          t.language,
          t.role,
          t.locationType,
          t.description,
        );
      }
    }
  }

  console.log("Full content sync completed!");
}
