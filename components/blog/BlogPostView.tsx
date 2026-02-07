"use client";

import Container from "@/components/common/Container";
import ContentRenderer from "@/components/common/ContentRenderer";
import FadeIn from "@/components/common/FadeIn";
import CommentSection from "@/components/interactive/CommentSection";
import LikeButton from "@/components/interactive/LikeButton";
import ViewCounter from "@/components/interactive/ViewCounter";
import { Badge } from "@/components/ui/Badge";
import { BlogPost } from "@/types/contents";
import { ArrowLeft, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export default function BlogPostView({ post }: { post: BlogPost }) {
  const t = useTranslations("Blog");

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
          {t("back") || "Back"}
        </Link>
      </FadeIn>

      {/* Cover Image */}
      <FadeIn delay={0.2}>
        <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-linear-to-br from-primary/20 via-accent/20 to-secondary/20 rounded-lg overflow-hidden mb-8">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              unoptimized
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-9xl opacity-30">
              {post.tags[0] === "Frontend" && "🎨"}
              {!post.tags[0] && "📝"}
            </div>
          )}
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

          <div className="text-sm text-muted-foreground">{post.readTime}</div>

          <div className="ml-auto flex items-center gap-4">
            <ViewCounter itemId={post.id} itemType="blog" />
            <LikeButton itemId={post.id} itemType="blog" />
          </div>
        </div>
      </FadeIn>

      {/* Content */}
      <FadeIn delay={0.6}>
        <article className="max-w-none mb-12">
          <ContentRenderer content={post.content} />
        </article>
      </FadeIn>

      {/* Footer Likes */}
      <FadeIn delay={0.65}>
        <div className="flex justify-center mb-12">
          <LikeButton itemId={post.id} itemType="blog" />
        </div>
      </FadeIn>

      {/* Comments Section */}
      <FadeIn delay={0.7}>
        <CommentSection itemId={post.id} itemType="blog" />
      </FadeIn>
    </Container>
  );
}
