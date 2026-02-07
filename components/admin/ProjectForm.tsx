"use client";

import {
  createProjectAction,
  createSkillAction,
  updateProjectAction,
  uploadImageAction,
} from "@/app/admin/actions";
import { generateTranslationAction } from "@/app/admin/ai-actions";
import MultiLanguageSelector from "@/components/admin/MultiLanguageSelector";
import Icon from "@/components/common/Icon";
import { languageNames } from "@/i18n/routing";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Plus,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Skill {
  id: string;
  name: string;
  icon: string;
}

interface ProjectFormProps {
  skills: Skill[];
  initialData?: any;
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
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialData?.technologies?.map((t: any) => t.id) || [],
  );

  const [slug, setSlug] = useState(initialData?.slug || "");
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillIcon, setNewSkillIcon] = useState("");
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // AI Translation State
  const [sourceLang, setSourceLang] = useState<string>("tr");
  const [targetLangs, setTargetLangs] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

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
        alert("Yükleme başarısız oldu");
      } finally {
        setLoading(false);
      }
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setter({ url: previewUrl, file });
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

    setGalleryImages((prev) => [...prev, ...newImages]);
  };

  const removeGalleryImage = (index: number) => {
    const imageToRemove = galleryImages[index];
    if (imageToRemove.file) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveGalleryImage = (index: number, direction: "left" | "right") => {
    setGalleryImages((prev) => {
      const newImages = [...prev];
      const targetIndex = direction === "left" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newImages.length) return prev;

      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;

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
      setAvailableSkills((prev) => [...prev, newSkill as any]);
      setSelectedSkills((prev) => [...prev, (newSkill as any).id]);
      setShowAddSkill(false);
      setNewSkillName("");
      setNewSkillIcon("");
    } catch (err) {
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
      const form = document.querySelector("form") as HTMLFormElement;

      const title = (
        form.elements.namedItem(`title_${sourceLang}`) as HTMLInputElement
      ).value;
      const shortDescription = (
        form.elements.namedItem(
          `shortDescription_${sourceLang}`,
        ) as HTMLTextAreaElement
      ).value;
      const fullDescription = (
        form.elements.namedItem(
          `fullDescription_${sourceLang}`,
        ) as HTMLTextAreaElement
      ).value;

      if (!title || !shortDescription || !fullDescription) {
        alert("Lütfen kaynak dildeki alanları doldurunuz.");
        setIsTranslating(false);
        return;
      }

      const translations = await generateTranslationAction({
        type: "project",
        sourceLang,
        targetLangs,
        content: { title, shortDescription, fullDescription },
      });

      // Update target inputs
      Object.entries(translations).forEach(([lang, content]: [string, any]) => {
        if (!content) return;
        const titleInput = form.elements.namedItem(
          `title_${lang}`,
        ) as HTMLInputElement;
        const shortDescInput = form.elements.namedItem(
          `shortDescription_${lang}`,
        ) as HTMLTextAreaElement;
        const fullDescInput = form.elements.namedItem(
          `fullDescription_${lang}`,
        ) as HTMLTextAreaElement;

        if (titleInput) titleInput.value = content.title;
        if (shortDescInput) shortDescInput.value = content.shortDescription;
        if (fullDescInput) fullDescInput.value = content.fullDescription;
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
      // 1. Upload cover image if it's new
      let finalCoverImage = coverImage?.url || "";
      if (coverImage?.file) {
        finalCoverImage = await uploadSingleFile(
          coverImage.file,
          `projects/${slug}`,
        );
      }

      // 2. Upload gallery images if they are new
      const finalGalleryImages = await Promise.all(
        galleryImages.map(async (img) => {
          if (img.file) {
            return await uploadSingleFile(img.file, `projects/${slug}`);
          }
          return img.url;
        }),
      );

      const formData = new FormData(e.currentTarget);
      const translations = Object.keys(languageNames).map((lang) => ({
        language: lang as any,
        title: formData.get(`title_${lang}`) as string,
        shortDescription: formData.get(`shortDescription_${lang}`) as string,
        fullDescription: formData.get(`fullDescription_${lang}`) as string,
      }));

      const data = {
        slug: slug,
        status: formData.get("status") as string,
        category: formData.get("category") as string,
        github: formData.get("github") as string,
        liveDemo: formData.get("liveDemo") as string,
        featured: formData.get("featured") === "on",
        coverImage: finalCoverImage,
        images: finalGalleryImages,
        translations: translations,
        technologies: selectedSkills,
      };

      if (initialData?.id) {
        await updateProjectAction(initialData.id, data);
      } else {
        await createProjectAction(data);
      }
      router.push("/admin/projects");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "İşlem başarısız oldu";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId],
    );
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
              className="w-full p-2 bg-muted rounded border border-border"
              placeholder="my-awesome-project"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <select
                name="status"
                defaultValue={initialData?.status || "Completed"}
                className="w-full p-2 bg-muted rounded border border-border"
              >
                <option>Completed</option>
                <option>Working</option>
                <option>Building</option>
                <option>Archived</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori</label>
              <input
                name="category"
                defaultValue={initialData?.category}
                required
                className="w-full p-2 bg-muted rounded border border-border"
                placeholder="Web App"
              />
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
                    onClick={() => setCoverImage(null)}
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
              Öne Çıkarılan Proje
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">GitHub URL</label>
            <input
              name="github"
              defaultValue={initialData?.github}
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-none transition-all"
              placeholder="https://github.com/..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Canlı Demo URL</label>
            <input
              name="liveDemo"
              defaultValue={initialData?.liveDemo}
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
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                      Teknoloji Adı
                    </label>
                    <input
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="Örn: Bun, GraphQL, Rust"
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
                          placeholder="🚀 veya https://..."
                          className="w-full p-2.5 text-sm bg-muted/50 rounded-lg border border-border focus:border-primary outline-hidden transition-all pr-10"
                        />
                        {newSkillIcon && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-card rounded pointer-events-none border border-border/50">
                            <Icon src={newSkillIcon} alt="Preview" size={16} />
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
                  onClick={() => setCoverImage(img)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.keys(languageNames).map((lang) => {
          const translation = initialData?.translations?.find(
            (t: any) => t.language === lang,
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
                  className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Kısa Açıklama
                </label>
                <textarea
                  name={`shortDescription_${lang}`}
                  defaultValue={translation?.shortDescription}
                  className="w-full p-2 bg-muted rounded border border-border h-24 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Detaylı İçerik (Markdown)
                </label>
                <textarea
                  name={`fullDescription_${lang}`}
                  defaultValue={translation?.fullDescription}
                  className="w-full p-2 bg-muted rounded border border-border h-48 focus:border-primary outline-none transition-all"
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
          className="px-12 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          {loading && <Loader2 className="animate-spin w-4 h-4" />} Projeyi
          Kaydet
        </button>
      </div>
    </form>
  );
}
