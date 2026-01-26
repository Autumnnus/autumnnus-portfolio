"use client";

import {
  createExperienceAction,
  updateExperienceAction,
  uploadImageAction,
} from "@/app/admin/actions";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface ExperienceTranslation {
  language: "tr" | "en";
  role: string;
  description: string;
  period: string;
  locationType: string;
}

export interface Experience {
  id?: string;
  company: string;
  logo: string;
  translations: ExperienceTranslation[];
}

interface ExperienceFormProps {
  initialData?: Experience;
}

interface ImageData {
  url: string;
  file?: File;
}

export default function ExperienceForm({ initialData }: ExperienceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalLogo = logo?.url || "";
      if (logo?.file) {
        finalLogo = await uploadSingleFile(logo.file, "experience");
      }

      const formData = new FormData(e.currentTarget);
      const data = {
        company: formData.get("company") as string,
        logo: finalLogo,
        translations: [
          {
            language: "tr" as const,
            role: formData.get("role_tr") as string,
            description: formData.get("description_tr") as string,
            period: formData.get("period_tr") as string,
            locationType: formData.get("locationType_tr") as string,
          },
          {
            language: "en" as const,
            role: formData.get("role_en") as string,
            description: formData.get("description_en") as string,
            period: formData.get("period_en") as string,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Şirket Logosu</label>
            <div className="relative w-24 h-24 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:bg-muted/50 transition-colors">
              {logo ? (
                <>
                  <Image
                    src={logo.url}
                    alt="Logo"
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setLogo(null)}
                    className="absolute top-0 right-0 p-1 bg-red-500 rounded-full text-white shadow-lg transition-transform hover:scale-110"
                  >
                    <X size={10} />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-1 w-full h-full justify-center">
                  <ImagePlus size={20} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Logo Yükle
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
            <label className="text-sm font-medium">Şirket Adı</label>
            <input
              name="company"
              defaultValue={initialData?.company}
              required
              className="w-full p-2 bg-muted rounded border border-border"
              placeholder="Qpien"
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Türkçe */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-bold border-b border-border pb-2 text-primary">
            Türkçe Bilgiler
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Pozisyon
            </label>
            <input
              name="role_tr"
              defaultValue={trTranslation?.role}
              required
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Dönem
            </label>
            <input
              name="period_tr"
              defaultValue={trTranslation?.period}
              required
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-none"
              placeholder="Şub 2024 - Günümüz"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Çalışma Şekli
            </label>
            <input
              name="locationType_tr"
              defaultValue={trTranslation?.locationType}
              required
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-none"
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
              className="w-full p-2 bg-muted rounded border border-border h-48 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* English */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-bold border-b border-border pb-2 text-primary">
            English Info
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Role
            </label>
            <input
              name="role_en"
              defaultValue={enTranslation?.role}
              required
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Period
            </label>
            <input
              name="period_en"
              defaultValue={enTranslation?.period}
              required
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-none"
              placeholder="Feb 2024 - Present"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Location Type
            </label>
            <input
              name="locationType_en"
              defaultValue={enTranslation?.locationType}
              required
              className="w-full p-2 bg-muted rounded border border-border focus:border-primary outline-none"
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
              className="w-full p-2 bg-muted rounded border border-border h-48 focus:border-primary outline-none"
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
