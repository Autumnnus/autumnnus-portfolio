"use client";

import {
  createBlogAction,
  updateBlogAction,
  uploadImageAction,
} from "@/app/admin/actions";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface BlogTranslation {
  language: string;
  title: string;
  description: string;
  content: string;
  readTime: string;
}

interface BlogPost {
  id?: string;
  slug: string;
  coverImage: string;
  tags: string[];
  featured: boolean;
  translations: BlogTranslation[];
}

interface BlogFormProps {
  initialData?: BlogPost;
}

interface ImageData {
  url: string;
  file?: File;
}

export default function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [coverImage, setCoverImage] = useState<ImageData | null>(
    initialData?.coverImage ? { url: initialData.coverImage } : null,
  );
  const [tags, setTags] = useState<string>(initialData?.tags?.join(", ") || "");

  const trTranslation = initialData?.translations?.find(
    (t) => t.language === "tr",
  );
  const enTranslation = initialData?.translations?.find(
    (t) => t.language === "en",
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setCoverImage({ url: previewUrl, file });
  };

  const uploadSingleFile = async (file: File, path: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);
    const res = await uploadImageAction(formData);
    return res.url;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload cover image if it's new
      let finalCoverImage = coverImage?.url || "";
      if (coverImage?.file) {
        finalCoverImage = await uploadSingleFile(
          coverImage.file,
          `blog/${slug}`,
        );
      }

      const data = {
        slug,
        coverImage: finalCoverImage,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t !== ""),
        featured: (
          e.currentTarget.elements.namedItem("featured") as HTMLInputElement
        ).checked,
        translations: [
          {
            language: "tr",
            title: (
              e.currentTarget.elements.namedItem("title_tr") as HTMLInputElement
            ).value,
            description: (
              e.currentTarget.elements.namedItem(
                "description_tr",
              ) as HTMLTextAreaElement
            ).value,
            content: (
              e.currentTarget.elements.namedItem(
                "content_tr",
              ) as HTMLTextAreaElement
            ).value,
            readTime: (
              e.currentTarget.elements.namedItem(
                "readTime_tr",
              ) as HTMLInputElement
            ).value,
            date: new Date().toLocaleDateString("tr-TR"),
          },
          {
            language: "en",
            title: (
              e.currentTarget.elements.namedItem("title_en") as HTMLInputElement
            ).value,
            description: (
              e.currentTarget.elements.namedItem(
                "description_en",
              ) as HTMLTextAreaElement
            ).value,
            content: (
              e.currentTarget.elements.namedItem(
                "content_en",
              ) as HTMLTextAreaElement
            ).value,
            readTime: (
              e.currentTarget.elements.namedItem(
                "readTime_en",
              ) as HTMLInputElement
            ).value,
            date: new Date().toLocaleDateString("en-US"),
          },
        ],
      };

      if (initialData?.id) {
        await updateBlogAction(initialData.id, data);
      } else {
        await createBlogAction(data);
      }
      router.push("/admin/blog");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "İşlem başarısız oldu";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug (URL)</label>
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full p-2 bg-muted rounded border border-border outline-hidden focus:border-primary transition-all"
              placeholder="my-blog-post"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Etiketler (Virgülle ayırın)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-2 bg-muted rounded border border-border outline-hidden focus:border-primary transition-all"
              placeholder="Next.js, React, Tailwind"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              id="featured"
              defaultChecked={initialData?.featured}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="featured" className="text-sm font-medium">
              Öne Çıkarılan Yazı
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Kapak Görseli</label>
          <div className="relative aspect-video bg-muted rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:bg-muted/50 transition-colors">
            {coverImage ? (
              <>
                <Image
                  src={coverImage.url}
                  alt="Cover"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => setCoverImage(null)}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white shadow-lg transition-transform hover:scale-110"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center">
                <ImagePlus size={32} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">
                  Resim Yükle
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </label>
            )}
            {loading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-bold border-b border-border pb-2 text-primary">
            Türkçe İçerik
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Başlık
            </label>
            <input
              name="title_tr"
              defaultValue={trTranslation?.title}
              required
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-hidden transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Okuma Süresi
            </label>
            <input
              name="readTime_tr"
              defaultValue={trTranslation?.readTime}
              placeholder="5 dk okuma"
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-hidden transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Kısa Açıklama
            </label>
            <textarea
              name="description_tr"
              defaultValue={trTranslation?.description}
              required
              className="w-full p-2 bg-muted rounded border border-border h-24 focus:border-primary outline-hidden transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              İçerik (Markdown)
            </label>
            <textarea
              name="content_tr"
              defaultValue={trTranslation?.content}
              required
              className="w-full p-2 bg-muted rounded border border-border h-64 focus:border-primary outline-hidden transition-all"
            />
          </div>
        </div>

        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-bold border-b border-border pb-2 text-primary">
            English Content
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Title
            </label>
            <input
              name="title_en"
              defaultValue={enTranslation?.title}
              required
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-hidden transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Read Time
            </label>
            <input
              name="readTime_en"
              defaultValue={enTranslation?.readTime}
              placeholder="5 min read"
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-hidden transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Short Description
            </label>
            <textarea
              name="description_en"
              defaultValue={enTranslation?.description}
              required
              className="w-full p-2 bg-muted rounded border border-border h-24 focus:border-primary outline-hidden transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Content (Markdown)
            </label>
            <textarea
              name="content_en"
              defaultValue={enTranslation?.content}
              required
              className="w-full p-2 bg-muted rounded border border-border h-64 focus:border-primary outline-hidden transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t border-border pt-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 bg-muted rounded-lg font-bold hover:bg-muted/80 transition-colors"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-12 py-3 bg-orange-500 text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
        >
          {loading && <Loader2 className="animate-spin w-4 h-4" />} Yazıyı
          Kaydet
        </button>
      </div>
    </form>
  );
}
