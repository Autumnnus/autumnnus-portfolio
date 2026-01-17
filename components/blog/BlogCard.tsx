"use client";

import { formatDate } from "@/lib/utils";
import { BlogPost } from "@/types/blog";
import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/Badge";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-card hover:bg-card/80 border border-border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      {/* Cover Image */}
      <div className="relative w-full h-48 sm:h-56 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30 group-hover:scale-110 transition-transform duration-300">
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

      {/* Content */}
      <div className="p-5 sm:p-6 space-y-3">
        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold leading-tight group-hover:text-primary transition-colors">
          {post.title}
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
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </div>

          <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
            Read More
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
