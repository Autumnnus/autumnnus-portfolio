import { NextResponse } from "next/server";
import * as simpleIcons from "simple-icons";

const allIcons = Object.values(simpleIcons)
  .filter(
    (val): val is simpleIcons.SimpleIcon => "title" in val && "slug" in val,
  )
  .map((icon) => ({
    title: icon.title,
    slug: icon.slug,
    hex: icon.hex,
    searchString: `${icon.title.toLowerCase()} ${icon.slug.toLowerCase()}`,
  }));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase();

    if (!query) {
      return NextResponse.json({ icons: [] });
    }

    const exactMatches = [];
    const startsWithMatches = [];
    const containsMatches = [];

    for (const icon of allIcons) {
      if (icon.title.toLowerCase() === query) {
        exactMatches.push(icon);
      } else if (icon.title.toLowerCase().startsWith(query)) {
        startsWithMatches.push(icon);
      } else if (icon.searchString.includes(query)) {
        containsMatches.push(icon);
      }
    }

    const results = [
      ...exactMatches,
      ...startsWithMatches,
      ...containsMatches,
    ].slice(0, 15);

    const mappedResults = results.map((result) => ({
      name: result.title,
      icon: `https://cdn.simpleicons.org/${result.slug}/${result.hex}`,
      hex: result.hex,
    }));

    return NextResponse.json({ icons: mappedResults });
  } catch (error) {
    console.error("SimpleIcons Search API Error:", error);
    return NextResponse.json(
      { error: "Failed to search icons" },
      { status: 500 },
    );
  }
}
