import CommentSection from "@/components/blog/CommentSection";
import Container from "@/components/common/Container";
import { Badge } from "@/components/ui/Badge";
import { blogPosts } from "@/config/blog";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Heart,
  MessageSquare,
  Share2,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <Container className="py-12 sm:py-20">
      {/* Back Button */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      {/* Cover Image */}
      <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 rounded-lg overflow-hidden mb-8">
        <div className="absolute inset-0 flex items-center justify-center text-9xl opacity-30">
          {post.tags[0] === "Frontend" && "🎨"}
          {post.tags[0] === "Go" && "🐹"}
          {post.tags[0] === "Next.js" && "▲"}
          {post.tags[0] === "TypeScript" && "📘"}
          {post.tags[0] === "CSS" && "🎭"}
          {post.tags[0] === "Development" && "💻"}
          {post.tags[0] === "React" && "⚛️"}
          {post.tags[0] === "Personal" && "✨"}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {post.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Title and Description */}
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
          {post.title}
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          {post.description}
        </p>
      </div>

      {/* Meta Info and Stats */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 pb-8 mb-8 border-b border-border">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 ml-auto">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <Heart className="w-4 h-4" />
            <span>{post.stats.likes}</span>
          </button>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>{post.stats.views}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span>{post.stats.comments}</span>
          </div>

          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <article className="prose prose-lg dark:prose-invert max-w-none mb-12">
        <div className="whitespace-pre-line leading-relaxed">
          {post.content.split("\n").map((paragraph, index) => {
            // Handle headings
            if (paragraph.startsWith("## ")) {
              return (
                <h2 key={index} className="text-2xl font-bold mt-8 mb-4">
                  {paragraph.replace("## ", "")}
                </h2>
              );
            }
            if (paragraph.startsWith("### ")) {
              return (
                <h3 key={index} className="text-xl font-bold mt-6 mb-3">
                  {paragraph.replace("### ", "")}
                </h3>
              );
            }

            // Handle list items
            if (paragraph.startsWith("- ")) {
              return (
                <li key={index} className="ml-6">
                  {paragraph.replace("- ", "")}
                </li>
              );
            }

            // Handle bold text
            const boldRegex = /\*\*(.*?)\*\*/g;
            if (boldRegex.test(paragraph)) {
              const parts = paragraph.split(boldRegex);
              return (
                <p key={index} className="mb-4">
                  {parts.map((part, i) =>
                    i % 2 === 1 ? (
                      <strong key={i} className="font-bold">
                        {part}
                      </strong>
                    ) : (
                      part
                    ),
                  )}
                </p>
              );
            }

            // Regular paragraph
            if (paragraph.trim()) {
              return (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              );
            }

            return null;
          })}
        </div>
      </article>

      {/* Comments Section */}
      <CommentSection postSlug={slug} />
    </Container>
  );
}
