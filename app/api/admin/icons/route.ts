import { NextResponse } from "next/server";
import * as simpleIcons from "simple-icons";

// Create a searchable array of all simple-icons
// We map over the object keys, skip defaults, and structure for search
const allIcons = Object.values(simpleIcons)
  .filter(
    (val): val is simpleIcons.SimpleIcon => "title" in val && "slug" in val,
  )
  .map((icon) => ({
    title: icon.title,
    slug: icon.slug,
    hex: icon.hex,
    // Add a searchable string combining title and slug for better matching
    searchString: `${icon.title.toLowerCase()} ${icon.slug.toLowerCase()}`,
  }));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase();

    if (!query) {
      // If no query, return empty list or maybe top 20 default
      return NextResponse.json({ icons: [] });
    }

    // Basic fuzzy search logic:
    // 1. Exact match in title (Highest priority)
    // 2. Starts with query (High priority)
    // 3. Contains query (Medium priority)
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

    // Combine and limit results to prevent huge payload
    // usually 10-20 results is enough for autocomplete
    const results = [
      ...exactMatches,
      ...startsWithMatches,
      ...containsMatches,
    ].slice(0, 15);

    // Map back to just the necessary fields for client
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
