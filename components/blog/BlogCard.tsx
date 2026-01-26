"use client";

import { BlogPost } from "@/types/contents";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "../ui/Badge";

interface BlogCardProps {
  post: BlogPost;
  index?: number;
}

export default function BlogCard({ post, index = 0 }: BlogCardProps) {
  return (
    <motion.div
      // initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Link
        href={`/blog/${post.slug || "#"}`}
        className="group block bg-card hover:bg-card/80 border border-border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      >
        {/* Cover Image */}
        <div className="relative w-full h-48 sm:h-56 bg-linear-to-br from-primary/20 via-accent/20 to-secondary/20 overflow-hidden">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
              <FileText className="w-16 h-16" />
            </div>
          )}
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
              <time>{post.date}</time>
            </div>

            <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              Read More
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
