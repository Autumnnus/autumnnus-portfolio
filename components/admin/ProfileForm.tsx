"use client";

import { updateProfileAction, uploadImageAction } from "@/app/admin/actions";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface ProfileTranslation {
  language: "tr" | "en";
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
    setAvatar({ url: previewUrl, file });
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
      let finalAvatar = avatar?.url || "";
      if (avatar?.file) {
        finalAvatar = await uploadSingleFile(avatar.file, "profile");
      }

      const formData = new FormData(e.currentTarget);
      const data = {
        avatar: finalAvatar,
        email: formData.get("email") as string,
        github: formData.get("github") as string,
        linkedin: formData.get("linkedin") as string,
        translations: [
          {
            language: "tr" as const,
            name: formData.get("name_tr") as string,
            title: formData.get("title_tr") as string,
            greetingText: formData.get("greetingText_tr") as string,
            description: formData.get("description_tr") as string,
            aboutTitle: formData.get("aboutTitle_tr") as string,
            aboutDescription: formData.get("aboutDescription_tr") as string,
          },
          {
            language: "en" as const,
            name: formData.get("name_en") as string,
            title: formData.get("title_en") as string,
            greetingText: formData.get("greetingText_en") as string,
            description: formData.get("description_en") as string,
            aboutTitle: formData.get("aboutTitle_en") as string,
            aboutDescription: formData.get("aboutDescription_en") as string,
          },
        ],
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Türkçe */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-bold border-b border-border pb-2">
            Türkçe Bilgiler
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              İsim
            </label>
            <input
              name="name_tr"
              defaultValue={trTranslation?.name}
              required
              className="w-full p-2 bg-muted rounded border border-border"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Unvan
            </label>
            <input
              name="title_tr"
              defaultValue={trTranslation?.title}
              required
              className="w-full p-2 bg-muted rounded border border-border"
              placeholder="Full Stack Developer"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Karşılama Metni
            </label>
            <input
              name="greetingText_tr"
              defaultValue={trTranslation?.greetingText}
              required
              className="w-full p-2 bg-muted rounded border border-border"
              placeholder="Merhaba, ben"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Hero Açıklama
            </label>
            <textarea
              name="description_tr"
              defaultValue={trTranslation?.description}
              required
              className="w-full p-2 bg-muted rounded border border-border h-24"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Hakkımda Başlık
            </label>
            <input
              name="aboutTitle_tr"
              defaultValue={trTranslation?.aboutTitle}
              required
              className="w-full p-2 bg-muted rounded border border-border"
              placeholder="Hakkımda"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Hakkımda Detay
            </label>
            <textarea
              name="aboutDescription_tr"
              defaultValue={trTranslation?.aboutDescription}
              required
              className="w-full p-2 bg-muted rounded border border-border h-48"
            />
          </div>
        </div>

        {/* English */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-bold border-b border-border pb-2">
            English Info
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Name
            </label>
            <input
              name="name_en"
              defaultValue={enTranslation?.name}
              required
              className="w-full p-2 bg-muted rounded border border-border"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Title
            </label>
            <input
              name="title_en"
              defaultValue={enTranslation?.title}
              required
              className="w-full p-2 bg-muted rounded border border-border"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Greeting Text
            </label>
            <input
              name="greetingText_en"
              defaultValue={enTranslation?.greetingText}
              required
              className="w-full p-2 bg-muted rounded border border-border"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Hero Description
            </label>
            <textarea
              name="description_en"
              defaultValue={enTranslation?.description}
              required
              className="w-full p-2 bg-muted rounded border border-border h-24"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              About Title
            </label>
            <input
              name="aboutTitle_en"
              defaultValue={enTranslation?.aboutTitle}
              required
              className="w-full p-2 bg-muted rounded border border-border"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              About Description
            </label>
            <textarea
              name="aboutDescription_en"
              defaultValue={enTranslation?.aboutDescription}
              required
              className="w-full p-2 bg-muted rounded border border-border h-48"
            />
          </div>
        </div>
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
