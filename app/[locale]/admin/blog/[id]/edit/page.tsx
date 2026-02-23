import { getBlogPostById } from "@/app/actions";
import BlogForm from "@/components/admin/BlogForm";
import Container from "@/components/common/Container";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditBlogPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = await params;
  const [post, t] = await Promise.all([
    getBlogPostById(id),
    getTranslations("Admin.Dashboard.blog"),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <Container className="py-12">
      <div className="mb-8">
        <Link
          href="/admin/blog"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft size={20} /> {t("backToManage")}
        </Link>
        <h1 className="text-4xl font-bold mt-4">{t("editTitle")}</h1>
      </div>

      <BlogForm initialData={post} />
    </Container>
  );
}
