import { auth } from "@/auth";
import Container from "@/components/common/Container";
import { FileText, Folder, Plus } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();

  return (
    <Container className="py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Hoş geldin, {session?.user?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Projeler Yönetimi */}
        <div className="p-8 bg-card border border-border rounded-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Folder className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Projeler</h2>
          </div>
          <p className="text-muted-foreground">
            Yeni projeler ekle, mevcutları düzenle veya sil.
          </p>
          <div className="flex gap-4">
            <Link
              href="/admin/projects"
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-all"
            >
              Yönet
            </Link>
            <Link
              href="/admin/projects/new"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Yeni Ekle
            </Link>
          </div>
        </div>

        {/* Blog Yönetimi */}
        <div className="p-8 bg-card border border-border rounded-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold">Blog Yazıları</h2>
          </div>
          <p className="text-muted-foreground">
            Düşüncelerini ve teknik yazılarını paylaş.
          </p>
          <div className="flex gap-4">
            <Link
              href="/admin/blog"
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-all"
            >
              Yönet
            </Link>
            <Link
              href="/admin/blog/new"
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Yeni Ekle
            </Link>
          </div>
        </div>

        {/* Profil Yönetimi */}
        <div className="p-8 bg-card border border-border rounded-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Plus className="w-8 h-8 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold">Profil & Hakkımda</h2>
          </div>
          <p className="text-muted-foreground">
            Kişisel bilgilerini, avatarını ve hakkımda yazılarını güncelle.
          </p>
          <div className="flex gap-4">
            <Link
              href="/admin/profile"
              className="px-6 py-2 bg-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-all"
            >
              Düzenle
            </Link>
          </div>
        </div>

        {/* Deneyim Yönetimi */}
        <div className="p-8 bg-card border border-border rounded-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Plus className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold">Deneyimler</h2>
          </div>
          <p className="text-muted-foreground">
            İş deneyimlerini ve çalışma geçmişini yönet.
          </p>
          <div className="flex gap-4">
            <Link
              href="/admin/experience"
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-all"
            >
              Yönet
            </Link>
            <Link
              href="/admin/experience/new"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Yeni Ekle
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
