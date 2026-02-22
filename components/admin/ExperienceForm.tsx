"use client";

import {
  createExperienceAction,
  updateExperienceAction,
  uploadImageAction,
} from "@/app/[locale]/admin/actions";
import { generateTranslationAction } from "@/app/[locale]/admin/ai-actions";
import LanguageTabs from "@/components/admin/LanguageTabs";
import MultiLanguageSelector from "@/components/admin/MultiLanguageSelector";
import { Input } from "@/components/ui/Input";
import { useAdminForm } from "@/hooks/useAdminForm";
import { languageNames } from "@/i18n/routing";
import { ExperienceFormValues, ExperienceSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Language,
  WorkExperience,
  WorkExperienceTranslation,
} from "@prisma/client";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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

export type Experience = WorkExperience & {
  translations: WorkExperienceTranslation[];
};

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
  const t = useTranslations("Admin.Form");
  const router = useRouter();

  const [sourceLang, setSourceLang] = useState<string>("tr");
  const [targetLangs, setTargetLangs] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const [logo, setLogo] = useState<ImageData | null>(
    initialData?.logo ? { url: initialData.logo } : null,
  );

  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(ExperienceSchema) as any,
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

      if (
        !sourceContent ||
        !sourceContent.role ||
        !sourceContent.description ||
        !sourceContent.locationType
      ) {
        toast.error(t("fillRequired"));
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

  const onSubmitAction = async (data: ExperienceFormValues) => {
    let finalLogo = data.logo || "";
    if (logo?.file) {
      finalLogo = await uploadSingleFile(logo.file, "experience");
    }

    const translationsArray = Object.entries(data.translations)
      .filter(([, t]) => t && t.role && t.role.trim() !== "")
      .map(([lang, t]) => ({
        language: lang as Language,
        role: t!.role!,
        description: t!.description || "",
        locationType: t!.locationType || "",
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
    return true;
  };

  const { loading, handleSubmit: handleFormSubmit } = useAdminForm({
    form,
    onSubmitAction,
    successMessage: initialData?.id ? t("saveSuccess") : t("createSuccess"),
    onSuccess: () => {
      router.push("/admin/experience");
      router.refresh();
    },
    onInvalid: (errors) => {
      console.log("EXPERIENCE FORM ERRORS:", JSON.stringify(errors, null, 2));
      const errMsgs: string[] = [];
      if (errors.company) errMsgs.push("Şirket adı zorunludur.");

      if (errors.translations) {
        const transError = errors.translations as any;
        // Search for root or specific language errors
        if (transError.message) {
          errMsgs.push(transError.message);
        } else {
          const langsWithErrors = Object.keys(errors.translations).filter(
            (k) => k !== "message" && k !== "root" && k !== "ref",
          );
          if (langsWithErrors.length > 0) {
            errMsgs.push(
              `Eksik diller: ${langsWithErrors.map((l) => l.toUpperCase()).join(", ")} sekmesindeki zorunlu alanları kontrol edin.`,
            );
          }
        }
      }

      if (errMsgs.length > 0) {
        toast.error("Formda Hatalar Var", {
          description: "Lütfen yukarıdaki kırmızı hata listesini kontrol edin.",
        });
      }
    },
  });

  const translationRootMessage =
    errors.translations &&
    "message" in errors.translations &&
    typeof errors.translations.message === "string"
      ? errors.translations.message
      : null;

  return (
    <form
      onSubmit={handleFormSubmit}
      className="space-y-8 max-w-4xl mx-auto pb-20"
    >
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm animate-in fade-in slide-in-from-top-2">
          <p className="font-bold mb-2">Form Doğrulama Hataları:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.company && <li>Şirket: {errors.company.message}</li>}
            {errors.translations && (
              <>
                {translationRootMessage && (
                  <li>Deneyim Detayları: {translationRootMessage}</li>
                )}
                {Object.entries(errors.translations).map(
                  ([lang, langErrors]) => {
                    if (lang === "message" || lang === "root" || lang === "ref")
                      return null;
                    const langName =
                      languageNames[lang as keyof typeof languageNames] ||
                      lang.toUpperCase();
                    const subErrors =
                      langErrors && typeof langErrors === "object"
                        ? Object.keys(langErrors as Record<string, unknown>)
                            .length
                        : 0;
                    if (subErrors > 0) {
                      return (
                        <li key={lang}>
                          <strong>{langName} Sekmesi:</strong> {subErrors} adet
                          eksik alan var.
                        </li>
                      );
                    }
                    return null;
                  },
                )}
              </>
            )}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("companyLogo")}</label>
          <div className="relative w-full aspect-square md:w-full bg-muted rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:bg-muted/50 transition-colors group">
            {logo ? (
              <>
                <Image
                  src={logo.url}
                  alt={t("logoAlt")}
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
                <span className="text-sm font-medium">{t("companyLogo")}</span>
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
            <label className="text-sm font-medium">{t("companyName")}</label>
            <Input
              {...register("company")}
              required
              placeholder={t("companyNamePlaceholder")}
            />
            {errors.company && (
              <p className="text-xs text-red-500">{errors.company.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("startDate")}</label>
              <Input type="date" {...register("startDate")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("endDate")}</label>
              <div className="relative">
                <Input type="date" {...register("endDate")} />
                <span className="text-[10px] text-muted-foreground absolute -bottom-5 left-0">
                  {t("endDateDesc")}
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
          <p className="text-xs text-muted-foreground hidden md:block">
            {t("autoTranslate")}
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
          {t("translate")}
        </button>
      </div>

      <LanguageTabs sourceLang={sourceLang} targetLangs={targetLangs}>
        {(lang) => (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                {t("position")}
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
                {t("workType")}
              </label>
              <Input
                {...register(`translations.${lang}.locationType` as const)}
                required={lang === sourceLang}
                placeholder={t("workTypePlaceholder")}
              />
              {errors.translations?.[lang]?.locationType && (
                <p className="text-xs text-red-500">
                  {errors.translations[lang]?.locationType?.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                {t("experienceDesc")}
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
          className="px-12 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          {loading && <Loader2 className="animate-spin w-4 h-4" />} {t("save")}
        </button>
      </div>
    </form>
  );
}
