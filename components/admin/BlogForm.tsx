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
import { languageNames, useRouter } from "@/i18n/routing";
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
import { useEffect, useState } from "react";
import { FieldError, FieldErrors, useForm } from "react-hook-form";
import SeoPopover from "./SeoPopover";
import TipTapEditor from "./TipTapEditor";

import { generateTranslationAction } from "@/app/[locale]/admin/ai-actions";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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

  const isEditing = !!initialData;
  const sourceTitle = watch(`translations.${sourceLang}.title` as const);
  useEffect(() => {
    if (!isEditing && sourceTitle) {
      const currentSlug = getValues("slug");
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
      toast.error(t("translateError"));
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
        toast.error(
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

      toast.success(t("translateSuccess"));
    } catch (error) {
      toast.error(
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
      }
    },
    onInvalid,
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
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
              {t("slug")}
            </label>
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
              <input
                {...register("category")}
                className="w-full p-3 bg-background rounded-xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
                placeholder="..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
                {t("status")}
              </label>
              <select
                {...register("status")}
                className="w-full p-3 bg-background rounded-xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold cursor-pointer appearance-none"
              >
                <option value="draft">{t("draft")}</option>
                <option value="published">{t("publish")}</option>
              </select>
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
            <div className="relative aspect-video bg-muted/20 rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden hover:bg-muted/30 hover:border-primary/50 transition-all duration-300 group">
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
                        setValue("coverImage", "");
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

      {/* Translation Controls */}
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
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isTranslating ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {t("translateInSelectedLangs")}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 px-1 opacity-70">
          <div className="w-1 h-1 rounded-full bg-primary" />
          {t("translateInSelectedLangsDesc")}
        </p>
      </div>

      <LanguageTabs sourceLang={sourceLang} targetLangs={targetLangs}>
        {(lang) => (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex justify-end sticky top-0 z-30 py-2 sm:py-0">
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
                    defaultValue={getValues(
                      `translations.${lang}.keywords` as const,
                    )?.join(", ")}
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
        )}
      </LanguageTabs>

      <div className="fixed bottom-4 sm:bottom-8 left-0 right-0 z-40 px-4 sm:px-0 flex justify-center pointer-events-none">
        <div className="max-w-4xl w-full flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 bg-background/80 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-2xl border border-border/50 pointer-events-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto px-8 py-3 bg-muted rounded-xl text-sm font-bold hover:bg-muted/80 transition-all flex items-center justify-center"
          >
            {useTranslations("Admin.Common")("cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
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
