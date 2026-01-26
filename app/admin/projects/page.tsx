import { getProjects } from "@/app/actions";
import AdminProjectList from "@/components/admin/AdminProjectList";
import Container from "@/components/common/Container";
import { Language } from "@prisma/client";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

export default async function AdminProjectsPage() {
  const result = await getProjects({
    lang: Language.tr, // Admin listesi için Türkçe başlıkları çekiyoruz
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
            <ArrowLeft size={20} /> Dashboard
          </Link>
          <h1 className="text-4xl font-bold mt-4">Projeleri Yönet</h1>
        </div>
        <Link
          href="/admin/projects/new"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Yeni Proje
        </Link>
      </div>

      <AdminProjectList projects={result.items} />
    </Container>
  );
}
