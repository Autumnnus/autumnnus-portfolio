"use client";

import {
  createBlogAction,
  updateBlogAction,
  uploadImageAction,
} from "@/app/admin/actions";
import { generateTranslationAction } from "@/app/admin/ai-actions";
import MultiLanguageSelector from "@/components/admin/MultiLanguageSelector";
import { languageNames } from "@/i18n/routing";
import { BlogFormValues, BlogSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { BlogPost, BlogPostTranslation, Language } from "@prisma/client";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

// Helper to update translations
const transformTranslationsToObject = (translations: BlogPostTranslation[]) => {
  const result: Record<
    string,
    { title: string; description: string; content: string; readTime: string }
  > = {};
  translations.forEach((t) => {
    result[t.language] = {
      title: t.title,
      description: t.description,
      content: t.content,
      readTime: t.readTime,
    };
  });
  return result;
};

interface BlogFormProps {
  initialData?: BlogPost & { translations: BlogPostTranslation[] };
}

interface ImageData {
  url: string;
  file?: File;
}

export default function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<ImageData | null>(
    initialData?.coverImage ? { url: initialData.coverImage } : null,
  );

  const [sourceLang, setSourceLang] = useState<string>("tr");
  const [targetLangs, setTargetLangs] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(BlogSchema),
    defaultValues: {
      slug: initialData?.slug || "",
      featured: initialData?.featured ?? false,
      coverImage: initialData?.coverImage || "",
      tags: initialData?.tags?.join(", ") || "",
      translations: initialData?.translations
        ? transformTranslationsToObject(initialData.translations)
        : {},
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setCoverImage({ url: previewUrl, file });
    setValue("coverImage", previewUrl, { shouldDirty: true });
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
      alert("Lütfen en az bir hedef dil seçiniz.");
      return;
    }

    setIsTranslating(true);
    try {
      const currentValues = getValues();
      const sourceContent =
        currentValues.translations?.[
          sourceLang as keyof typeof currentValues.translations
        ];

      if (
        !sourceContent ||
        !sourceContent.title ||
        !sourceContent.description ||
        !sourceContent.content
      ) {
        alert("Lütfen kaynak dildeki alanları doldurunuz.");
        setIsTranslating(false);
        return;
      }

      const translations = (await generateTranslationAction({
        type: "blog",
        sourceLang,
        targetLangs,
        content: {
          title: sourceContent.title,
          description: sourceContent.description,
          content: sourceContent.content,
          readTime: sourceContent.readTime || "5 min read",
        },
      })) as Record<
        string,
        {
          title: string;
          description: string;
          content: string;
          readTime: string;
        }
      >;

      // Update target inputs
      Object.entries(translations).forEach(([lang, content]) => {
        if (!content) return;
        setValue(`translations.${lang}.title` as const, content.title);
        setValue(
          `translations.${lang}.description` as const,
          content.description,
        );
        setValue(`translations.${lang}.content` as const, content.content);
        setValue(`translations.${lang}.readTime` as const, content.readTime);
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

  const onSubmit: SubmitHandler<BlogFormValues> = async (data) => {
    setLoading(true);

    try {
      // Upload cover image if it's new
      let finalCoverImage = data.coverImage || "";
      if (coverImage?.file) {
        finalCoverImage = await uploadSingleFile(
          coverImage.file,
          `blog/${data.slug}`,
        );
      }

      const translationsArray = Object.entries(data.translations)
        .filter(([, t]) => t.title && t.title.trim() !== "")
        .map(([lang, t]) => ({
          language: lang as Language,
          title: t.title,
          description: t.description,
          content: t.content,
          readTime: t.readTime,
          date: new Date().toLocaleDateString(
            lang === "tr" ? "tr-TR" : "en-US",
          ), // Keep existing logic for now
        }));

      const submitData = {
        slug: data.slug,
        coverImage: finalCoverImage,
        tags: data.tags
          ? data.tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t !== "")
          : [],
        featured: data.featured,
        translations: translationsArray,
      };

      if (initialData?.id) {
        await updateBlogAction(initialData.id, submitData);
      } else {
        await createBlogAction(submitData);
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
    <form
      onSubmit={
        handleSubmit(
          onSubmit,
        ) as unknown as React.FormEventHandler<HTMLFormElement>
      }
      className="space-y-8 max-w-4xl mx-auto pb-20"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug (URL)</label>
            <input
              {...register("slug")}
              required
              className="w-full p-2 bg-muted rounded border border-border outline-hidden focus:border-primary transition-all"
              placeholder="my-blog-post"
            />
            {errors.slug && (
              <p className="text-xs text-red-500">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Etiketler (Virgülle ayırın)
            </label>
            <input
              {...register("tags")}
              className="w-full p-2 bg-muted rounded border border-border outline-hidden focus:border-primary transition-all"
              placeholder="Next.js, React, Tailwind"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              {...register("featured")}
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
                  onClick={() => {
                    setCoverImage(null);
                    setValue("coverImage", "");
                  }}
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
                  {...register(`translations.${lang}.title` as const)}
                  className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-hidden transition-all"
                />
                {errors.translations?.[lang]?.title && (
                  <p className="text-xs text-red-500">
                    {errors.translations[lang]?.title?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Okuma Süresi
                </label>
                <input
                  {...register(`translations.${lang}.readTime` as const)}
                  placeholder="5 dk okuma"
                  className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-hidden transition-all"
                />
                {errors.translations?.[lang]?.readTime && (
                  <p className="text-xs text-red-500">
                    {errors.translations[lang]?.readTime?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Kısa Açıklama
                </label>
                <textarea
                  {...register(`translations.${lang}.description` as const)}
                  className="w-full p-2 bg-muted rounded border border-border h-24 focus:border-primary outline-hidden transition-all"
                />
                {errors.translations?.[lang]?.description && (
                  <p className="text-xs text-red-500">
                    {errors.translations[lang]?.description?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  İçerik (Markdown)
                </label>
                <textarea
                  {...register(`translations.${lang}.content` as const)}
                  className="w-full p-2 bg-muted rounded border border-border h-64 focus:border-primary outline-hidden transition-all"
                />
                {errors.translations?.[lang]?.content && (
                  <p className="text-xs text-red-500">
                    {errors.translations[lang]?.content?.message}
                  </p>
                )}
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
