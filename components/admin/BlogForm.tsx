"use client";

import {
  createBlogAction,
  updateBlogAction, // turbo
  uploadImageAction,
} from "@/app/admin/actions";
import { generateTranslationAction } from "@/app/admin/ai-actions";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
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

  const [sourceLang, setSourceLang] = useState<"tr" | "en">("tr");
  const [isTranslating, setIsTranslating] = useState(false);

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

  const handleAutoTranslate = async () => {
    setIsTranslating(true);
    try {
      const targetLang = sourceLang === "tr" ? "en" : "tr";
      const form = document.querySelector("form") as HTMLFormElement;

      const title = (
        form.elements.namedItem(`title_${sourceLang}`) as HTMLInputElement
      ).value;
      const description = (
        form.elements.namedItem(
          `description_${sourceLang}`,
        ) as HTMLTextAreaElement
      ).value;
      const content = (
        form.elements.namedItem(`content_${sourceLang}`) as HTMLTextAreaElement
      ).value;
      const readTime = (
        form.elements.namedItem(`readTime_${sourceLang}`) as HTMLInputElement
      ).value;

      if (!title || !description || !content) {
        alert("Lütfen kaynak dildeki alanları doldurunuz.");
        setIsTranslating(false);
        return;
      }

      const translation = await generateTranslationAction({
        type: "blog",
        sourceLang,
        targetLang,
        content: { title, description, content, readTime },
      });

      // Update target inputs
      (
        form.elements.namedItem(`title_${targetLang}`) as HTMLInputElement
      ).value = translation.title;
      (
        form.elements.namedItem(
          `description_${targetLang}`,
        ) as HTMLTextAreaElement
      ).value = translation.description;
      (
        form.elements.namedItem(`content_${targetLang}`) as HTMLTextAreaElement
      ).value = translation.content;
      (
        form.elements.namedItem(`readTime_${targetLang}`) as HTMLInputElement
      ).value = translation.readTime; // If returned
    } catch (error) {
      alert(
        "Çeviri başarısız oldu: " +
          (error instanceof Error ? error.message : "Bilinmeyen hata"),
      );
    } finally {
      setIsTranslating(false);
    }
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
            language: "tr" as any,
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
            language: "en" as any,
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

      {/* Translation Controls */}
      <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">Kaynak Dil:</span>
            <div className="flex bg-background rounded-lg border border-border p-1">
              <button
                type="button"
                onClick={() => setSourceLang("tr")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  sourceLang === "tr"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "hover:bg-muted"
                }`}
              >
                TR 🇹🇷
              </button>
              <button
                type="button"
                onClick={() => setSourceLang("en")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  sourceLang === "en"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "hover:bg-muted"
                }`}
              >
                EN 🇺🇸
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground hidden md:block">
            Kaynak dildeki içeriği doldurduktan sonra, diğer dile otomatik
            çeviri yapabilirsiniz.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutoTranslate}
          disabled={isTranslating}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50"
        >
          {isTranslating ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          AI ile Çevir ({sourceLang === "tr" ? "EN" : "TR"})
        </button>
      </div>

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
