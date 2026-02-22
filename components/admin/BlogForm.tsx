"use client";

import {
  BlogData,
  createBlogAction,
  updateBlogAction,
  uploadImageAction,
} from "@/app/[locale]/admin/actions";
import LanguageTabs from "@/components/admin/LanguageTabs";
import MultiLanguageSelector from "@/components/admin/MultiLanguageSelector";
import { useAdminForm } from "@/hooks/useAdminForm";
import { languageNames } from "@/i18n/routing";
import { BlogFormValues, BlogSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { BlogPost, BlogPostTranslation, Language } from "@prisma/client";
import {
  FileText,
  ImagePlus,
  Layout,
  Loader2,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FieldError, FieldErrors, useForm } from "react-hook-form";
import SeoPopover from "./SeoPopover";
import TipTapEditor from "./TipTapEditor";

import { generateTranslationAction } from "@/app/[locale]/admin/ai-actions";
import { useTranslations } from "next-intl";

// Helper to update translations
const transformTranslationsToObject = (translations: BlogPostTranslation[]) => {
  const result: Record<
    string,
    {
      title: string;
      description: string;
      content: string;
      readTime: string;
      excerpt?: string;
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string[];
    }
  > = {};
  translations.forEach((t) => {
    result[t.language] = {
      title: t.title || "",
      description: t.description || "",
      content: t.content || "",
      readTime: t.readTime || "",
      excerpt: t.excerpt || "",
      metaTitle: t.metaTitle || "",
      metaDescription: t.metaDescription || "",
      keywords: t.keywords || [],
    };
  });
  return result;
};

const slugify = (text: string) => {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

export interface BlogFormProps {
  initialData?: BlogPost & { translations: BlogPostTranslation[] };
}

interface ImageData {
  url: string;
  file?: File;
}

export default function BlogForm({ initialData }: BlogFormProps) {
  const t = useTranslations("Admin.Form");
  const router = useRouter();
  const [coverImage, setCoverImage] = useState<ImageData | null>(
    initialData?.coverImage ? { url: initialData.coverImage } : null,
  );
  const [sourceLang, setSourceLang] = useState<string>("tr");
  const [targetLangs, setTargetLangs] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const form = useForm<BlogFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(BlogSchema) as any,
    defaultValues: {
      slug: initialData?.slug || "",
      featured: initialData?.featured ?? false,
      coverImage: initialData?.coverImage || "",
      imageAlt: initialData?.imageAlt || "",
      tags: initialData?.tags?.join(", ") || "",
      category: initialData?.category || "",
      status: initialData?.status || "draft",
      commentsEnabled: initialData?.commentsEnabled ?? true,
      translations: initialData?.translations
        ? transformTranslationsToObject(initialData.translations)
        : {},
    },
  });

  const {
    register,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = form;

  // Auto-slugify
  const isEditing = !!initialData;
  const sourceTitle = watch(`translations.${sourceLang}.title` as const);

  // Effect to sync slug with title only for NEW posts
  // or if slug is explicitly empty
  useEffect(() => {
    if (!isEditing && sourceTitle) {
      const currentSlug = getValues("slug");
      // Only auto-update if slug is empty or it was already an auto-generated version of a slightly shorter title
      if (
        !currentSlug ||
        currentSlug ===
          slugify(sourceTitle.substring(0, sourceTitle.length - 1))
      ) {
        setValue("slug", slugify(sourceTitle), { shouldValidate: true });
      }
    }
  }, [sourceTitle, isEditing, setValue, getValues, sourceLang]);

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
      alert(t("translateError"));
      return;
    }

    setIsTranslating(true);
    try {
      const currentValues = getValues();
      const sourceContent =
        currentValues.translations?.[
          sourceLang as keyof typeof currentValues.translations
        ];

      if (!sourceContent || !sourceContent.title || !sourceContent.content) {
        const missing = [];
        if (!sourceContent) missing.push(sourceLang.toUpperCase() + " içeriği");
        else {
          if (!sourceContent.title) missing.push("Başlık");
          if (!sourceContent.content) missing.push("İçerik");
        }
        alert(
          `${t("fillRequired")} (${sourceLang.toUpperCase()}): ${missing.join(", ")}`,
        );
        setIsTranslating(false);
        return;
      }

      const translations = (await generateTranslationAction({
        type: "blog",
        sourceLang,
        targetLangs,
        content: {
          title: sourceContent.title,
          description: sourceContent.description || "",
          content: sourceContent.content,
          readTime: sourceContent.readTime || "5 min read",
          excerpt: sourceContent.excerpt || "",
          metaTitle: sourceContent.metaTitle || "",
          metaDescription: sourceContent.metaDescription || "",
          keywords: sourceContent.keywords || [],
        },
      })) as Record<
        string,
        {
          title: string;
          description?: string;
          content: string;
          readTime?: string;
          excerpt?: string;
          metaTitle?: string;
          metaDescription?: string;
          keywords?: string[];
        } | null
      >;

      // Update target inputs
      Object.entries(translations).forEach(([lang, content]) => {
        if (!content) return;
        setValue(`translations.${lang}.title` as const, content.title);
        setValue(
          `translations.${lang}.description` as const,
          content.description || "",
        );
        setValue(`translations.${lang}.content` as const, content.content);
        setValue(
          `translations.${lang}.readTime` as const,
          content.readTime || "5 min read",
        );
        if (content.excerpt)
          setValue(`translations.${lang}.excerpt` as const, content.excerpt);
        if (content.metaTitle)
          setValue(
            `translations.${lang}.metaTitle` as const,
            content.metaTitle,
          );
        if (content.metaDescription)
          setValue(
            `translations.${lang}.metaDescription` as const,
            content.metaDescription,
          );
        if (content.keywords)
          setValue(`translations.${lang}.keywords` as const, content.keywords);
      });

      alert(t("translateSuccess"));
    } catch (error) {
      alert(
        t("translateError") +
          ": " +
          (error instanceof Error ? error.message : "Bilinmeyen hata"),
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const onSubmitAction = async (data: BlogFormValues) => {
    let finalCoverImage = data.coverImage || "";
    if (coverImage?.file) {
      finalCoverImage = await uploadSingleFile(
        coverImage.file,
        `blog/${data.slug}`,
      );
    }

    const translationsArray = Object.entries(data.translations)
      .filter((item): item is [string, NonNullable<(typeof item)[1]>] => {
        const t = item[1];
        return !!(t && t.title && t.title.trim() !== "");
      })
      .map(([lang, t]) => ({
        language: lang as Language,
        title: t.title,
        description: t.description,
        content: t.content,
        readTime: t.readTime,
        date: new Date().toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US"),
        excerpt: t.excerpt || "",
        metaTitle: t.metaTitle || "",
        metaDescription: t.metaDescription || "",
        keywords: t.keywords || [],
      }));

    if (translationsArray.length === 0) {
      throw new Error(t("fillRequired"));
    }

    const submitData: BlogData = {
      slug: data.slug,
      coverImage: finalCoverImage,
      imageAlt: data.imageAlt,
      tags: data.tags
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t: string) => t !== "")
        : [],
      featured: data.featured,
      category: data.category,
      status: data.status,
      commentsEnabled: data.commentsEnabled,
      translations: translationsArray,
    };

    console.log("Submitting blog data:", submitData);

    if (initialData?.id) {
      await updateBlogAction(initialData.id, submitData);
      return { action: "update" };
    } else {
      const result = await createBlogAction(submitData);
      return { action: "create", id: result.id };
    }
  };

  const onInvalid = (errors: FieldErrors<BlogFormValues>) => {
    console.warn("Form Validation Errors:", errors);
  };

  const { loading, handleSubmit: handleFormSubmit } = useAdminForm({
    form,
    onSubmitAction,
    successMessage: initialData?.id ? t("saveSuccess") : t("createSuccess"),
    onSuccess: (result) => {
      if (result.action === "update") {
        router.refresh();
      } else if (result.action === "create" && result.id) {
        router.push(`/admin/blog/${result.id}/edit`);
        router.refresh();
      }
    },
    onInvalid,
  });

  return (
    <form
      onSubmit={(e) => {
        handleFormSubmit(e);
      }}
      className="space-y-8 max-w-4xl mx-auto pb-20"
    >
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          <p className="font-bold mb-2">{t("validationError")}:</p>
          <ul className="list-disc list-inside">
            {Object.entries(errors).map(([key, value]) => {
              if (key === "translations" && value) {
                // If it's a global error on the record (like "En az bir dilde...")
                if ((value as FieldError).message) {
                  return (
                    <li key={key}>
                      {t("contentError")}: {(value as FieldError).message}
                    </li>
                  );
                }

                // If it's a per-language/field error
                return Object.entries(value).map(([lang, langErrors]) => {
                  const fieldError = langErrors as FieldError;
                  // If the language object itself has a direct error
                  if (fieldError.message) {
                    return (
                      <li key={`${key}.${lang}`}>
                        {languageNames[lang as keyof typeof languageNames] ||
                          lang.toUpperCase()}
                        : {fieldError.message}
                      </li>
                    );
                  }

                  const langErrRec = langErrors as Record<string, FieldError>;

                  // Map field errors (title, content, etc.)
                  const fieldErrors = Object.entries(langErrRec)
                    .filter(
                      ([field]) => !["message", "type", "ref"].includes(field),
                    )
                    .map(([field, err]) => {
                      const fieldName =
                        field === "title"
                          ? t("title")
                          : field === "content"
                            ? t("content")
                            : field;
                      return `${fieldName} (${err?.message || "Geçersiz"})`;
                    });

                  if (fieldErrors.length === 0) return null;

                  return (
                    <li key={`${key}.${lang}`}>
                      {languageNames[lang as keyof typeof languageNames] ||
                        lang.toUpperCase()}
                      : {fieldErrors.join(", ")}
                    </li>
                  );
                });
              }
              const err = value as FieldError | undefined;
              return (
                <li key={key}>
                  {key === "slug"
                    ? t("slug")
                    : key.charAt(0).toUpperCase() + key.slice(1)}
                  : {err?.message || "Geçersiz değer"}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("slug")}</label>
            <input
              {...register("slug")}
              className="w-full p-2 bg-muted rounded border border-border outline-hidden focus:border-primary transition-all"
              placeholder="..."
            />
            {errors.slug && (
              <p className="text-xs text-red-500">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("category")}</label>
            <input
              {...register("category")}
              className="w-full p-2 bg-muted rounded border border-border outline-hidden focus:border-primary transition-all"
              placeholder="..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("status")}</label>
              <select
                {...register("status")}
                className="w-full p-2 bg-muted rounded border border-border outline-hidden focus:border-primary transition-all"
              >
                <option value="draft">{t("draft")}</option>
                <option value="published">{t("publish")}</option>
              </select>
            </div>
            <div className="flex flex-col justify-end space-y-4 pb-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  {...register("featured")}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="featured" className="text-sm font-medium">
                  {t("featured")}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="commentsEnabled"
                  {...register("commentsEnabled")}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label
                  htmlFor="commentsEnabled"
                  className="text-sm font-medium"
                >
                  {t("commentsEnabled")}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("coverImage")}</label>
            <div className="relative aspect-video bg-muted rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:bg-muted/50 transition-colors">
              {coverImage ? (
                <>
                  <Image
                    src={coverImage.url}
                    alt={t("coverAlt")}
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
                    {t("coverImage")}
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
          <div className="space-y-2">
            <label className="font-medium text-xs text-muted-foreground uppercase">
              {t("imageAlt")}
            </label>
            <input
              {...register("imageAlt")}
              className="w-full p-2 bg-muted rounded border border-border outline-hidden focus:border-primary transition-all text-sm"
              placeholder="..."
            />
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
                {t("sourceLanguage")}:
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
            {t("translateInSelectedLangs")}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("translateInSelectedLangsDesc")}
        </p>
      </div>

      <LanguageTabs sourceLang={sourceLang} targetLangs={targetLangs}>
        {(lang) => (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex justify-end mb-4">
              <SeoPopover
                type="blog"
                language={lang}
                onSeoGenerated={(result) => {
                  setValue(
                    `translations.${lang}.title` as const,
                    result.title,
                    { shouldDirty: true },
                  );
                  if (result.description) {
                    setValue(
                      `translations.${lang}.description` as const,
                      result.description,
                      { shouldDirty: true },
                    );
                  }
                  if (result.excerpt) {
                    setValue(
                      `translations.${lang}.excerpt` as const,
                      result.excerpt,
                      { shouldDirty: true },
                    );
                  }
                  if (result.metaTitle) {
                    setValue(
                      `translations.${lang}.metaTitle` as const,
                      result.metaTitle,
                      { shouldDirty: true },
                    );
                  }
                  if (result.metaDescription) {
                    setValue(
                      `translations.${lang}.metaDescription` as const,
                      result.metaDescription,
                      { shouldDirty: true },
                    );
                  }
                  if (result.keywords) {
                    setValue(
                      `translations.${lang}.keywords` as const,
                      result.keywords,
                      { shouldDirty: true },
                    );
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                  <Layout size={12} /> {t("title")}
                </label>
                <input
                  {...register(`translations.${lang}.title` as const)}
                  className="w-full p-3 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                  <Settings size={12} /> {t("readTime")}
                </label>
                <input
                  {...register(`translations.${lang}.readTime` as const)}
                  placeholder="..."
                  className="w-full p-3 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <Search size={12} /> {t("metaDescription")}
              </label>
              <textarea
                {...register(`translations.${lang}.metaDescription` as const)}
                className="w-full p-3 bg-background rounded-lg border border-border h-24 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm"
                placeholder="..."
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                  <FileText size={12} /> {t("fullDescription")} {t("htmlLabel")}
                </label>
                <TipTapEditor
                  content={
                    getValues(`translations.${lang}.content` as const) || ""
                  }
                  onChange={(html) =>
                    setValue(`translations.${lang}.content` as const, html, {
                      shouldDirty: true,
                    })
                  }
                  uploadPath={`blog/${getValues("slug") || "temp"}`}
                />
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border/50 mt-6">
              <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                <Settings size={12} /> {t("seo")}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    {t("metaTitle")}
                  </label>
                  <input
                    {...register(`translations.${lang}.metaTitle` as const)}
                    className="w-full p-3 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    {t("keywords")}
                  </label>
                  <input
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(",")
                        .map((t) => t.trim());
                      setValue(`translations.${lang}.keywords` as const, tags, {
                        shouldDirty: true,
                      });
                    }}
                    defaultValue={getValues(
                      `translations.${lang}.keywords` as const,
                    )?.join(", ")}
                    className="w-full p-3 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm"
                    placeholder={t("keywordsPlaceholder")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  {t("excerpt")}
                </label>
                <textarea
                  {...register(`translations.${lang}.excerpt` as const)}
                  className="w-full p-3 bg-background rounded-lg border border-border h-24 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm"
                />
              </div>

              {/* Keep existing fallback for description if needed */}
              <input
                type="hidden"
                {...register(`translations.${lang}.description` as const)}
              />
            </div>
          </div>
        )}
      </LanguageTabs>

      <div className="flex justify-end gap-4 border-t border-border pt-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 bg-muted rounded-lg font-bold hover:bg-muted/80 transition-colors"
        >
          {useTranslations("Admin.Common")("cancel")}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-12 py-3 bg-orange-500 text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
        >
          {loading && <Loader2 className="animate-spin w-4 h-4" />} {t("save")}
        </button>
      </div>
    </form>
  );
}
