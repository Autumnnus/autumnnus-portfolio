"use client";

import {
  createProjectAction,
  createSkillAction,
  fetchGithubReposAction,
  ProjectData,
  updateProjectAction,
  uploadImageAction,
} from "@/app/admin/actions";
import {
  generateTranslationAction,
  ProjectContent,
} from "@/app/admin/ai-actions";
import LanguageTabs from "@/components/admin/LanguageTabs";
import MultiLanguageSelector from "@/components/admin/MultiLanguageSelector";
import Icon from "@/components/common/Icon";
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
import {
  FieldError,
  FieldErrors,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import SeoPopover from "./SeoPopover";
import TipTapEditor from "./TipTapEditor";

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<ImageData | null>(
    initialData?.coverImage ? { url: initialData.coverImage } : null,
  );
  const [galleryImages, setGalleryImages] = useState<ImageData[]>(
    initialData?.images?.map((url: string) => ({ url })) || [],
  );
  const [availableSkills, setAvailableSkills] =
    useState<Skill[]>(initialSkills);

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
      alert((err as Error).message || "Repolar alınırken hata oluştu.");
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
    handleSubmit,
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
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", customPath);

      try {
        const res = await uploadImageAction(formData);
        setter({ url: res.url });
      } catch (err) {
        console.error(err);
        alert("Yükleme başarısız oldu");
      } finally {
        setLoading(false);
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
      alert("Lütfen isim ve ikon seçiniz");
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
    } catch (err) {
      console.error(err);
      alert("Teknoloji eklenemedi");
    } finally {
      setIsAddingSkill(false);
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
      alert("Lütfen en az bir hedef dil seçiniz.");
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
        alert(
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

  const onSubmit: SubmitHandler<ProjectFormValues> = async (data) => {
    setLoading(true);

    try {
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
        router.refresh();
      } else {
        const result = await createProjectAction(submitData);
        router.push(`/admin/projects/${result.id}/edit`);
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "İşlem başarısız oldu";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = (errors: FieldErrors<ProjectFormValues>) => {
    console.warn("Project Form Hataları:", errors);
  };

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
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="space-y-8 max-w-4xl mx-auto pb-20"
    >
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          <p className="font-bold mb-2">Lütfen formdaki hataları düzeltiniz:</p>
          <ul className="list-disc list-inside">
            {Object.entries(errors).map(([key, value]) => {
              if (key === "translations" && value) {
                if ((value as FieldError).message) {
                  return (
                    <li key={key}>
                      İçerik Hatası: {(value as FieldError).message}
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
                            `${field === "title" ? "Ad" : field === "shortDescription" ? "Kısa Açıklama" : field} (${err.message})`,
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
                    ? "URL Uzantısı"
                    : key.charAt(0).toUpperCase() + key.slice(1)}
                  : {err?.message || "Geçersiz değer"}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex justify-between items-center bg-muted/30 p-5 border border-border rounded-xl">
        <div>
          <h2 className="text-lg font-bold">GitHub Repoları</h2>
          <p className="text-xs text-muted-foreground">
            GitHub&apos;dan projenizi seçerek bilgileri otomatik doldurun.
          </p>
        </div>
        <button
          type="button"
          onClick={handleFetchRepos}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-all text-sm"
          disabled={isFetchingRepos}
        >
          {isFetchingRepos ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Github size={16} />
          )}
          {repos.length > 0 ? "Repoları Aç" : "GitHub&apos;dan Çek"}
        </button>
      </div>

      {showRepoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl max-h-[80vh] rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Github size={20} /> Repo Seç ({repos.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowRepoModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex flex-col gap-3">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-4 border border-border rounded-lg bg-muted/20 hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-colors"
                  onClick={() => handleSelectRepo(repo)}
                >
                  <div className="font-bold text-primary flex justify-between">
                    <span>{repo.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted p-1 rounded font-normal">
                      {repo.language || "Unknown"}
                    </span>
                  </div>
                  {repo.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug (URL)</label>
            <input
              {...register("slug")}
              required
              className="w-full p-2 bg-muted rounded border border-border"
              placeholder="my-awesome-project"
            />
            {errors.slug && (
              <p className="text-xs text-red-500">{errors.slug.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <select
                {...register("status")}
                className="w-full p-2 bg-muted rounded border border-border"
              >
                <option>Completed</option>
                <option>Working</option>
                <option>Building</option>
                <option>Archived</option>
              </select>
              {errors.status && (
                <p className="text-xs text-red-500">{errors.status.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori</label>
              <input
                {...register("category")}
                required
                className="w-full p-2 bg-muted rounded border border-border"
                placeholder="Web App"
              />
              {errors.category && (
                <p className="text-xs text-red-500">
                  {errors.category.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Kapak Görseli</label>
            <div className="relative aspect-video bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
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
                <label className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center hover:bg-muted/50 transition-colors">
                  <ImagePlus size={32} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">
                    Kapak Resmi Yükle
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
                Kapak Görseli Alt Metni (SEO)
              </label>
              <input
                {...register("imageAlt")}
                className="w-full p-2 bg-muted rounded border border-border text-xs focus:border-primary outline-hidden"
                placeholder="Örn: Portfolyo web sitesi ana sayfa görünümü"
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
              Öne Çıkarılan Proje
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">GitHub URL</label>
            <input
              {...register("github")}
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-none transition-all"
              placeholder="https://github.com/..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Canlı Demo URL</label>
            <input
              {...register("liveDemo")}
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-none transition-all"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Teknolojiler</label>
              <button
                type="button"
                onClick={() => setShowAddSkill(!showAddSkill)}
                className="text-xs flex items-center gap-1 text-primary font-bold hover:underline"
              >
                <Plus size={12} /> {showAddSkill ? "Kapat" : "Yeni Ekle"}
              </button>
            </div>

            {showAddSkill && (
              <div className="p-5 bg-card border-2 border-primary/20 rounded-xl space-y-5 animate-in fade-in zoom-in-95 duration-200 shadow-xl shadow-primary/5">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Yeni Teknoloji Tanımla
                  </h4>
                </div>

                <div className="space-y-4">
                  {/* Search / Autocomplete Field */}
                  <div className="space-y-2 relative">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                      Teknoloji Ara (Simple Icons)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Search size={14} />
                      </div>
                      <input
                        value={iconSearchQuery}
                        onChange={(e) => {
                          setIconSearchQuery(e.target.value);
                          setShowIconDropdown(true);
                        }}
                        onFocus={() => setShowIconDropdown(true)}
                        onBlur={() => {
                          // Allow click on dropdown items to register before hiding
                          setTimeout(() => setShowIconDropdown(false), 200);
                        }}
                        placeholder="Örn: React, Tailwind, Supabase..."
                        className="w-full py-2.5 pl-9 pr-10 text-sm bg-muted/50 rounded-lg border border-border focus:border-primary outline-hidden transition-all"
                      />
                      {isSearchingIcons && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                          <Loader2 size={14} className="animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showIconDropdown && iconSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                        {iconSearchResults.map((result, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSearchedIcon(result)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-muted cursor-pointer transition-colors border-b border-border/50 last:border-0"
                          >
                            <Image
                              src={result.icon}
                              alt={result.name}
                              width={20}
                              height={20}
                              className="object-contain"
                              unoptimized
                            />
                            <span className="text-sm font-medium">
                              {result.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                        Seçilen / Manuel İsim
                      </label>
                      <input
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        placeholder="Örn: Bun"
                        className="w-full p-2.5 text-sm bg-muted/50 rounded-lg border border-border focus:border-primary outline-hidden transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                        İkon (Emoji veya URL)
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative group">
                          <input
                            value={newSkillIcon}
                            onChange={(e) => setNewSkillIcon(e.target.value)}
                            placeholder="🚀 veya URL..."
                            className="w-full px-2.5 py-2.5 text-sm bg-muted/50 rounded-lg border border-border focus:border-primary outline-hidden transition-all pr-10"
                          />
                          {newSkillIcon && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-background rounded border border-border">
                              <Icon
                                src={newSkillIcon}
                                alt="Preview"
                                size={16}
                              />
                            </div>
                          )}
                        </div>
                        <label className="p-2.5 cursor-pointer bg-primary/10 border border-primary/20 rounded-lg text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center min-w-[44px]">
                          <ImagePlus size={18} />
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
                    className="w-full py-3 bg-primary text-primary-foreground text-sm font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                  >
                    {isAddingSkill ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Plus size={16} />
                    )}
                    Kütüphaneye Ekle
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-3 bg-muted/30 rounded-xl border border-border/50">
              {availableSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2.5 border-2 ${
                    selectedSkills.includes(skill.id)
                      ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 -translate-y-0.5"
                      : "bg-card border-border/50 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <Icon src={skill.icon} alt={skill.name} size={16} />
                  {skill.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Galeri Bölümü */}
      <div className="p-6 bg-muted/20 border border-border rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">Proje Galerisi</h3>
            <p className="text-xs text-muted-foreground">
              Proje detay sayfasında görünecek ekstra resimler
            </p>
          </div>
          <label className="cursor-pointer px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-bold hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-2">
            <Plus size={16} /> Resim Ekle
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleGalleryUpload}
              accept="image/*"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {galleryImages.map((img, index) => (
            <div
              key={index}
              className="relative aspect-video bg-muted rounded-lg overflow-hidden group border border-border/50"
            >
              <Image
                src={img.url}
                alt={`Gallery ${index}`}
                fill
                className="object-cover transition-transform group-hover:scale-110"
                unoptimized
              />

              {/* Overlays & Controls */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => moveGalleryImage(index, "left")}
                  disabled={index === 0}
                  className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-md disabled:opacity-20 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => removeGalleryImage(index)}
                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-lg"
                  title="Sil"
                >
                  <Trash2 size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(img);
                    setValue("coverImage", img.url);
                  }}
                  className={`p-2 rounded-md transition-colors shadow-lg ${
                    coverImage?.url === img.url
                      ? "bg-yellow-500 text-white cursor-default"
                      : "bg-white/20 hover:bg-white/40 text-white"
                  }`}
                  title="Kapak Resmi Yap"
                >
                  <Star
                    size={18}
                    fill={coverImage?.url === img.url ? "currentColor" : "none"}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => moveGalleryImage(index, "right")}
                  disabled={index === galleryImages.length - 1}
                  className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-md disabled:opacity-20 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Index Badge */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded shadow-sm">
                #{index + 1}
              </div>
            </div>
          ))}
          {galleryImages.length === 0 && (
            <div className="col-span-full py-10 text-center border-2 border-dashed border-border/50 rounded-lg text-muted-foreground italic text-sm">
              Henüz galeride resim yok.
            </div>
          )}
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
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                Proje Adı
              </label>
              <input
                {...register(`translations.${lang}.title` as const)}
                className="w-full p-3 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                Kısa Açıklama (Kart vs.)
              </label>
              <textarea
                {...register(`translations.${lang}.shortDescription` as const)}
                className="w-full p-3 bg-background rounded-lg border border-border h-24 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all"
                placeholder="Projenin 2-3 cümlelik özeti..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <FileText size={12} /> Full Açıklama (HTML)
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
                SEO Meta Verileri
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Meta Başlık
                  </label>
                  <input
                    {...register(`translations.${lang}.metaTitle` as const)}
                    className="w-full p-3 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Anahtar Kelimeler
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
                    placeholder="react, tailwind, portfolio (virgülle ayırın)"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Meta Açıklama
                </label>
                <textarea
                  {...register(`translations.${lang}.metaDescription` as const)}
                  className="w-full p-3 bg-background rounded-lg border border-border h-24 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm"
                  placeholder="Google'da görünecek açıklama..."
                />
              </div>
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
          İptal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-12 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          {loading && <Loader2 className="animate-spin w-4 h-4" />} Projeyi
          Kaydet
        </button>
      </div>
    </form>
  );
}
