"use client";

import PixelIcon from "@/components/pixel/PixelIcon";
import Reveal from "@/components/pixel/Reveal";
import { cn } from "@/lib/utils";
import { BlogPost } from "@/types/contents";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

interface BlogCardProps {
  post: BlogPost;
  index?: number;
}

const MAX_TAGS = 4;

export default function BlogCard({ post, index = 0 }: BlogCardProps) {
  const t = useTranslations("Common");
  const bT = useTranslations("Blog");
  const featured = Boolean(post.featured);
  const tags = post.tags.slice(0, MAX_TAGS);

  return (
    <Reveal delay={(index % 2) * 110} className="h-full p-2">
      <Link
        href={`/blog/${post.slug || "#"}`}
        title={post.title}
        className={cn(
          "group relative flex h-full flex-col transition-transform duration-100 hover:-translate-y-1",
          featured ? "pixel-panel-featured" : "pixel-panel",
        )}
      >
        <span className="card-shine relative block h-44 overflow-hidden border-b-4 border-px-ink bg-slot sm:h-48">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <span className="card-pattern flex h-full items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center bg-card text-primary pixel-frame">
                <PixelIcon name="leaf" className="h-8 w-8 dark:hidden" />
                <PixelIcon name="snowflake" className="hidden h-8 w-8 dark:block" />
              </span>
            </span>
          )}
          {post.category?.name && (
            <span className="absolute left-3 top-3 bg-card px-2 py-1 font-pixel text-sm pixel-frame-sm">
              {post.category.name}
            </span>
          )}
          {featured && (
            <span className="card-star absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-gold text-px-ink pixel-frame-sm">
              <PixelIcon name="star" className="h-5 w-5" />
            </span>
          )}
        </span>

        <span className="flex flex-1 flex-col gap-3.5 p-5">
          <span className="flex items-start gap-3">
            <span className="font-pixel text-2xl leading-tight font-bold transition-colors duration-100 group-hover:text-ember">
              {post.title}
            </span>
            {post.status === "draft" && (
              <span className="mt-1 shrink-0 bg-gold px-2 py-0.5 font-pixel text-xs text-px-ink">
                {bT("draft")}
              </span>
            )}
          </span>

          <span className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.description}
          </span>

          {tags.length > 0 && (
            <span className="flex flex-wrap gap-2 p-[2px]">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-1 font-pixel text-xs pixel-chip">
                  #{tag}
                </span>
              ))}
            </span>
          )}

          <span className="mt-auto flex items-center justify-between gap-3 border-t-4 border-dashed border-slot pt-3.5">
            <span className="flex items-center gap-3 font-pixel text-xs text-muted-foreground">
              <time>{post.date}</time>
              {post.readTime && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{post.readTime}</span>
                </>
              )}
            </span>
            <span className="flex items-center gap-2 font-pixel text-base font-semibold text-ember">
              {t("readMore")}
              <PixelIcon
                name="arrowSmall"
                className="h-2.5 w-1.5 transition-transform duration-100 group-hover:translate-x-1"
              />
            </span>
          </span>
        </span>
      </Link>
    </Reveal>
  );
}
