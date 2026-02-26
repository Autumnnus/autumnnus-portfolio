import {
  getBlogPostBySlug,
  getBlogPosts,
  getSimilarBlogPosts,
} from "@/app/actions";
import BlogPostView from "@/components/blog/BlogPostView";
import { LanguageType as Language } from "@/lib/db/schema";
import { BlogPost } from "@/types/contents";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const result = await getBlogPosts({
    lang: "en",
    limit: 100,
    skipAuth: true,
  });
  return result.items.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPostBySlug(slug, locale as Language, true);

  if (!post) {
    return {
      title: "Blog Not Found",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://autumnnus.com";
  const url = `${baseUrl}/${locale}/blog/${slug}`;
  const ogImage = post.coverImage
    ? [{ url: post.coverImage, alt: post.title }]
    : [];

  return {
    title: {
      default: post.metaTitle || post.title,
      template: `%s | Autumnnus Blog`,
    },
    description: post.metaDescription || post.description,
    keywords: post.keywords || post.tags,
    openGraph: {
      type: "article",
      locale: locale,
      url: url,
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.description,
      siteName: "Autumnnus",
      images: ogImage,
      publishedTime: post.date,
      authors: ["Autumnnus"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.description,
      images: ogImage,
    },
    alternates: {
      canonical: url,
      languages: {
        [locale]: url,
      },
    },
    robots: post.status === "draft" ? "noindex, nofollow" : "index, follow",
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  const post = await getBlogPostBySlug(slug, locale as Language);

  if (!post) {
    notFound();
  }

  const similarPosts = await getSimilarBlogPosts(
    post.id,
    locale as Language,
    2,
  );

  return (
    <BlogPostView
      post={post as unknown as BlogPost}
      relatedPosts={similarPosts as unknown as BlogPost[]}
    />
  );
}
