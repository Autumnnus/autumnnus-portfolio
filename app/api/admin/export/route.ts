import { auth } from "@/auth";
import { getFile } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (
      !session?.user?.email ||
      session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    const [projects, blogs, profile, experiences, skills] = await Promise.all([
      prisma.project.findMany({
        include: { translations: true, technologies: true },
      }),
      prisma.blogPost.findMany({
        include: { translations: true },
      }),
      prisma.profile.findFirst({
        include: { translations: true },
      }),
      prisma.workExperience.findMany({
        include: { translations: true },
      }),
      prisma.skill.findMany(),
    ]);

    const data = {
      projects,
      blogs,
      profile,
      experiences,
      skills,
    };

    const zip = new JSZip();
    zip.file(
      "data.json",
      JSON.stringify({ timestamp: new Date(), data }, null, 2),
    );

    const assetsFolder = zip.folder("assets");
    if (!assetsFolder) throw new Error("Failed to create folder in zip");

    const addFileToZip = async (url: string | null | undefined) => {
      if (!url) return;
      try {
        const buffer = await getFile(url);
        const filename = url.split("/").pop() || `file-${Date.now()}`;

        let zipPath = filename;
        if (url.includes(process.env.MINIO_BUCKET_NAME || "autumnnus-assets")) {
          const parts = url.split(
            `/${process.env.MINIO_BUCKET_NAME || "autumnnus-assets"}/`,
          );
          if (parts[1]) zipPath = parts[1];
        }

        assetsFolder.file(zipPath, buffer);
      } catch (error) {
        console.warn(`Failed to backup file: ${url}`, error);
      }
    };

    const downloadPromises: Promise<void>[] = [];

    if (profile?.avatar) downloadPromises.push(addFileToZip(profile.avatar));

    for (const p of projects) {
      if (p.coverImage) downloadPromises.push(addFileToZip(p.coverImage));
      for (const img of p.images) {
        downloadPromises.push(addFileToZip(img));
      }
    }

    for (const b of blogs) {
      if (b.coverImage) downloadPromises.push(addFileToZip(b.coverImage));
    }

    for (const s of skills) {
      if (s.icon) downloadPromises.push(addFileToZip(s.icon));
    }

    for (const w of experiences) {
      if (w.logo) downloadPromises.push(addFileToZip(w.logo));
    }

    await Promise.all(downloadPromises);

    const zipContent = await zip.generateAsync({ type: "nodebuffer" });

    return new Response(zipContent, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().split("T")[0]}.zip"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
