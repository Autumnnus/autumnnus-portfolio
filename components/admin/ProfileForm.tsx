"use client";

import { updateProfileAction, uploadImageAction } from "@/app/admin/actions";
import { generateTranslationAction } from "@/app/admin/ai-actions";
import MultiLanguageSelector from "@/components/admin/MultiLanguageSelector";
import { languageNames } from "@/i18n/routing";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface ProfileTranslation {
  language: string;
  name: string;
  title: string;
  greetingText: string;
  description: string;
  aboutTitle: string;
  aboutDescription: string;
}

export interface Profile {
  id?: string;
  avatar: string;
  email: string;
  github: string;
  linkedin: string;
  translations: ProfileTranslation[];
}

interface ProfileFormProps {
  initialData?: Profile;
}

interface ImageData {
  url: string;
  file?: File;
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<ImageData | null>(
    initialData?.avatar ? { url: initialData.avatar } : null,
  );

  const [sourceLang, setSourceLang] = useState<string>("tr");
  const [targetLangs, setTargetLangs] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatar({ url: previewUrl, file });
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

      // Helper to get value safely
      const getValue = (name: string) =>
        (
          form.elements.namedItem(name) as
            | HTMLInputElement
            | HTMLTextAreaElement
        )?.value || "";

      const name = getValue(`name_${sourceLang}`);
      const title = getValue(`title_${sourceLang}`);
      const greetingText = getValue(`greetingText_${sourceLang}`);
      const description = getValue(`description_${sourceLang}`);
      const aboutTitle = getValue(`aboutTitle_${sourceLang}`);
      const aboutDescription = getValue(`aboutDescription_${sourceLang}`);

      if (
        !name ||
        !title ||
        !greetingText ||
        !description ||
        !aboutTitle ||
        !aboutDescription
      ) {
        alert("Lütfen kaynak dildeki alanları doldurunuz.");
        setIsTranslating(false);
        return;
      }

      const translations = await generateTranslationAction({
        type: "profile",
        sourceLang,
        targetLangs,
        content: {
          name,
          title,
          greetingText,
          description,
          aboutTitle,
          aboutDescription,
        },
      });

      // Update target inputs
      Object.entries(translations).forEach(([lang, content]: [string, any]) => {
        if (!content) return;

        const setValue = (name: string, val: string) => {
          const el = form.elements.namedItem(name) as
            | HTMLInputElement
            | HTMLTextAreaElement;
          if (el) el.value = val;
        };

        setValue(`name_${lang}`, content.name);
        setValue(`title_${lang}`, content.title);
        setValue(`greetingText_${lang}`, content.greetingText);
        setValue(`description_${lang}`, content.description);
        setValue(`aboutTitle_${lang}`, content.aboutTitle);
        setValue(`aboutDescription_${lang}`, content.aboutDescription);
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
      let finalAvatar = avatar?.url || "";
      if (avatar?.file) {
        finalAvatar = await uploadSingleFile(avatar.file, "profile");
      }

      const formData = new FormData(e.currentTarget);
      const translations = Object.keys(languageNames).map((lang) => ({
        language: lang as any,
        name: formData.get(`name_${lang}`) as string,
        title: formData.get(`title_${lang}`) as string,
        greetingText: formData.get(`greetingText_${lang}`) as string,
        description: formData.get(`description_${lang}`) as string,
        aboutTitle: formData.get(`aboutTitle_${lang}`) as string,
        aboutDescription: formData.get(`aboutDescription_${lang}`) as string,
      }));

      const data = {
        avatar: finalAvatar,
        email: formData.get("email") as string,
        github: formData.get("github") as string,
        linkedin: formData.get("linkedin") as string,
        translations: translations,
      };

      await updateProfileAction(data);
      alert("Profil başarıyla güncellendi");
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
            <label className="text-sm font-medium">Avatar</label>
            <div className="relative w-32 h-32 bg-muted rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:bg-muted/50 transition-colors">
              {avatar ? (
                <>
                  <Image
                    src={avatar.url}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white shadow-lg transition-transform hover:scale-110"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-1 w-full h-full justify-center">
                  <ImagePlus size={24} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Yükle
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              name="email"
              defaultValue={initialData?.email}
              required
              className="w-full p-2 bg-muted rounded border border-border"
              placeholder="hello@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">GitHub URL</label>
            <input
              name="github"
              defaultValue={initialData?.github}
              className="w-full p-2 bg-muted rounded border border-border"
              placeholder="https://github.com/..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">LinkedIn URL</label>
            <input
              name="linkedin"
              defaultValue={initialData?.linkedin}
              className="w-full p-2 bg-muted rounded border border-border"
              placeholder="https://linkedin.com/in/..."
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* Translation Controls */}
      <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">Kaynak Dil:</span>
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
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  İsim
                </label>
                <input
                  name={`name_${lang}`}
                  defaultValue={translation?.name}
                  required={lang === sourceLang}
                  className="w-full p-2 bg-muted rounded border border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Unvan
                </label>
                <input
                  name={`title_${lang}`}
                  defaultValue={translation?.title}
                  required={lang === sourceLang}
                  className="w-full p-2 bg-muted rounded border border-border"
                  placeholder="Full Stack Developer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Karşılama Metni
                </label>
                <input
                  name={`greetingText_${lang}`}
                  defaultValue={translation?.greetingText}
                  required={lang === sourceLang}
                  className="w-full p-2 bg-muted rounded border border-border"
                  placeholder="Merhaba, ben"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Hero Açıklama
                </label>
                <textarea
                  name={`description_${lang}`}
                  defaultValue={translation?.description}
                  required={lang === sourceLang}
                  className="w-full p-2 bg-muted rounded border border-border h-24"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Hakkımda Başlık
                </label>
                <input
                  name={`aboutTitle_${lang}`}
                  defaultValue={translation?.aboutTitle}
                  required={lang === sourceLang}
                  className="w-full p-2 bg-muted rounded border border-border"
                  placeholder="Hakkımda"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Hakkımda Detay
                </label>
                <textarea
                  name={`aboutDescription_${lang}`}
                  defaultValue={translation?.aboutDescription}
                  required={lang === sourceLang}
                  className="w-full p-2 bg-muted rounded border border-border h-48"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-4 border-t border-border pt-8">
        <button
          type="submit"
          disabled={loading}
          className="px-12 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          {loading && <Loader2 className="animate-spin w-4 h-4" />} Profili
          Kaydet
        </button>
      </div>
    </form>
  );
}
