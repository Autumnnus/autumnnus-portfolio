import { getBlogPosts } from "@/app/actions";
import AdminBlogList from "@/components/admin/AdminBlogList";
import AdminSearch from "@/components/admin/AdminSearch";
import Container from "@/components/common/Container";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const t = await getTranslations("Admin.Dashboard.blog");
  const tNav = await getTranslations("Admin.Navigation");
  const result = await getBlogPosts({
    lang: "tr",
    limit: 100,
    search: query,
  });

  return (
    <Container className="py-6 sm:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft size={16} /> {tNav("dashboard")}
          </Link>
          <h1 className="text-2xl sm:text-4xl font-bold mt-2 sm:mt-4">
            {t("pageTitle")}
          </h1>
        </div>
        <Link
          href="/admin/blog/new"
          className="w-full sm:w-auto px-6 py-3 bg-orange-500 text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Plus size={20} /> {t("newPost")}
        </Link>
      </div>

      <AdminSearch placeholder={t("searchPlaceholder") || "Yazılarda ara..."} />
      <AdminBlogList posts={result.items} />
    </Container>
  );
}
