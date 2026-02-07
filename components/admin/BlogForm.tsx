"use client";

import {
  createBlogAction,
  updateBlogAction, // turbo
  uploadImageAction,
} from "@/app/admin/actions";
import { generateTranslationAction } from "@/app/admin/ai-actions";
import MultiLanguageSelector from "@/components/admin/MultiLanguageSelector";
import { languageNames } from "@/i18n/routing";
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

  const [sourceLang, setSourceLang] = useState<string>("tr");
  const [targetLangs, setTargetLangs] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

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
    if (targetLangs.length === 0) {
      alert("Lütfen en least bir hedef dil seçiniz.");
      return;
    }

    setIsTranslating(true);
    try {
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

      const translations = await generateTranslationAction({
        type: "blog",
        sourceLang,
        targetLangs,
        content: { title, description, content, readTime },
      });

      // Update target inputs
      Object.entries(translations).forEach(([lang, content]: [string, any]) => {
        if (!content) return;
        const titleInput = form.elements.namedItem(
          `title_${lang}`,
        ) as HTMLInputElement;
        const descInput = form.elements.namedItem(
          `description_${lang}`,
        ) as HTMLTextAreaElement;
        const contentInput = form.elements.namedItem(
          `content_${lang}`,
        ) as HTMLTextAreaElement;
        const readTimeInput = form.elements.namedItem(
          `readTime_${lang}`,
        ) as HTMLInputElement;

        if (titleInput) titleInput.value = content.title;
        if (descInput) descInput.value = content.description;
        if (contentInput) contentInput.value = content.content;
        if (readTimeInput && content.readTime)
          readTimeInput.value = content.readTime;
      });

      alert("Çeviri tamamlandı!");
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

      const formElements = e.currentTarget.elements;

      const translations = Object.keys(languageNames).map((lang) => ({
        language: lang as any,
        title: (formElements.namedItem(`title_${lang}`) as HTMLInputElement)
          .value,
        description: (
          formElements.namedItem(`description_${lang}`) as HTMLTextAreaElement
        ).value,
        content: (
          formElements.namedItem(`content_${lang}`) as HTMLTextAreaElement
        ).value,
        readTime: (
          formElements.namedItem(`readTime_${lang}`) as HTMLInputElement
        ).value,
        date: new Date().toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US"), // Fallback to en-US for others or ideally use dynamic locale
      }));

      const data = {
        slug,
        coverImage: finalCoverImage,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t !== ""),
        featured: (formElements.namedItem("featured") as HTMLInputElement)
          .checked,
        translations: translations,
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
      <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">
                Kaynak Dil:
              </span>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="px-3 py-1 text-xs font-bold rounded-md border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer"
              >
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name} ({code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <MultiLanguageSelector
              sourceLang={sourceLang}
              targetLangs={targetLangs}
              onChange={setTargetLangs}
            />
          </div>

          <button
            type="button"
            onClick={handleAutoTranslate}
            disabled={isTranslating || targetLangs.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isTranslating ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Seçilen Dillerde Çevir
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Kaynak dildeki alanları doldurduktan sonra, en az bir hedef dil seçip
          çeviri yapabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.keys(languageNames).map((lang) => {
          const translation = initialData?.translations?.find(
            (t) => t.language === lang,
          );
          return (
            <div
              key={lang}
              className={`space-y-4 p-4 rounded-lg border transition-all ${
                sourceLang === lang
                  ? "bg-primary/5 border-primary/30 ring-2 ring-primary/20"
                  : "bg-muted/30 border-border"
              }`}
            >
              <h3 className="font-bold border-b border-border pb-2 flex items-center justify-between">
                <span>
                  {languageNames[lang]} ({lang.toUpperCase()})
                </span>
                {sourceLang === lang && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Kaynak
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Başlık
                </label>
                <input
                  name={`title_${lang}`}
                  defaultValue={translation?.title}
                  required={lang === sourceLang} // Only require source lang initially, or let submit handle validation if needed
                  className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-hidden transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Okuma Süresi
                </label>
                <input
                  name={`readTime_${lang}`}
                  defaultValue={translation?.readTime}
                  placeholder="5 dk okuma"
                  className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-hidden transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Kısa Açıklama
                </label>
                <textarea
                  name={`description_${lang}`}
                  defaultValue={translation?.description}
                  required={lang === sourceLang}
                  className="w-full p-2 bg-muted rounded border border-border h-24 focus:border-primary outline-hidden transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  İçerik (Markdown)
                </label>
                <textarea
                  name={`content_${lang}`}
                  defaultValue={translation?.content}
                  required={lang === sourceLang}
                  className="w-full p-2 bg-muted rounded border border-border h-64 focus:border-primary outline-hidden transition-all"
                />
              </div>
            </div>
          );
        })}
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
