import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getFile } from "@/lib/minio";
import JSZip from "jszip";

const BUCKET = process.env.MINIO_BUCKET_NAME || "autumnnus-assets";

function getObjectName(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) {
    const parts = url.split(`/${BUCKET}/`);
    return parts[1] ?? null;
  }
  return url;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (
      !session?.user?.email ||
      session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const sectionsParam = url.searchParams.get("sections");
    const sections = sectionsParam
      ? new Set(sectionsParam.split(","))
      : new Set(["projects", "blogs", "skills", "experiences", "profile"]);

    const [projects, blogs, profileData, experiences, skills] =
      await Promise.all([
        sections.has("projects")
          ? db.query.project.findMany({
              with: { translations: true, technologies: true },
            })
          : Promise.resolve([]),
        sections.has("blogs")
          ? db.query.blogPost.findMany({ with: { translations: true } })
          : Promise.resolve([]),
        sections.has("profile")
          ? db.query.profile.findFirst({
              with: {
                translations: true,
                quests: { with: { translations: true } },
              },
            })
          : Promise.resolve(undefined),
        sections.has("experiences")
          ? db.query.workExperience.findMany({ with: { translations: true } })
          : Promise.resolve([]),
        sections.has("skills")
          ? db.query.skill.findMany()
          : Promise.resolve([]),
      ]);

    const zip = new JSZip();
    zip.file(
      "data.json",
      JSON.stringify(
        {
          timestamp: new Date(),
          sections: Array.from(sections),
          data: { projects, blogs, profile: profileData, experiences, skills },
        },
        null,
        2,
      ),
    );

    const assetsFolder = zip.folder("assets");
    if (!assetsFolder) throw new Error("Failed to create assets folder in zip");

    const addFileToZip = async (url: string | null | undefined) => {
      const objectName = getObjectName(url);
      if (!objectName) return;
      try {
        const buffer = await getFile(objectName);
        assetsFolder.file(objectName, buffer);
      } catch (err) {
        console.warn(`Failed to backup file: ${url}`, err);
      }
    };

    const downloadPromises: Promise<void>[] = [];

    if (sections.has("profile") && profileData?.avatar) {
      downloadPromises.push(addFileToZip(profileData.avatar));
    }

    if (sections.has("projects")) {
      for (const p of projects) {
        if (p.coverImage) downloadPromises.push(addFileToZip(p.coverImage));
        if (p.images) {
          for (const img of p.images) downloadPromises.push(addFileToZip(img));
        }
      }
    }

    if (sections.has("blogs")) {
      for (const b of blogs) {
        if (b.coverImage) downloadPromises.push(addFileToZip(b.coverImage));
      }
    }

    if (sections.has("skills")) {
      for (const s of skills) {
        if (s.icon?.startsWith("http"))
          downloadPromises.push(addFileToZip(s.icon));
      }
    }

    if (sections.has("experiences")) {
      for (const w of experiences) {
        if (w.logo) downloadPromises.push(addFileToZip(w.logo));
      }
    }

    await Promise.all(downloadPromises);

    const zipContent = await zip.generateAsync({ type: "nodebuffer" });

    return new Response(new Uint8Array(zipContent), {
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
