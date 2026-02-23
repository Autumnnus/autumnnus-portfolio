"use client";

import {
  createProjectAction,
  createSkillAction,
  deleteSkillAction,
  fetchGithubReposAction,
  ProjectData,
  updateProjectAction,
  uploadImageAction,
} from "@/app/[locale]/admin/actions";
import {
  generateTranslationAction,
  ProjectContent,
} from "@/app/[locale]/admin/ai-actions";
import LanguageTabs from "@/components/admin/LanguageTabs";
import MultiLanguageSelector from "@/components/admin/MultiLanguageSelector";
import Icon from "@/components/common/Icon";
import { useAdminForm } from "@/hooks/useAdminForm";
import { languageNames } from "@/i18n/routing";
import { ProjectFormValues, ProjectSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Language, Project, ProjectTranslation, Skill } from "@prisma/client";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Github,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FieldError, useForm } from "react-hook-form";
import { toast } from "sonner";
import SeoPopover from "./SeoPopover";
import TipTapEditor from "./TipTapEditor";

import { useTranslations } from "next-intl";

// Helper to update translations
const transformTranslationsToObject = (translations: ProjectTranslation[]) => {
  const result: Record<
    string,
    {
      title: string;
      shortDescription: string;
      fullDescription: string;
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string[];
    }
  > = {};
  translations.forEach((t) => {
    result[t.language] = {
      title: t.title || "",
      shortDescription: t.shortDescription || "",
      fullDescription: t.fullDescription || "",
      metaTitle: t.metaTitle || "",
      metaDescription: t.metaDescription || "",
      keywords: t.keywords || [],
    };
  });
  return result;
};

export interface ProjectFormProps {
  skills: Skill[];
  initialData?: Project & {
    translations: ProjectTranslation[];
    technologies: Skill[];
  };
}

interface ImageData {
  url: string;
  file?: File;
}

export default function ProjectForm({
  skills: initialSkills,
  initialData,
}: ProjectFormProps) {
  const t = useTranslations("Admin.Form");
  const commonT = useTranslations("Admin.Common");
  const router = useRouter();
  const [coverImage, setCoverImage] = useState<ImageData | null>(
    initialData?.coverImage ? { url: initialData.coverImage } : null,
  );
  const [galleryImages, setGalleryImages] = useState<ImageData[]>(
    initialData?.images?.map((url: string) => ({ url })) || [],
  );
  const [availableSkills, setAvailableSkills] =
    useState<Skill[]>(initialSkills);
  const [skillListFilter, setSkillListFilter] = useState("");

  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillIcon, setNewSkillIcon] = useState("");
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // New states for simple-icons autocomplete
  const [iconSearchQuery, setIconSearchQuery] = useState("");
  const [iconSearchResults, setIconSearchResults] = useState<
    Array<{ name: string; icon: string; hex: string }>
  >([]);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);
  const [showIconDropdown, setShowIconDropdown] = useState(false);

  // AI Translation State
  const [sourceLang, setSourceLang] = useState<string>("tr");
  const [targetLangs, setTargetLangs] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  // GitHub Repos State
  interface GithubRepo {
    id: number;
    name: string;
    description: string | null;
    html_url: string;
    homepage: string | null;
    language: string | null;
  }
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [showRepoModal, setShowRepoModal] = useState(false);

  const handleFetchRepos = async () => {
    if (repos.length > 0) {
      setShowRepoModal(true);
      return;
    }
    setIsFetchingRepos(true);
    try {
      const fetchedRepos = await fetchGithubReposAction();
      setRepos(fetchedRepos);
      setShowRepoModal(true);
    } catch (err: unknown) {
      toast.error(
        (err as Error).message || t("fetchRepos") + " " + t("translateError"),
      );
    } finally {
      setIsFetchingRepos(false);
    }
  };

  const handleSelectRepo = (repo: GithubRepo) => {
    const langs = ["tr", "en"];

    langs.forEach((lang) => {
      setValue(`translations.${lang}.title` as const, repo.name, {
        shouldDirty: true,
      });
      if (repo.description) {
        setValue(
          `translations.${lang}.shortDescription` as const,
          repo.description,
          { shouldDirty: true },
        );
      }
    });

    setValue("github", repo.html_url, { shouldDirty: true });
    if (repo.homepage) {
      setValue("liveDemo", repo.homepage, { shouldDirty: true });
    }
    setValue("slug", repo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), {
      shouldDirty: true,
    });

    setShowRepoModal(false);
  };

  const form = useForm<ProjectFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ProjectSchema) as any,
    defaultValues: {
      slug: initialData?.slug || "",
      status: initialData?.status || "Completed",
      category: initialData?.category || "",
      github: initialData?.github || "",
      liveDemo: initialData?.liveDemo || "",
      featured: initialData?.featured ?? false,
      coverImage: initialData?.coverImage || "",
      imageAlt: initialData?.imageAlt || "",
      images: initialData?.images || [],
      technologies: initialData?.technologies?.map((t) => t.id) || [],
      translations: initialData?.translations
        ? transformTranslationsToObject(initialData.translations)
        : {},
    },
  });

  const {
    register,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = form;

  const selectedSkills = watch("technologies");

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (data: ImageData) => void,
    customPath?: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For skills, we still upload immediately because they are handled separately in handleQuickAddSkill
    if (customPath === "skills") {
      // For skills we don't have access to setLoading anymore from global state,
      // but here it's inside image upload so we can just use a local one or toast promise,
      // wait, let's keep it simple.
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", customPath);

      try {
        const res = await uploadImageAction(formData);
        setter({ url: res.url });
      } catch (err) {
        console.error(err);
        toast.error(t("errorUpload"));
      }
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setter({ url: previewUrl, file });
    // Note: We don't verify 'coverImage' field in Zod immediately with blob url if we want,
    // but here we primarily use state 'coverImage' for preview and upload on submit.
    // However, we should sync with form if we want validation "required" to pass.
    setValue("coverImage", previewUrl, { shouldDirty: true });
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: ImageData[] = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));

    setGalleryImages((prev) => {
      const updated = [...prev, ...newImages];
      // Sync with form
      setValue(
        "images",
        updated.map((img) => img.url),
        { shouldDirty: true },
      );
      return updated;
    });
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => {
      const imageToRemove = prev[index];
      if (imageToRemove.file) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      const updated = prev.filter((_, i) => i !== index);
      setValue(
        "images",
        updated.map((img) => img.url),
        { shouldDirty: true },
      );
      return updated;
    });
  };

  const moveGalleryImage = (index: number, direction: "left" | "right") => {
    setGalleryImages((prev) => {
      const newImages = [...prev];
      const targetIndex = direction === "left" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newImages.length) return prev;

      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;

      setValue(
        "images",
        newImages.map((img) => img.url),
        { shouldDirty: true },
      );
      return newImages;
    });
  };

  const handleQuickAddSkill = async () => {
    if (!newSkillName || !newSkillIcon) {
      toast.info(t("errorFillSkill"));
      return;
    }

    // Check if skill already exists in availableSkills to avoid Prisma P2002
    const normalizedKey = newSkillName.toUpperCase().replace(/\s+/g, "_");
    const existing = availableSkills.find(
      (s) =>
        s.key === normalizedKey ||
        s.name.toLowerCase() === newSkillName.toLowerCase(),
    );

    if (existing) {
      // If it exists, just select it if not already selected
      const currentSkills = getValues("technologies");
      if (!currentSkills.includes(existing.id)) {
        setValue("technologies", [...currentSkills, existing.id]);
        toast.success(`"${existing.name}" zaten mevcut, listeye eklendi.`);
      } else {
        toast.info(`"${existing.name}" zaten seçili.`);
      }
      setShowAddSkill(false);
      setNewSkillName("");
      setNewSkillIcon("");
      return;
    }

    setIsAddingSkill(true);
    try {
      const newSkill = await createSkillAction({
        name: newSkillName,
        icon: newSkillIcon,
      });
      setAvailableSkills((prev) => [...prev, newSkill]);

      // Auto select the new skill
      const currentSkills = getValues("technologies");
      setValue("technologies", [...currentSkills, newSkill.id]);

      setShowAddSkill(false);
      setNewSkillName("");
      setNewSkillIcon("");
      toast.success(`"${newSkill.name}" başarıyla oluşturuldu ve eklendi.`);
    } catch (err) {
      console.error(err);
      toast.error(t("errorAddSkill") + ": " + (err as Error).message);
    } finally {
      setIsAddingSkill(false);
    }
  };

  const handleDeleteSkill = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(commonT("deleteConfirm"))) return;

    try {
      await deleteSkillAction(id);
      setAvailableSkills((prev) => prev.filter((s) => s.id !== id));
      // Also remove from selected if it was selected
      const current = getValues("technologies");
      if (current.includes(id)) {
        setValue(
          "technologies",
          current.filter((tid) => tid !== id),
        );
      }
      toast.success("Teknoloji kalıcı olarak silindi.");
    } catch (err) {
      console.error(err);
      toast.error(commonT("deleteError"));
    }
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
      toast.info("Lütfen en az bir hedef dil seçiniz.");
      return;
    }

    setIsTranslating(true);
    try {
      const currentValues = getValues();
      const sourceContent = currentValues.translations?.[sourceLang];

      if (
        !sourceContent ||
        !sourceContent.title ||
        !sourceContent.shortDescription ||
        !sourceContent.fullDescription
      ) {
        const missing = [];
        if (!sourceContent) missing.push(sourceLang.toUpperCase() + " içeriği");
        else {
          if (!sourceContent.title) missing.push("Proje Adı");
          if (!sourceContent.shortDescription) missing.push("Kısa Açıklama");
          if (!sourceContent.fullDescription) missing.push("Tam Açıklama");
        }
        toast.warning(
          `Lütfen kaynak dildeki (${sourceLang.toUpperCase()}) şu alanları doldurunuz: ${missing.join(", ")}`,
        );
        setIsTranslating(false);
        return;
      }

      const translations = (await generateTranslationAction({
        type: "project",
        sourceLang,
        targetLangs,
        content: {
          title: sourceContent.title,
          shortDescription: sourceContent.shortDescription,
          fullDescription: sourceContent.fullDescription,
          metaTitle: sourceContent.metaTitle || "",
          metaDescription: sourceContent.metaDescription || "",
          keywords: sourceContent.keywords || [],
        },
      })) as Record<string, ProjectContent | null>;

      // Update target inputs
      Object.entries(translations).forEach(([lang, content]) => {
        if (!content) return;
        setValue(`translations.${lang}.title` as const, content.title);
        setValue(
          `translations.${lang}.shortDescription` as const,
          content.shortDescription,
        );
        setValue(
          `translations.${lang}.fullDescription` as const,
          content.fullDescription,
        );
        setValue(
          `translations.${lang}.metaTitle` as const,
          content.metaTitle || "",
        );
        setValue(
          `translations.${lang}.metaDescription` as const,
          content.metaDescription || "",
        );
        if (content.keywords)
          setValue(`translations.${lang}.keywords` as const, content.keywords);
      });

      toast.success(t("translateSuccess"));
    } catch (error) {
      toast.error(
        "Çeviri başarısız oldu: " +
          (error instanceof Error ? error.message : "Bilinmeyen hata"),
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const onSubmitAction = async (data: ProjectFormValues) => {
    // 1. Upload cover image if it's new
    let finalCoverImage = data.coverImage || "";
    if (coverImage?.file) {
      finalCoverImage = await uploadSingleFile(
        coverImage.file,
        `projects/${data.slug}`,
      );
    }

    // 2. Upload gallery images if they are new
    const finalGalleryImages = await Promise.all(
      galleryImages.map(async (img) => {
        if (img.file) {
          return await uploadSingleFile(img.file, `projects/${data.slug}`);
        }
        return img.url;
      }),
    );

    const translationsArray = Object.entries(data.translations)
      .filter((item): item is [string, NonNullable<(typeof item)[1]>] => {
        const t = item[1];
        return !!(t && t.title && t.title.trim() !== "");
      })
      .map(([lang, t]) => ({
        language: lang as Language,
        title: t.title,
        shortDescription: t.shortDescription,
        fullDescription: t.fullDescription,
        metaTitle: t.metaTitle || "",
        metaDescription: t.metaDescription || "",
        keywords: t.keywords || [],
      }));

    const submitData: ProjectData = {
      slug: data.slug,
      status: data.status,
      category: data.category,
      github: data.github || "",
      liveDemo: data.liveDemo || "",
      featured: data.featured,
      coverImage: finalCoverImage,
      imageAlt: data.imageAlt,
      images: finalGalleryImages,
      translations: translationsArray,
      technologies: data.technologies,
    };

    if (initialData?.id) {
      await updateProjectAction(initialData.id, submitData);
      return { action: "update" };
    } else {
      const result = await createProjectAction(submitData);
      return { action: "create", id: result.id };
    }
  };

  const { loading, handleSubmit: handleFormSubmit } = useAdminForm({
    form,
    onSubmitAction,
    successMessage: initialData?.id ? t("saveSuccess") : t("createSuccess"),
    onSuccess: (result) => {
      if (result.action === "update") {
        router.refresh();
      } else if (result.action === "create" && result.id) {
        router.push(`/admin/projects/${result.id}/edit`);
        router.refresh();
      }
    },
  });

  const toggleSkill = (skillId: string) => {
    const current = getValues("technologies");
    const updated = current.includes(skillId)
      ? current.filter((id) => id !== skillId)
      : [...current, skillId];
    setValue("technologies", updated);
  };

  // Debounced search for simple-icons
  useEffect(() => {
    const searchIcons = async () => {
      if (!iconSearchQuery.trim()) {
        setIconSearchResults([]);
        return;
      }

      setIsSearchingIcons(true);
      try {
        const res = await fetch(
          `/api/admin/icons?q=${encodeURIComponent(iconSearchQuery)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setIconSearchResults(data.icons || []);
        } else {
          setIconSearchResults([]);
        }
      } catch (error) {
        console.error("Failed to search icons", error);
        setIconSearchResults([]);
      } finally {
        setIsSearchingIcons(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchIcons();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [iconSearchQuery]);

  const handleSelectSearchedIcon = (iconItem: {
    name: string;
    icon: string;
    hex: string;
  }) => {
    setNewSkillName(iconItem.name);
    setNewSkillIcon(iconItem.icon);
    setShowIconDropdown(false);
    setIconSearchQuery(""); // clear search
  };

  return (
    <form
      onSubmit={(e) => {
        // Only run hook handleSubmit
        handleFormSubmit(e);
      }}
      className="space-y-8 sm:space-y-12 max-w-5xl mx-auto pb-32 px-4 sm:px-0"
    >
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          <p className="font-bold mb-2">{t("validationError")}:</p>
          <ul className="list-disc list-inside">
            {Object.entries(errors).map(([key, value]) => {
              if (key === "translations" && value) {
                if ((value as FieldError).message) {
                  return (
                    <li key={key}>
                      {t("title")}: {(value as FieldError).message}
                    </li>
                  );
                }
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

                  return (
                    <li key={`${key}.${lang}`}>
                      {languageNames[lang as keyof typeof languageNames] ||
                        lang.toUpperCase()}
                      :{" "}
                      {Object.entries(langErrRec)
                        .map(
                          ([field, err]) =>
                            `${field === "title" ? t("title") : field === "shortDescription" ? t("shortDescription") : field} (${err.message})`,
                        )
                        .join(", ")}
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 sm:p-5 border border-border rounded-xl">
        <div>
          <h2 className="text-base sm:text-lg font-bold">{t("githubRepos")}</h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {t("githubReposDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleFetchRepos}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-all text-sm"
          disabled={isFetchingRepos}
        >
          {isFetchingRepos ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Github size={16} />
          )}
          {repos.length > 0 ? t("openRepos") : t("fetchRepos")}
        </button>
      </div>

      {showRepoModal && (
        <div className="fixed inset-0 z-60 bg-black/50 flex flex-col items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Github size={20} /> {t("selectRepo")} ({repos.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowRepoModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-2 sm:p-4 flex flex-col gap-2 sm:gap-3">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-3 sm:p-4 border border-border rounded-lg bg-muted/20 hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-colors"
                  onClick={() => handleSelectRepo(repo)}
                >
                  <div className="font-bold text-primary flex flex-wrap justify-between items-center gap-2">
                    <span className="text-sm sm:text-base">{repo.name}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted p-1 rounded font-normal">
                      {repo.language || "Unknown"}
                    </span>
                  </div>
                  {repo.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-7 space-y-6 bg-muted/20 p-4 sm:p-8 rounded-3xl border border-border/50 shadow-sm">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
              {t("slug")}
            </label>
            <input
              {...register("slug")}
              required
              className="w-full p-3 bg-background rounded-xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
              placeholder="my-awesome-project"
            />
            {errors.slug && (
              <p className="text-xs text-destructive font-medium px-1">
                {errors.slug.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
                {t("status")}
              </label>
              <select
                {...register("status")}
                className="w-full p-3 bg-background rounded-xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm cursor-pointer appearance-none"
              >
                <option>Completed</option>
                <option>Working</option>
                <option>Building</option>
                <option>Archived</option>
              </select>
              {errors.status && (
                <p className="text-xs text-destructive font-medium px-1">
                  {errors.status.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
                {t("category")}
              </label>
              <input
                {...register("category")}
                required
                className="w-full p-3 bg-background rounded-xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
                placeholder="Web App"
              />
              {errors.category && (
                <p className="text-xs text-destructive font-medium px-1">
                  {errors.category.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
              {t("coverImage")}
            </label>
            <div className="relative aspect-video bg-background/50 rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden group hover:border-primary/50 transition-all">
              {coverImage ? (
                <>
                  <Image
                    src={coverImage.url}
                    alt="Cover"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(null);
                        setValue("coverImage", "");
                      }}
                      className="p-2 bg-red-500 rounded-full text-white shadow-lg transition-transform hover:scale-110"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center hover:bg-muted/50 transition-colors">
                  <ImagePlus size={32} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">
                    {t("coverImage")}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setCoverImage)}
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
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">
                {t("imageAlt")}
              </label>
              <input
                {...register("imageAlt")}
                className="w-full p-2 bg-muted rounded border border-border text-xs focus:border-primary outline-hidden"
                placeholder={t("imageAltPlaceholder")}
              />
            </div>
          </div>

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
        </div>

        <div className="xl:col-span-5 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
              {t("githubUrl")}
            </label>
            <input
              {...register("github")}
              className="w-full p-3 bg-background rounded-xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
              placeholder="https://github.com/..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
              {t("liveDemoUrl")}
            </label>
            <input
              {...register("liveDemo")}
              className="w-full p-3 bg-background rounded-xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                {t("technologies")}
              </label>
              <button
                type="button"
                onClick={() => setShowAddSkill(!showAddSkill)}
                className="text-xs flex items-center gap-1.5 text-primary font-bold hover:scale-105 transition-all bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20"
              >
                {showAddSkill ? (
                  <>
                    <X size={14} /> {commonT("close")}
                  </>
                ) : (
                  <>
                    <Plus size={14} /> {t("quickAdd")}
                  </>
                )}
              </button>
            </div>

            {showAddSkill && (
              <div className="p-6 bg-card border- border-primary/20 rounded-3xl space-y-6 animate-in fade-in zoom-in-95 duration-300 shadow-2xl shadow-primary/5">
                <div className="flex items-center gap-2 pb-4 border-b border-border/50">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
                    {t("newSkill")}
                  </h4>
                </div>

                <div className="space-y-6">
                  {/* Search / Autocomplete Field */}
                  <div className="space-y-2 relative">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                      {t("skillName")} (Simple Icons)
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Search size={16} />
                      </div>
                      <input
                        value={iconSearchQuery}
                        onChange={(e) => {
                          setIconSearchQuery(e.target.value);
                          setShowIconDropdown(true);
                        }}
                        onFocus={() => setShowIconDropdown(true)}
                        onBlur={() => {
                          setTimeout(() => setShowIconDropdown(false), 200);
                        }}
                        placeholder={t("skillSearchPlaceholder")}
                        className="w-full py-3.5 pl-11 pr-10 text-sm bg-background rounded-2xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                      />
                      {isSearchingIcons && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                          <Loader2 size={16} className="animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showIconDropdown && iconSearchResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        {iconSearchResults.map((result, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSearchedIcon(result)}
                            className="flex items-center gap-4 px-5 py-3 hover:bg-primary/5 cursor-pointer transition-colors border-b border-border/5 last:border-0 group"
                          >
                            <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors">
                              <Image
                                src={result.icon}
                                alt={result.name}
                                width={24}
                                height={24}
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                            <span className="text-sm font-bold tracking-tight">
                              {result.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                        {t("skillName")}
                      </label>
                      <input
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        placeholder={t("skillNamePlaceholder")}
                        className="w-full p-3.5 text-sm bg-background rounded-2xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                        {t("skillIcon")} (Emoji veya URL)
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative group">
                          <input
                            value={newSkillIcon}
                            onChange={(e) => setNewSkillIcon(e.target.value)}
                            placeholder={t("emojiOrUrl")}
                            className="w-full pl-3.5 pr-12 py-3.5 text-sm bg-background rounded-2xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                          />
                          {newSkillIcon && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-muted/50 rounded-xl border border-border/50 overflow-hidden">
                              <Icon
                                src={newSkillIcon}
                                alt="Preview"
                                size={18}
                              />
                            </div>
                          )}
                        </div>
                        <label className="p-3.5 cursor-pointer bg-primary text-primary-foreground rounded-2xl hover:scale-105 transition-all flex items-center justify-center min-w-[50px] shadow-lg shadow-primary/20 active:scale-95">
                          <ImagePlus size={20} />
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              handleImageUpload(
                                e,
                                (data) => setNewSkillIcon(data.url),
                                "skills",
                              )
                            }
                            accept="image/*"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickAddSkill}
                    disabled={isAddingSkill || !newSkillName || !newSkillIcon}
                    className="w-full py-4 bg-primary text-primary-foreground text-sm font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] transition-all shadow-xl shadow-primary/20 active:scale-[0.98]"
                  >
                    {isAddingSkill ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      <Plus size={18} />
                    )}
                    {t("quickAdd")}
                  </button>
                </div>
              </div>
            )}

            {/* Skill List Search */}
            <div className="relative mb-4">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={skillListFilter}
                onChange={(e) => setSkillListFilter(e.target.value)}
                placeholder={
                  t("skillSearchPlaceholder") || "Teknolojilerde ara..."
                }
                className="w-full py-3.5 pl-11 pr-10 text-sm bg-background rounded-2xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
              />
              {skillListFilter && (
                <button
                  type="button"
                  onClick={() => setSkillListFilter("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5 max-h-72 overflow-y-auto p-4 bg-background/50 rounded-2xl border border-border/50 custom-scrollbar">
              {availableSkills
                .filter((s) =>
                  s.name.toLowerCase().includes(skillListFilter.toLowerCase()),
                )
                .map((skill) => (
                  <div key={skill.id} className="relative group/skill">
                    <button
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 border-2 pr-10 shadow-sm ${
                        selectedSkills.includes(skill.id)
                          ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 -translate-y-0.5"
                          : "bg-background border-border/50 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <Icon
                        src={skill.icon || "/images/default-tech.png"}
                        alt={skill.name}
                        size={18}
                      />
                      {skill.name}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSkill(e, skill.id)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover/skill:opacity-100 transition-all bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm"
                      title={commonT("delete")}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Galeri Bölümü */}
      <div className="p-4 sm:p-8 bg-muted/20 border border-border/50 rounded-3xl space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
          <div>
            <h3 className="text-xl font-bold tracking-tight">{t("gallery")}</h3>
            <p className="text-sm text-muted-foreground">{t("galleryDesc")}</p>
          </div>
          <label className="cursor-pointer w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
            <Plus size={18} /> {t("gallery")}
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleGalleryUpload}
              accept="image/*"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {galleryImages.map((img, index) => (
            <div
              key={index}
              className="relative aspect-video sm:aspect-square bg-muted rounded-2xl overflow-hidden group border border-border/50 shadow-sm"
            >
              <Image
                src={img.url}
                alt={`Gallery ${index}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />

              {/* Overlays & Controls */}
              <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveGalleryImage(index, "left")}
                    disabled={index === 0}
                    className="p-2 bg-background/80 hover:bg-background text-foreground rounded-xl disabled:opacity-20 transition-all active:scale-90"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="p-2.5 bg-destructive text-white rounded-xl hover:bg-destructive/90 transition-all shadow-lg active:scale-90"
                    title={commonT("delete")}
                  >
                    <Trash2 size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveGalleryImage(index, "right")}
                    disabled={index === galleryImages.length - 1}
                    className="p-2 bg-background/80 hover:bg-background text-foreground rounded-xl disabled:opacity-20 transition-all active:scale-90"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(img);
                    setValue("coverImage", img.url);
                  }}
                  className={`w-[80%] py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                    coverImage?.url === img.url
                      ? "bg-amber-500 text-white cursor-default"
                      : "bg-background/80 hover:bg-background text-foreground active:scale-95"
                  }`}
                >
                  <Star
                    size={14}
                    fill={coverImage?.url === img.url ? "currentColor" : "none"}
                  />
                  {coverImage?.url === img.url
                    ? t("isCover") || "Kapak"
                    : t("makeCover")}
                </button>
              </div>

              {/* Index Badge */}
              <div className="absolute top-2 left-2 px-2.5 py-1 bg-background/80 backdrop-blur-sm text-foreground text-[10px] font-bold rounded-lg border border-border/50 shadow-sm">
                #{index + 1}
              </div>
            </div>
          ))}
          {galleryImages.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-border/50 rounded-3xl text-muted-foreground animate-pulse">
              <div className="flex flex-col items-center gap-2">
                <ImagePlus size={32} className="opacity-20" />
                <p className="italic text-sm">{commonT("noResults")}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* Translation Controls */}
      <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20 flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-primary whitespace-nowrap">
                {t("sourceLanguage")}:
              </span>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-border/50 bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none cursor-pointer hover:bg-muted transition-all appearance-none min-w-[120px]"
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
            className="w-full md:w-auto px-6 py-3 bg-purple-600 text-white rounded-2xl text-sm font-bold hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {isTranslating ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {t("translate")}
          </button>
        </div>
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
          <p className="text-xs text-muted-foreground font-medium">
            {t("autoTranslate")}
          </p>
        </div>
      </div>

      <LanguageTabs sourceLang={sourceLang} targetLangs={targetLangs}>
        {(lang) => (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex justify-end mb-4">
              <SeoPopover
                type="project"
                language={lang}
                onSeoGenerated={(result) => {
                  setValue(
                    `translations.${lang}.title` as const,
                    result.title,
                    { shouldDirty: true },
                  );
                  if (result.shortDescription) {
                    setValue(
                      `translations.${lang}.shortDescription` as const,
                      result.shortDescription,
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

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
                {t("title")}
              </label>
              <input
                {...register(`translations.${lang}.title` as const)}
                className="w-full p-4 bg-background rounded-2xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1">
                {t("shortDescription")}
              </label>
              <textarea
                {...register(`translations.${lang}.shortDescription` as const)}
                className="w-full p-4 bg-background rounded-2xl border border-border/50 h-32 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm leading-relaxed"
                placeholder="..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-1 flex items-center gap-2">
                <FileText size={14} className="text-primary" />{" "}
                {t("fullDescription")} (HTML)
              </label>
              <TipTapEditor
                content={
                  getValues(`translations.${lang}.fullDescription` as const) ||
                  ""
                }
                onChange={(html) =>
                  setValue(
                    `translations.${lang}.fullDescription` as const,
                    html,
                    {
                      shouldDirty: true,
                    },
                  )
                }
                uploadPath={`projects/${getValues("slug") || "temp"}`}
              />
            </div>

            {/* SEO Meta Fields for Projects */}
            <div className="space-y-4 pt-6 border-t border-border/50 mt-6">
              <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                {t("seo")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">
                    {t("metaTitle")}
                  </label>
                  <input
                    {...register(`translations.${lang}.metaTitle` as const)}
                    className="w-full p-3.5 bg-background rounded-2xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">
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
                    className="w-full p-3.5 bg-background rounded-2xl border border-border/50 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
                    placeholder="react, tailwind..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">
                  {t("metaDescription")}
                </label>
                <textarea
                  {...register(`translations.${lang}.metaDescription` as const)}
                  className="w-full p-4 bg-background rounded-2xl border border-border/50 h-32 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm leading-relaxed"
                  placeholder="..."
                />
              </div>
            </div>
          </div>
        )}
      </LanguageTabs>

      <div className="fixed bottom-4 sm:bottom-8 left-0 right-0 z-40 px-4 sm:px-0 flex justify-center pointer-events-none">
        <div className="max-w-5xl w-full flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 bg-background/80 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-2xl border border-border/50 pointer-events-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3.5 bg-secondary/50 text-secondary-foreground rounded-2xl font-bold hover:bg-secondary transition-all active:scale-[0.98] text-sm"
          >
            {useTranslations("Admin.Common")("cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-12 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary/20 active:scale-[0.98] text-sm"
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {t("save")}
          </button>
        </div>
      </div>
    </form>
  );
}
