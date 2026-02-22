import { getBlogPosts, getProjects } from "@/app/actions";
import { routing } from "@/i18n/routing";
import { Language } from "@prisma/client";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://autumnnus.com";
  const locales = routing.locales;

  // Static routes
  const staticRoutes = ["", "/blog", "/projects"];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate static route entries for all locales
  for (const locale of locales) {
    for (const route of staticRoutes) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: route === "" ? 1 : 0.8,
      });
    }
  }

  // Fetch all blog posts (using 'en' to get the list, then we'll generate urls for all locales)
  // We assume slugs are the same across locales or we need to handle localized slugs.
  // In this project, look at schema: BlogPost has a unique 'slug'.
  // Translations are linked to BlogPost.
  // So the slug is shared?
  // Schema: `slug String @unique` in `BlogPost` model.
  // The URL structure is `/[locale]/blog/[slug]`.
  // unique slug implies it's the same for all languages or
  // the slug itself is language-agnostic (e.g. valid for all).
  // If the slug is "hello-world", it is /en/blog/hello-world and /tr/blog/hello-world.
  // So we just need the list of slugs.

  const { items: blogPosts } = await getBlogPosts({
    lang: Language.en,
    limit: 1000, // Fetch all
    skipAuth: true,
  });

  for (const post of blogPosts) {
    for (const locale of locales) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // Fetch all projects
  const { items: projects } = await getProjects({
    lang: Language.en,
    limit: 1000,
  });

  for (const project of projects) {
    for (const locale of locales) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/projects/${project.slug}`,
        lastModified: project.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return sitemapEntries;
}
