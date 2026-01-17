"use client";

import CommentSection from "@/components/blog/CommentSection";
import Container from "@/components/common/Container";
import ContentRenderer from "@/components/common/ContentRenderer";
import FadeIn from "@/components/common/FadeIn";
import { useLanguage } from "@/components/providers/LanguageContext";
import { Badge } from "@/components/ui/Badge";
import { BlogPost } from "@/types/contents";
import { ArrowLeft, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BlogPostView({ slug }: { slug: string }) {
  const { content } = useLanguage();
  const t = useTranslations("Blog");
  const blogPosts = content.blog.items || [];

  const [post, setPost] = useState<BlogPost | undefined>();

  useEffect(() => {
    const foundPost = blogPosts.find((p) => p.slug === slug);
    if (foundPost) {
      setPost(foundPost);
    }
  }, [slug, blogPosts]);

  if (!post) {
    return null;
  }

  return (
    <Container className="py-12 sm:py-20">
      {/* Back Button */}
      <FadeIn delay={0.1}>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </Link>
      </FadeIn>

      {/* Cover Image */}
      <FadeIn delay={0.2}>
        <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-linear-to-br from-primary/20 via-accent/20 to-secondary/20 rounded-lg overflow-hidden mb-8">
          <div className="absolute inset-0 flex items-center justify-center text-9xl opacity-30">
            {/* Fallback icons based on tags logic or just a default */}
            {post.tags[0] === "Frontend" && "🎨"}
            {/* ... other mappings ... */}
            {!post.tags[0] && "📝"}
          </div>
        </div>
      </FadeIn>

      {/* Tags */}
      <FadeIn delay={0.3}>
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </FadeIn>

      {/* Title and Description */}
      <FadeIn delay={0.4}>
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            {post.title}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            {post.description}
          </p>
        </div>
      </FadeIn>

      {/* Meta Info and Stats */}
      <FadeIn delay={0.5}>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pb-8 mb-8 border-b border-border">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <time dateTime={post.date}>{post.date}</time>
          </div>

          {/* Stats if available in type, or placeholders */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Assuming stats are not in the localized type yet or not migrated, we can hide or use generic */}
            {/* If stats are needed, they should be added to BlogPost interface. For now, hiding or static. */}
          </div>
        </div>
      </FadeIn>

      {/* Content */}
      <FadeIn delay={0.6}>
        <article className="max-w-none mb-12">
          <ContentRenderer content={post.content} />
        </article>
      </FadeIn>

      {/* Comments Section */}
      <FadeIn delay={0.7}>
        <CommentSection postSlug={slug} />
      </FadeIn>
    </Container>
  );
}
