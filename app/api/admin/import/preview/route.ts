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
    const { projects, blogs, profile, experiences, skills } = data ?? {};

    let assetCount = 0;
    zip.folder("assets")?.forEach((_, f) => {
      if (!f.dir) assetCount++;
    });

    return Response.json({
      timestamp,
      projects: {
        count: projects?.length ?? 0,
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
        items: (skills ?? []).map((s: any) => s.name).slice(0, 12),
      },
      experiences: {
        count: experiences?.length ?? 0,
        items: (experiences ?? []).map((e: any) => e.company).slice(0, 8),
      },
      profile: {
        exists: !!profile,
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
