import { getBlogPosts } from "@/app/actions";
import AdminBlogList from "@/components/admin/AdminBlogList";
import Container from "@/components/common/Container";
import { Language } from "@prisma/client";
import { ArrowLeft, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function AdminBlogPage() {
  const t = await getTranslations("Admin.Dashboard.blog");
  const tNav = await getTranslations("Admin.Navigation");
  const result = await getBlogPosts({
    lang: Language.tr,
    limit: 100,
  });

  return (
    <Container className="py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft size={20} /> {tNav("dashboard")}
          </Link>
          <h1 className="text-4xl font-bold mt-4">{t("pageTitle")}</h1>
        </div>
        <Link
          href="/admin/blog/new"
          className="px-6 py-3 bg-orange-500 text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus size={20} /> {t("newPost")}
        </Link>
      </div>

      <AdminBlogList posts={result.items} />
    </Container>
  );
}
