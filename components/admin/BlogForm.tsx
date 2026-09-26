"use client";

import {
  BlogData,
  createBlogAction,
  updateBlogAction,
  uploadImageAction,
} from "@/app/[locale]/admin/actions";
import LanguageTabs from "@/components/admin/LanguageTabs";
import ContentRenderer from "@/components/common/ContentRenderer";
import { useAdminForm } from "@/hooks/useAdminForm";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { languageNames, useRouter } from "@/i18n/routing";
import {
  BlogPost,
  BlogPostTranslation,
  LanguageType as Language,
} from "@/lib/db/schema";
import { BlogFormValues, BlogSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ExternalLink,
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
import { useEffect, useState } from "react";
import { FieldError, FieldErrors, useForm } from "react-hook-form";
import TipTapEditor from "./TipTapEditor";

import { formatDate } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { CategorySelector } from "./CategorySelector";

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
  const commonT = useTranslations("Admin.Common");
  const router = useRouter();
  const initialTranslations = initialData?.translations
    ? transformTranslationsToObject(initialData.translations)
    : {};
  const [coverImage, setCoverImage] = useState<ImageData | null>(
    initialData?.coverImage ? { url: initialData.coverImage } : null,
  );
  const [isCoverDragActive, setIsCoverDragActive] = useState(false);
  const [sourceLang, setSourceLang] = useState<string>("tr");
  const targetLangs = Object.keys(languageNames).filter(
    (lang) => lang !== sourceLang,
  );

  const form = useForm<BlogFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(BlogSchema) as any,
    defaultValues: {
      slug: initialData?.slug || "",
      featured: initialData?.featured ?? false,
      coverImage: initialData?.coverImage || "",
      imageAlt: initialData?.imageAlt || "",
      tags: initialData?.tags?.join(", ") || "",
      categoryId: initialData?.categoryId || "",
      status: initialData?.status || "draft",
      commentsEnabled: initialData?.commentsEnabled ?? true,
      translations: initialTranslations,
    },
  });

  const {
    register,
    setValue,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = form;

  const isEditing = !!initialData;
  const sourceTitle = watch(`translations.${sourceLang}.title` as const);
  const slugValue = watch("slug");
  const slugValueTrimmed = slugValue?.trim() || "";
  const locale = useLocale();
  const openPreviewPage = (path: string) => {
    if (!path) return;
    const base = window.location.origin;
    window.open(`${base}${path}`, "_blank");
  };
  useEffect(() => {
    if (!isEditing && sourceTitle) {
      const currentSlug = getValues("slug");
      if (
        !currentSlug ||
        currentSlug ===
          slugify(sourceTitle.substring(0, sourceTitle.length - 1))
      ) {
        setValue("slug", slugify(sourceTitle), {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [sourceTitle, isEditing, setValue, getValues, sourceLang]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setCoverImage({ url: previewUrl, file });
    setValue("coverImage", previewUrl, { shouldDirty: true });
  };

  const applyCoverFile = (file: File) => {
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
        date: formatDate(
          new Date(),
          undefined,
          lang === "tr" ? "tr-TR" : "en-US",
        ),
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
      categoryId: data.categoryId,
      status: data.status,
      commentsEnabled: data.commentsEnabled,
      translations: translationsArray,
    };

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
        router.refresh();
        router.push(`/admin/blog/${result.id}/edit`);
      }
    },
    onInvalid,
  });

  const { confirmNavigation } = useUnsavedChangesGuard({
    enabled: isDirty && !loading,
  });

  return (
    <form
      onSubmit={(e) => {
        handleFormSubmit(e);
      }}
      className="space-y-6 sm:space-y-8 max-w-4xl mx-auto pb-20 px-4 sm:px-0"
    >
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          <p className="font-bold mb-2">{t("validationError")}:</p>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(errors).map(([key, value]) => {
              if (key === "translations" && value) {
                if ((value as FieldError).message) {
                  return (
                    <li key={key}>
                      {t("contentError")}: {(value as FieldError).message}
                    </li>
                  );
                }

                return Object.entries(value).map(([lang, langErrors]) => {
                  const fieldError = langErrors as FieldError;
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-12 xl:col-span-7 space-y-6 bg-muted/20 p-4 sm:p-6 rounded-2xl border border-border/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
                {t("slug")}
              </label>
              {isEditing && slugValueTrimmed && (
                <button
                  type="button"
                  onClick={() =>
                    openPreviewPage(
                      `${locale ? `/${locale}` : ""}/blog/${slugValueTrimmed}`,
                    )
                  }
                  className="text-muted-foreground hover:text-primary transition text-[11px]"
                  aria-label="Yeni sekmede önizle"
                >
                  <ExternalLink size={16} />
                </button>
              )}
            </div>
            <input
              {...register("slug")}
              className="w-full p-3 bg-background rounded-xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
              placeholder="..."
            />
            {errors.slug && (
              <p className="text-xs text-destructive font-medium px-1">
                {errors.slug?.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
                {t("category")}
              </label>
              <CategorySelector
                type="blog"
                value={watch("categoryId")}
                onChange={(val) =>
                  setValue("categoryId", val, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={errors.categoryId?.message}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
                {t("status")}
              </label>
              <div className="relative group">
                <select
                  {...register("status")}
                  className="w-full p-3.5 bg-background rounded-2xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold cursor-pointer appearance-none shadow-sm"
                >
                  <option value="draft">📝 {t("draft")}</option>
                  <option value="published">🚀 {t("publish")}</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                  <Layout size={16} className="rotate-90 text-primary" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  id="featured"
                  {...register("featured")}
                  className="peer appearance-none w-5 h-5 rounded border-2 border-border checked:bg-primary checked:border-primary transition-all cursor-pointer"
                />
                <Sparkles className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                {t("featured")}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  id="commentsEnabled"
                  {...register("commentsEnabled")}
                  className="peer appearance-none w-5 h-5 rounded border-2 border-border checked:bg-primary checked:border-primary transition-all cursor-pointer"
                />
                <Settings className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                {t("commentsEnabled")}
              </span>
            </label>
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
              {t("coverImage")}
            </label>
            <div
              className={`relative aspect-video bg-muted/20 rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden hover:bg-muted/30 hover:border-primary/50 transition-all duration-300 group ${
                isCoverDragActive ? "border-primary/60 bg-primary/5" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsCoverDragActive(true);
              }}
              onDragLeave={() => setIsCoverDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsCoverDragActive(false);
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith("image/")) {
                  applyCoverFile(file);
                }
              }}
            >
              {coverImage ? (
                <>
                  <Image
                    src={coverImage?.url || ""}
                    alt={t("coverAlt")}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="cursor-pointer p-2.5 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors">
                      <ImagePlus size={18} className="text-white" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleImageUpload}
                        accept="image/*"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(null);
                        setValue("coverImage", "", { shouldDirty: true });
                      }}
                      className="p-2.5 bg-red-500/40 backdrop-blur-md rounded-full hover:bg-red-500/60 transition-colors"
                    >
                      <X size={18} className="text-white" />
                    </button>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 w-full h-full justify-center group-hover:scale-105 transition-transform duration-300">
                  <div className="p-4 bg-primary/10 rounded-full text-primary transition-colors group-hover:bg-primary/20">
                    <ImagePlus size={32} />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
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
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                  <Loader2 className="animate-spin text-primary w-8 h-8" />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t("imageAlt")}
            </label>
            <input
              {...register("imageAlt")}
              className="w-full p-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm"
              placeholder="..."
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* Source Language */}
      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-sm font-bold text-primary whitespace-nowrap">
                {t("sourceLanguage")}:
              </span>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer flex-1 sm:flex-none shadow-sm"
              >
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name} ({code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <LanguageTabs sourceLang={sourceLang} targetLangs={targetLangs}>
        {(lang) => {
          const keywordsValue =
            // eslint-disable-next-line react-hooks/incompatible-library -- React Compiler is not enabled; RHF watch() in render is intentional
            watch(`translations.${lang}.keywords` as const) ?? [];
          const keywordsString = Array.isArray(keywordsValue)
            ? keywordsValue.join(", ")
            : "";

          return (
            <div className="space-y-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2 px-1">
                  <Layout size={14} className="text-primary/60" /> {t("title")}
                </label>
                <input
                  {...register(`translations.${lang}.title` as const)}
                  className="w-full p-3 bg-background rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2 px-1">
                  <Settings size={14} className="text-primary/60" />{" "}
                  {t("readTime")}
                </label>
                <input
                  {...register(`translations.${lang}.readTime` as const)}
                  placeholder="..."
                  className="w-full p-3 bg-background rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2 px-1">
                <Search size={14} className="text-primary/60" />{" "}
                {t("metaDescription")}
              </label>
              <textarea
                {...register(`translations.${lang}.metaDescription` as const)}
                className="w-full p-3 bg-background rounded-xl border border-border h-24 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm min-h-[80px]"
                placeholder="..."
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2 px-1">
                  <FileText size={14} className="text-primary/60" />{" "}
                  {t("fullDescription")}
                </label>
                <div className="prose-sm max-w-none">
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
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2 px-1">
                  Preview
                </label>
                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <ContentRenderer
                    content={watch(`translations.${lang}.content` as const) || ""}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-8 border-t border-border/50 mt-8">
              <h4 className="text-xs font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                <Settings size={14} /> {t("seo")}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider px-1">
                    {t("metaTitle")}
                  </label>
                  <input
                    {...register(`translations.${lang}.metaTitle` as const)}
                    className="w-full p-3 bg-background rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider px-1">
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
                    value={keywordsString}
                    className="w-full p-3 bg-background rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm"
                    placeholder={t("keywordsPlaceholder")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider px-1">
                  {t("excerpt")}
                </label>
                <textarea
                  {...register(`translations.${lang}.excerpt` as const)}
                  className="w-full p-3 bg-background rounded-xl border border-border h-24 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm min-h-[100px]"
                />
              </div>

              {/* Keep existing fallback for description if needed */}
              <input
                type="hidden"
                {...register(`translations.${lang}.description` as const)}
              />
            </div>
          </div>
        );
      }}
      </LanguageTabs>

      <div className="fixed bottom-4 sm:bottom-8 left-0 right-0 z-40 px-4 sm:px-0 flex justify-center pointer-events-none">
        <div className="max-w-4xl w-full flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 bg-background/80 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-2xl border border-border/50 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              if (!confirmNavigation()) return;
              router.back();
            }}
            className="w-full sm:w-auto px-8 py-3 bg-muted rounded-xl text-sm font-bold hover:bg-muted/80 transition-all flex items-center justify-center"
          >
            {commonT("cancel")}
          </button>
          <button
            type="submit"
            disabled={loading || !isDirty}
            className="w-full sm:w-auto px-12 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-xl shadow-orange-500/20"
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {t("save")}
          </button>
        </div>
      </div>
    </form>
  );
}
