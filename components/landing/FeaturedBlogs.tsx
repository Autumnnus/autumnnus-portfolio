"use client";

import BlogCard from "@/components/blog/BlogCard";
import SectionHeading from "@/components/common/SectionHeading";
import { useLanguage } from "@/components/providers/LanguageContext";
import { BlogPost } from "@/types/contents";
import Link from "next/link";

interface FeaturedBlogsProps {
  posts: BlogPost[];
}

export default function FeaturedBlogs({ posts }: FeaturedBlogsProps) {
  const { content } = useLanguage();
  const featuredPosts = posts.slice(0, 2);

  return (
    <section className="py-12" id="blog">
      <SectionHeading
        subHeading={content.blog.viewAllText}
        heading={content.blog.title}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {featuredPosts.map((post, index) => (
          <BlogCard key={post.slug} post={post} index={index} />
        ))}
      </div>

      <div className="flex justify-center">
        <Link href="/blog" className="pixel-btn">
          {content.blog.viewAllText} →
        </Link>
      </div>
    </section>
  );
}
