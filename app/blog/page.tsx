import BlogCard from "@/components/blog/BlogCard";
import Container from "@/components/common/Container";
import { Badge } from "@/components/ui/Badge";
import { blogPosts, getAllTags } from "@/config/blog";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blogs | Autumnnus Portfolio",
  description:
    "Thoughts, tutorials, and insights on engineering, and programming.",
};

export default function BlogPage() {
  const tags = getAllTags();
  const postCount = blogPosts.length;

  return (
    <Container className="py-12 sm:py-20">
      {/* Header */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Blogs</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Thoughts, tutorials, and insights on engineering, and programming.
        </p>
      </div>

      {/* Separator */}
      <div className="h-px bg-border/50 mb-12" />

      {/* Popular Tags Section */}
      <div className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-6">Popular Tags</h2>
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
          <h2 className="text-2xl sm:text-3xl font-bold">Latest Posts</h2>
          <span className="text-muted-foreground text-sm">
            ({postCount} posts)
          </span>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </Container>
  );
}
