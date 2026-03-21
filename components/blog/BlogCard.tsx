"use client";

import Badge from "@/components/ui/badge";
import { BlogPost } from "@/types/contents";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

interface BlogCardProps {
  post: BlogPost;
  index?: number;
}

export default function BlogCard({ post, index = 0 }: BlogCardProps) {
  const t = useTranslations("Common");
  const bT = useTranslations("Blog");
  const isFeatured = Boolean(post.featured);
  const featuredCardClasses =
    "border-amber-700/60 dark:border-amber-300/70 bg-linear-to-br from-amber-900/10 via-card to-yellow-900/10 dark:from-amber-950/10 dark:to-yellow-950/10 shadow-[0_0_0_1px_rgba(180,83,9,0.18),0_0_24px_rgba(180,83,9,0.1)] dark:shadow-[0_0_0_1px_rgba(251,191,36,0.2),0_0_32px_rgba(251,191,36,0.12)] hover:border-amber-600/80 dark:hover:border-amber-100/90 hover:shadow-[0_0_0_1px_rgba(180,83,9,0.28),0_0_32px_rgba(180,83,9,0.16)] dark:hover:shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_0_42px_rgba(251,191,36,0.2)]";

  return (
    <motion.div
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Link
        href={`/blog/${post.slug || "#"}`}
        title={post.title}
        className={`group relative flex h-[31rem] sm:h-[33rem] flex-col bg-card hover:bg-card/80 border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
          isFeatured ? featuredCardClasses : "border-border"
        }`}
      >
        {isFeatured && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 rounded-lg"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(180,83,9,0.12),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(120,53,15,0.14),_transparent_28%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,236,179,0.18),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(120,53,15,0.16),_transparent_28%)]" />
            <div className="absolute inset-[6px] rounded-[13px] border border-amber-700/25 shadow-[inset_0_0_0_1px_rgba(120,53,15,0.12)] dark:border-amber-100/30 dark:shadow-[inset_0_0_0_1px_rgba(255,248,220,0.18)]" />
            <div className="absolute inset-[12px] rounded-[10px] border border-amber-700/15 dark:border-amber-200/15" />
            <div className="absolute left-1/2 top-[7px] h-7 w-20 -translate-x-1/2 rounded-b-[1rem] border-x border-b border-amber-700/45 bg-linear-to-b from-amber-700/10 to-transparent dark:border-amber-100/45 dark:from-amber-100/20" />
            <div className="absolute left-1/2 top-[5px] flex -translate-x-1/2 items-center gap-1.5">
              <span className="h-1.5 w-1.5 rotate-45 rounded-[2px] border border-amber-800/70 bg-amber-600/90 dark:border-amber-50/80 dark:bg-amber-200 dark:shadow-[0_0_14px_rgba(251,191,36,0.9)]" />
              <span className="h-2.5 w-2.5 rounded-full border border-amber-800/70 bg-gradient-to-b from-amber-200 to-amber-600 dark:border-amber-50/80 dark:from-amber-50 dark:to-amber-300 dark:shadow-[0_0_16px_rgba(251,191,36,0.9)]" />
              <span className="h-1.5 w-1.5 rotate-45 rounded-[2px] border border-amber-800/70 bg-amber-600/90 dark:border-amber-50/80 dark:bg-amber-200 dark:shadow-[0_0_14px_rgba(251,191,36,0.9)]" />
            </div>
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-700/90 to-transparent dark:via-amber-100" />
            <div className="absolute inset-x-8 top-5 h-px bg-gradient-to-r from-transparent via-amber-600/60 to-transparent dark:via-amber-200/70" />
            <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-700/60 to-transparent dark:via-amber-200/60" />
            <div className="absolute left-0 top-0 h-12 w-12 rounded-tl-lg border-l border-t border-amber-700/75 dark:border-amber-100/75" />
            <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-lg border-r border-t border-amber-700/75 dark:border-amber-100/75" />
            <div className="absolute left-0 bottom-0 h-12 w-12 rounded-bl-lg border-l border-b border-amber-700/50 dark:border-amber-200/55" />
            <div className="absolute right-0 bottom-0 h-12 w-12 rounded-br-lg border-r border-b border-amber-700/50 dark:border-amber-200/55" />
            <div className="absolute left-3 top-10 bottom-14 w-px bg-gradient-to-b from-transparent via-amber-700/55 to-transparent dark:via-amber-200/60" />
            <div className="absolute right-3 top-10 bottom-14 w-px bg-gradient-to-b from-transparent via-amber-700/55 to-transparent dark:via-amber-200/60" />
            <div className="absolute left-1/2 bottom-2 flex -translate-x-1/2 items-center gap-2">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-amber-700/80 dark:to-amber-200/80" />
              <span className="h-2 w-2 rotate-45 rounded-[2px] border border-amber-800/70 bg-amber-600/90 dark:border-amber-50/70 dark:bg-amber-200/90" />
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-amber-700/80 dark:to-amber-200/80" />
            </div>
          </div>
        )}

        <div className="relative z-10 flex h-full flex-col">
          {/* Cover Image */}
          <div className="relative w-full h-48 sm:h-56 bg-linear-to-br from-primary/20 via-accent/20 to-secondary/20 overflow-hidden">
            {post.coverImage ? (
              <Image
                src={post.coverImage}
                alt={post.title}
                title={post.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
                <FileText className="w-16 h-16" suppressHydrationWarning />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-5 sm:p-6 space-y-3">
            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold leading-tight group-hover:text-primary transition-colors flex items-center gap-2">
              {post.title}
              {post.status === "draft" ? (
                <span className="bg-amber-500/10 text-amber-500 text-[10px] py-0.5 px-2 rounded-full uppercase font-bold tracking-tighter border border-amber-500/20 flex items-center gap-1">
                  <FileText size={10} />
                  {bT("draft")}
                </span>
              ) : (
                <span className="bg-green-500/10 text-green-500 text-[10px] py-0.5 px-2 rounded-full uppercase font-bold tracking-tighter border border-green-500/20 flex items-center gap-1">
                  <ArrowRight size={10} />
                  {bT("published")}
                </span>
              )}
            </h3>

            {/* Description */}
            <p className="text-muted-foreground text-sm sm:text-base line-clamp-2">
              {post.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" suppressHydrationWarning />
                <time>{post.date}</time>
              </div>

              <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                {t("readMore")}
                <ArrowRight className="w-4 h-4" suppressHydrationWarning />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
