import BlogForm from "@/components/admin/BlogForm";
import Container from "@/components/common/Container";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewBlogPage() {
  return (
    <Container className="py-12">
      <div className="mb-8">
        <Link
          href="/admin/blog"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft size={20} /> Blog Yönetimine Dön
        </Link>
        <h1 className="text-4xl font-bold mt-4">Yeni Blog Yazısı Ekle</h1>
      </div>

      <BlogForm />
    </Container>
  );
}
