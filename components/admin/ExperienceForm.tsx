"use client";

import {
  createExperienceAction,
  updateExperienceAction,
  uploadImageAction,
} from "@/app/admin/actions";
import { generateTranslationAction } from "@/app/admin/ai-actions";
import { Input } from "@/components/ui/Input";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface ExperienceTranslation {
  language: "tr" | "en";
  role: string;
  description: string;
  locationType: string;
}

export interface Experience {
  id?: string;
  company: string;
  logo: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  translations: ExperienceTranslation[];
}

interface ExperienceFormProps {
  initialData?: Experience;
}

interface ImageData {
  url: string;
  file?: File;
}

const formatDateForInput = (date?: string | Date | null) => {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
};

export default function ExperienceForm({ initialData }: ExperienceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [sourceLang, setSourceLang] = useState<"tr" | "en">("tr");
  const [isTranslating, setIsTranslating] = useState(false);

  const [logo, setLogo] = useState<ImageData | null>(
    initialData?.logo ? { url: initialData.logo } : null,
  );

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
    setLogo({ url: previewUrl, file });
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

      const role = (
        form.elements.namedItem(`role_${sourceLang}`) as HTMLInputElement
      ).value;
      const description = (
        form.elements.namedItem(
          `description_${sourceLang}`,
        ) as HTMLTextAreaElement
      ).value;
      const locationType = (
        form.elements.namedItem(
          `locationType_${sourceLang}`,
        ) as HTMLInputElement
      ).value;

      if (!role || !description || !locationType) {
        alert("Lütfen kaynak dildeki alanları doldurunuz.");
        setIsTranslating(false);
        return;
      }

      const translation = await generateTranslationAction({
        type: "experience",
        sourceLang,
        targetLang,
        content: { role, description, locationType },
      });

      // Update target inputs
      (
        form.elements.namedItem(`role_${targetLang}`) as HTMLInputElement
      ).value = translation.role;
      (
        form.elements.namedItem(
          `description_${targetLang}`,
        ) as HTMLTextAreaElement
      ).value = translation.description;
      (
        form.elements.namedItem(
          `locationType_${targetLang}`,
        ) as HTMLInputElement
      ).value = translation.locationType;
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
      let finalLogo = logo?.url || "";
      if (logo?.file) {
        finalLogo = await uploadSingleFile(logo.file, "experience");
      }

      const formData = new FormData(e.currentTarget);
      const startDateStr = formData.get("startDate") as string;
      const endDateStr = formData.get("endDate") as string;

      const data = {
        company: formData.get("company") as string,
        logo: finalLogo,
        startDate: startDateStr ? new Date(startDateStr) : null,
        endDate: endDateStr ? new Date(endDateStr) : null,
        translations: [
          {
            language: "tr",
            role: formData.get("role_tr") as string,
            description: formData.get("description_tr") as string,
            locationType: formData.get("locationType_tr") as string,
          },
          {
            language: "en",
            role: formData.get("role_en") as string,
            description: formData.get("description_en") as string,
            locationType: formData.get("locationType_en") as string,
          },
        ],
      };

      if (initialData?.id) {
        await updateExperienceAction(initialData.id, data);
      } else {
        await createExperienceAction(data);
      }

      router.push("/admin/experience");
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="space-y-2">
          <label className="text-sm font-medium">Şirket Logosu</label>
          <div className="relative w-full aspect-square md:w-full bg-muted rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:bg-muted/50 transition-colors group">
            {logo ? (
              <>
                <Image
                  src={logo.url}
                  alt="Logo"
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => setLogo(null)}
                  className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-3 w-full h-full justify-center text-muted-foreground hover:text-primary transition-colors">
                <ImagePlus size={32} />
                <span className="text-sm font-medium">Logo Seç</span>
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

        <div className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Şirket Adı</label>
            <Input
              name="company"
              defaultValue={initialData?.company}
              required
              placeholder="Örn: Google, Amazon"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Başlangıç Tarihi</label>
              <Input
                type="date"
                name="startDate"
                defaultValue={formatDateForInput(initialData?.startDate)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bitiş Tarihi</label>
              <div className="relative">
                <Input
                  type="date"
                  name="endDate"
                  defaultValue={formatDateForInput(initialData?.endDate)}
                />
                <span className="text-[10px] text-muted-foreground absolute -bottom-5 left-0">
                  Devam ediyorsa boş bırakın
                </span>
              </div>
            </div>
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
        {/* Türkçe */}
        <div className="space-y-4 p-6 bg-muted/30 rounded-xl border border-border/50">
          <h3 className="font-bold border-b border-border pb-2 text-primary flex items-center gap-2">
            <span className="text-lg">🇹🇷</span> Türkçe Bilgiler
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Pozisyon
            </label>
            <Input name="role_tr" defaultValue={trTranslation?.role} required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Çalışma Şekli
            </label>
            <Input
              name="locationType_tr"
              defaultValue={trTranslation?.locationType}
              required
              placeholder="Hibrit, Uzaktan"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Açıklama (Markdown)
            </label>
            <textarea
              name="description_tr"
              defaultValue={trTranslation?.description}
              required
              className="w-full p-3 bg-background rounded-md border border-input min-h-[200px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm resize-y"
            />
          </div>
        </div>

        {/* English */}
        <div className="space-y-4 p-6 bg-muted/30 rounded-xl border border-border/50">
          <h3 className="font-bold border-b border-border pb-2 text-primary flex items-center gap-2">
            <span className="text-lg">🇺🇸</span> English Info
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Role
            </label>
            <Input name="role_en" defaultValue={enTranslation?.role} required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Location Type
            </label>
            <Input
              name="locationType_en"
              defaultValue={enTranslation?.locationType}
              required
              placeholder="Hybrid, Remote"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Description (Markdown)
            </label>
            <textarea
              name="description_en"
              defaultValue={enTranslation?.description}
              required
              className="w-full p-3 bg-background rounded-md border border-input min-h-[200px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm resize-y"
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
          className="px-12 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          {loading && <Loader2 className="animate-spin w-4 h-4" />} Deneyimi
          Kaydet
        </button>
      </div>
    </form>
  );
}
