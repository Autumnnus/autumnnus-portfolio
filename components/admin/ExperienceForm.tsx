"use client";

import {
  createExperienceAction,
  updateExperienceAction,
  uploadImageAction,
} from "@/app/admin/actions";
import { generateTranslationAction } from "@/app/admin/ai-actions";
import MultiLanguageSelector from "@/components/admin/MultiLanguageSelector";
import { Input } from "@/components/ui/Input";
import { languageNames } from "@/i18n/routing";
import { ExperienceFormValues, ExperienceSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Language,
  WorkExperience,
  WorkExperienceTranslation,
} from "@prisma/client";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

// Helper to update translations
const transformTranslationsToObject = (
  translations: WorkExperienceTranslation[],
) => {
  const result: Record<
    string,
    { role: string; description: string; locationType: string }
  > = {};
  translations.forEach((t) => {
    result[t.language] = {
      role: t.role,
      description: t.description,
      locationType: t.locationType,
    };
  });
  return result;
};

interface ExperienceFormProps {
  initialData?: WorkExperience & { translations: WorkExperienceTranslation[] };
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

  const [sourceLang, setSourceLang] = useState<string>("tr");
  const [targetLangs, setTargetLangs] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const [logo, setLogo] = useState<ImageData | null>(
    initialData?.logo ? { url: initialData.logo } : null,
  );

  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(ExperienceSchema),
    defaultValues: {
      company: initialData?.company || "",
      logo: initialData?.logo || "",
      startDate: formatDateForInput(initialData?.startDate),
      endDate: formatDateForInput(initialData?.endDate),
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
    setLogo({ url: previewUrl, file });
    setValue("logo", previewUrl, { shouldDirty: true });
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
        !sourceContent.role ||
        !sourceContent.description ||
        !sourceContent.locationType
      ) {
        alert("Lütfen kaynak dildeki alanları doldurunuz.");
        setIsTranslating(false);
        return;
      }

      const translations = (await generateTranslationAction({
        type: "experience",
        sourceLang,
        targetLangs,
        content: {
          role: sourceContent.role,
          description: sourceContent.description,
          locationType: sourceContent.locationType,
        },
      })) as Record<
        string,
        { role: string; description: string; locationType: string }
      >;

      // Update target inputs
      Object.entries(translations).forEach(([lang, content]) => {
        if (!content) return;
        setValue(`translations.${lang}.role` as const, content.role);
        setValue(
          `translations.${lang}.description` as const,
          content.description,
        );
        setValue(
          `translations.${lang}.locationType` as const,
          content.locationType,
        );
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

  const onSubmit: SubmitHandler<ExperienceFormValues> = async (data) => {
    setLoading(true);

    try {
      let finalLogo = data.logo || "";
      if (logo?.file) {
        finalLogo = await uploadSingleFile(logo.file, "experience");
      }

      const translationsArray = Object.entries(data.translations)
        .filter(([, t]) => t.role && t.role.trim() !== "")
        .map(([lang, t]) => ({
          language: lang as Language,
          role: t.role,
          description: t.description,
          locationType: t.locationType,
        }));

      const submitData = {
        company: data.company,
        logo: finalLogo,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        translations: translationsArray,
      };

      if (initialData?.id) {
        await updateExperienceAction(initialData.id, submitData);
      } else {
        await createExperienceAction(submitData);
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 max-w-4xl mx-auto pb-20"
    >
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
                  onClick={() => {
                    setLogo(null);
                    setValue("logo", "");
                  }}
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
              {...register("company")}
              required
              placeholder="Örn: Google, Amazon"
            />
            {errors.company && (
              <p className="text-xs text-red-500">{errors.company.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Başlangıç Tarihi</label>
              <Input type="date" {...register("startDate")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bitiş Tarihi</label>
              <div className="relative">
                <Input type="date" {...register("endDate")} />
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
          <p className="text-xs text-muted-foreground hidden md:block">
            Kaynak dildeki içeriği doldurduktan sonra, diğer dile otomatik
            çeviri yapabilirsiniz.
          </p>
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
          AI ile Çevir ({sourceLang === "tr" ? "EN" : "TR"})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.keys(languageNames).map((lang) => {
          return (
            <div
              key={lang}
              className={`space-y-4 p-6 bg-muted/30 rounded-xl border transition-all ${
                sourceLang === lang
                  ? "bg-primary/5 border-primary/30 ring-2 ring-primary/20"
                  : "border-border/50"
              }`}
            >
              <h3 className="font-bold border-b border-border pb-2 text-primary flex items-center gap-2">
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
                  Pozisyon
                </label>
                <Input
                  {...register(`translations.${lang}.role` as const)}
                  required={lang === sourceLang}
                />
                {errors.translations?.[lang]?.role && (
                  <p className="text-xs text-red-500">
                    {errors.translations[lang]?.role?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Çalışma Şekli
                </label>
                <Input
                  {...register(`translations.${lang}.locationType` as const)}
                  required={lang === sourceLang}
                  placeholder="Hibrit, Uzaktan / Hybrid, Remote"
                />
                {errors.translations?.[lang]?.locationType && (
                  <p className="text-xs text-red-500">
                    {errors.translations[lang]?.locationType?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Açıklama (Markdown)
                </label>
                <textarea
                  {...register(`translations.${lang}.description` as const)}
                  required={lang === sourceLang}
                  className="w-full p-3 bg-background rounded-md border border-input min-h-[200px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm resize-y"
                />
                {errors.translations?.[lang]?.description && (
                  <p className="text-xs text-red-500">
                    {errors.translations[lang]?.description?.message}
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
          className="px-12 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          {loading && <Loader2 className="animate-spin w-4 h-4" />} Deneyimi
          Kaydet
        </button>
      </div>
    </form>
  );
}
