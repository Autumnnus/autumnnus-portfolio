import BlogPostView from "@/components/blog/BlogPostView";
import { portfolioContent } from "@/config/contents";
import { Metadata } from "next";

// We use the English content for static generation and metadata
const blogPosts = portfolioContent.en.blog.items || [];

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

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

  return <BlogPostView slug={slug} />;
}
