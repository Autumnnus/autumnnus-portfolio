import { getBlogPostById } from "@/app/actions";
import BlogForm from "@/components/admin/BlogForm";
import Container from "@/components/common/Container";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";

interface EditBlogPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = await params;
  const post = await getBlogPostById(id);

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
          <ArrowLeft size={20} /> Blog Yönetimine Dön
        </Link>
        <h1 className="text-4xl font-bold mt-4">Blog Yazısını Düzenle</h1>
      </div>

      <BlogForm initialData={post} />
    </Container>
  );
}
