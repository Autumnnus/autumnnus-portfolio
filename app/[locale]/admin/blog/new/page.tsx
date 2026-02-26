import BlogForm from "@/components/admin/BlogForm";
import Container from "@/components/common/Container";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function NewBlogPage() {
  const t = await getTranslations("Admin.Dashboard.blog");

  return (
    <Container className="py-12">
      <div className="mb-8">
        <Link
          href="/admin/blog"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft size={20} /> {t("backToManage")}
        </Link>
        <h1 className="text-4xl font-bold mt-4">{t("addNewTitle")}</h1>
      </div>

      <BlogForm />
    </Container>
  );
}
