import BlogCard from "@/components/blog/BlogCard";
import SectionHeading from "@/components/common/SectionHeading";
import { blogPosts } from "@/config/blog";
import Link from "next/link";

export default function FeaturedBlogs() {
  const featuredPosts = blogPosts.filter((p) => p.featured).slice(0, 2);

  return (
    <section className="py-12">
      <SectionHeading subHeading="Yazılarım" heading="Blog" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {featuredPosts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      <div className="flex justify-center">
        <Link href="/blog" className="pixel-btn">
          Tüm Yazıları Gör →
        </Link>
      </div>
    </section>
  );
}
