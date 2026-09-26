"use client";

import BlogCard from "@/components/blog/BlogCard";
import SectionHeading from "@/components/common/SectionHeading";
import PixelIcon from "@/components/pixel/PixelIcon";
import { BlogPost } from "@/types/contents";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface FeaturedBlogsProps {
  posts: BlogPost[];
}

export default function FeaturedBlogs({ posts }: FeaturedBlogsProps) {
  const t = useTranslations("Blog");
  const featuredPosts = posts.slice(0, 2);

  return (
    <section className="relative z-10 py-16" id="blog">
      <SectionHeading
        subHeading={t("subTitle")}
        heading={t("title")}
        icon="sparkles"
        action={
          <Link href="/blog" className="pixel-button pixel-button-sm">
            {t("viewAll")}
            <PixelIcon name="arrowSmall" className="h-2.5 w-1.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {featuredPosts.map((post, index) => (
          <BlogCard key={post.slug} post={post} index={index} />
        ))}
      </div>
    </section>
  );
}
