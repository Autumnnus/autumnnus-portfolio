import { getBlogPostBySlug, getBlogPosts } from "@/app/actions";
import BlogPostView from "@/components/blog/BlogPostView";
import { BlogPost } from "@/types/contents";
import { Language } from "@prisma/client";
import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const result = await getBlogPosts({ lang: Language.en, limit: 100 });
  return result.items.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = await getBlogPostBySlug(slug, locale as Language);

  if (!post) {
    return {
      title: "Blog Not Found",
    };
  }

  return {
    title: `${post.title} | Autumnnus Blog`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const post = await getBlogPostBySlug(slug, locale as Language);

  if (!post) {
    notFound();
  }

  return <BlogPostView post={post as unknown as BlogPost} />;
}
