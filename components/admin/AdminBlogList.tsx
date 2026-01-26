"use client";

import { deleteBlogAction } from "@/app/admin/actions";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface BlogListProps {
  posts: any[];
}

export default function AdminBlogList({ posts }: BlogListProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Bu yazıyı silmek istediğinize emin misiniz?")) return;

    startTransition(async () => {
      try {
        await deleteBlogAction(id);
        router.refresh();
      } catch (err) {
        alert("Silme işlemi başarısız");
      }
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-4 font-bold text-sm uppercase">Başlık</th>
            <th className="p-4 font-bold text-sm uppercase text-right">
              Aksiyonlar
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-muted/30 transition-colors">
              <td className="p-4">
                <div className="font-medium">{post.title}</div>
                <div className="text-xs text-muted-foreground">{post.slug}</div>
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/blog/${post.id}/edit`}
                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={isPending}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan={2} className="p-8 text-center text-muted-foreground">
                Henüz yazı eklenmemiş.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
