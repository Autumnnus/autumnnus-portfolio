"use client";

import {
  ProfileTranslationInput,
  updateProfileAction,
  uploadImageAction,
} from "@/app/admin/actions";
import { generateTranslationAction } from "@/app/admin/ai-actions";
import LanguageTabs from "@/components/admin/LanguageTabs";
import MultiLanguageSelector from "@/components/admin/MultiLanguageSelector";
import { languageNames } from "@/i18n/routing";
import { ProfileFormValues, ProfileSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Language, Profile, ProfileTranslation } from "@prisma/client";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// Helper to transform array translations to object keyed by language
const transformTranslationsToObject = (translations: ProfileTranslation[]) => {
  const result: Record<string, Omit<ProfileTranslationInput, "language">> = {};

  translations.forEach((t) => {
    result[t.language] = {
      name: t.name,
      title: t.title,
      greetingText: t.greetingText,
      description: t.description,
      aboutTitle: t.aboutTitle,
      aboutDescription: t.aboutDescription,
    };
  });
  return result;
};

export interface ProfileFormProps {
  initialData?: Profile & { translations: ProfileTranslation[] };
}

interface ImageData {
  url: string;
  file?: File;
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const t = useTranslations("Admin.Form");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<ImageData | null>(
    initialData?.avatar ? { url: initialData.avatar } : null,
  );

  const [sourceLang, setSourceLang] = useState<string>("tr");
  const [targetLangs, setTargetLangs] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      email: initialData?.email || "",
      github: initialData?.github || "",
      linkedin: initialData?.linkedin || "",
      avatar: initialData?.avatar || "",
      translations: initialData?.translations
        ? transformTranslationsToObject(initialData.translations)
        : {},
    },
  });

  // Sync state with initialData when it changes (after router.refresh())
  useEffect(() => {
    if (initialData?.avatar) {
      setAvatar({ url: initialData.avatar });
      form.setValue("avatar", initialData.avatar);
    } else {
      setAvatar(null);
      form.setValue("avatar", "");
    }
  }, [initialData, form]);

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
    setAvatar({ url: previewUrl, file });
    setValue("avatar", previewUrl, { shouldDirty: true }); // We'll handle file upload separately on submit but set url for validation/tracking
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
      alert(t("translateError"));
      return;
    }

    setIsTranslating(true);
    try {
      const currentValues = getValues();
      const sourceContent = currentValues.translations?.[sourceLang];

      if (
        !sourceContent ||
        !sourceContent.name ||
        !sourceContent.title ||
        !sourceContent.greetingText ||
        !sourceContent.description ||
        !sourceContent.aboutTitle ||
        !sourceContent.aboutDescription
      ) {
        alert(t("fillRequired"));
        setIsTranslating(false);
        return;
      }

      const translations = await generateTranslationAction({
        type: "profile",
        sourceLang,
        targetLangs,
        content: {
          name: sourceContent.name,
          title: sourceContent.title,
          greetingText: sourceContent.greetingText,
          description: sourceContent.description,
          aboutTitle: sourceContent.aboutTitle,
          aboutDescription: sourceContent.aboutDescription,
        },
      });

      // Update target inputs
      Object.entries(translations).forEach(([lang, content]) => {
        const c = content as Omit<ProfileTranslationInput, "language">;
        if (!c) return;

        setValue(`translations.${lang}.name`, c.name);
        setValue(`translations.${lang}.title`, c.title);
        setValue(`translations.${lang}.greetingText`, c.greetingText);
        setValue(`translations.${lang}.description`, c.description);
        setValue(`translations.${lang}.aboutTitle`, c.aboutTitle);
        setValue(`translations.${lang}.aboutDescription`, c.aboutDescription);
      });

      alert(t("translateSuccess"));
    } catch (error) {
      alert(
        "Çeviri başarısız oldu: " +
          (error instanceof Error ? error.message : "Bilinmeyen hata"),
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setLoading(true);

    try {
      let finalAvatar = data.avatar || "";
      // If a new file was selected (avatar state has file), upload it
      if (avatar?.file) {
        finalAvatar = await uploadSingleFile(avatar.file, "profile");
      }

      const translationsArray = Object.entries(data.translations)
        .filter(([, t]) => t.name && t.name.trim() !== "")
        .map(([lang, t]) => ({
          language: lang as Language,
          name: t.name,
          title: t.title,
          greetingText: t.greetingText,
          description: t.description,
          aboutTitle: t.aboutTitle,
          aboutDescription: t.aboutDescription,
        }));

      const submitData = {
        avatar: finalAvatar,
        email: data.email,
        github: data.github || "",
        linkedin: data.linkedin || "",
        translations: translationsArray,
      };

      await updateProfileAction(submitData);
      alert(t("translateSuccess")); // Reusing translateSuccess or should add updateSuccess
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex flex-col items-center sm:items-start gap-6 mb-8 group">
            <div className="relative">
              <input type="hidden" {...register("avatar")} />
              <div className="relative w-40 h-40 rounded-full overflow-hidden ring-4 ring-background shadow-2xl transition-all duration-300 group-hover:ring-primary/20 bg-muted">
                {avatar ? (
                  <>
                    <Image
                      src={avatar.url}
                      alt="Avatar"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
                      <label className="cursor-pointer p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors">
                        <ImagePlus size={20} className="text-white" />
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
                          setAvatar(null);
                          setValue("avatar", "", { shouldDirty: true });
                        }}
                        className="p-2 bg-red-500/40 backdrop-blur-md rounded-full hover:bg-red-500/60 transition-colors"
                      >
                        <X size={20} className="text-white" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-muted/80 transition-colors gap-2">
                    <div className="p-4 bg-primary/10 rounded-full text-primary">
                      <ImagePlus size={32} />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {t("avatar")}
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

              {/* Badge Effect */}
              {avatar && (
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
              )}
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-xl font-bold">{t("avatar")}</h3>
              <p className="text-sm text-muted-foreground">{t("avatarDesc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 bg-muted/20 p-6 rounded-2xl border border-border/50">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                {t("email")}
              </label>
              <input
                {...register("email")}
                className="w-full p-3 bg-background/50 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="hello@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                {t("github")}
              </label>
              <input
                {...register("github")}
                className="w-full p-3 bg-background/50 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="https://github.com/..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                {t("linkedin")}
              </label>
              <input
                {...register("linkedin")}
                className="w-full p-3 bg-background/50 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="https://linkedin.com/in/..."
              />
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
              <label className="text-xs font-bold uppercase text-muted-foreground">
                {t("name")}
              </label>
              <input
                {...register(`translations.${lang}.name` as const)}
                className="w-full p-2 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Adınız Soyadınız"
              />
              {errors.translations?.[lang]?.name && (
                <p className="text-xs text-red-500">
                  {errors.translations[lang]?.name?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                {t("unvan")}
              </label>
              <input
                {...register(`translations.${lang}.title` as const)}
                className="w-full p-2 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Örn: Full Stack Developer"
              />
              {errors.translations?.[lang]?.title && (
                <p className="text-xs text-red-500">
                  {errors.translations[lang]?.title?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                {t("greetingText")}
              </label>
              <input
                {...register(`translations.${lang}.greetingText` as const)}
                className="w-full p-2 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Örn: Merhaba, ben"
              />
              {errors.translations?.[lang]?.greetingText && (
                <p className="text-xs text-red-500">
                  {errors.translations[lang]?.greetingText?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                {t("heroDescription")}
              </label>
              <textarea
                {...register(`translations.${lang}.description` as const)}
                className="w-full p-2 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[100px]"
                placeholder="Kısa biyografi özeti"
              />
              {errors.translations?.[lang]?.description && (
                <p className="text-xs text-red-500">
                  {errors.translations[lang]?.description?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                {t("aboutTitle")}
              </label>
              <input
                {...register(`translations.${lang}.aboutTitle` as const)}
                className="w-full p-2 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Örn: Hakkımda"
              />
              {errors.translations?.[lang]?.aboutTitle && (
                <p className="text-xs text-red-500">
                  {errors.translations[lang]?.aboutTitle?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                {t("aboutDescription")}
              </label>
              <textarea
                {...register(`translations.${lang}.aboutDescription` as const)}
                className="w-full p-2 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[150px]"
                placeholder="Detaylı biyografiniz"
              />
              {errors.translations?.[lang]?.aboutDescription && (
                <p className="text-xs text-red-500">
                  {errors.translations[lang]?.aboutDescription?.message}
                </p>
              )}
            </div>
          </div>
        )}
      </LanguageTabs>

      <div className="sticky bottom-8 z-20 flex justify-end gap-4 border-t border-border/50 bg-background/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border">
        <button
          type="submit"
          disabled={loading}
          className="px-16 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-3 transition-all shadow-xl shadow-primary/20 group"
        >
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          )}
          {t("save")}
        </button>
      </div>
    </form>
  );
}
