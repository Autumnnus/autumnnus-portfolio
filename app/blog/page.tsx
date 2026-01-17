"use client";

import BlogCard from "@/components/blog/BlogCard";
import Container from "@/components/common/Container";
import { useLanguage } from "@/components/providers/LanguageContext";
import { Badge } from "@/components/ui/Badge";

export default function BlogPage() {
  const { content } = useLanguage();
  const blogPosts = content.blog.items || [];
  const postCount = blogPosts.length;

  // Calculate tags dynamically
  const tagCounts = new Map<string, number>();
  blogPosts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  const tags = Array.from(tagCounts.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <Container className="py-12 sm:py-20">
      {/* Header */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          {content.blog.title}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {content.blog.description}
        </p>
      </div>

      {/* Separator */}
      <div className="h-px bg-border/50 mb-12" />

      {/* Popular Tags Section */}
      <div className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-6">
          {content.blog.popularTagsText}
        </h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.name}
              variant="outline"
              className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
            >
              {tag.name} ({tag.count})
            </Badge>
          ))}
        </div>
      </div>

      {/* Latest Posts Section */}
      <div>
        <div className="flex items-baseline gap-3 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">
            {content.blog.viewAllText}
          </h2>
          <span className="text-muted-foreground text-sm">
            ({postCount} {content.blog.postCountText})
          </span>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map((post, index) => (
            <BlogCard key={post.slug} post={post} index={index} />
          ))}
        </div>

        {blogPosts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {content.blog.noResultsText}
          </div>
        )}
      </div>
    </Container>
  );
}
