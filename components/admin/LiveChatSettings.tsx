"use client";

import {
  deleteLiveChatGreetingAction,
  getLiveChatConfigAction,
  LiveChatGreetingInput,
  resetLiveChatSoundAction,
  updateLiveChatConfigAction,
  uploadLiveChatSoundAction,
  upsertLiveChatGreetingAction,
} from "@/app/[locale]/admin/livechat/livechat-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { languageNames } from "@/i18n/routing";
import { handleAction } from "@/lib/api-client";
import { Language } from "@prisma/client";
import {
  Globe,
  Layout,
  MessageSquare,
  Music,
  Plus,
  Power,
  Save,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import LanguageTabs from "./LanguageTabs";

export default function LiveChatSettings() {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [newExcludedPath, setNewExcludedPath] = useState("");
  const [isUploadingSound, setIsUploadingSound] = useState<string | null>(null);

  // Greeting Form State
  const [isAddingGreeting, setIsAddingGreeting] = useState(false);
  const [greetingForm, setGreetingForm] = useState<LiveChatGreetingInput>({
    pathname: "",
    translations: Object.keys(languageNames).map((lang) => ({
      language: lang as Language,
      text: "",
    })),
  });

  const fetchConfig = async () => {
    setIsLoading(true);
    const data = await handleAction(() => getLiveChatConfigAction());
    if (data) setConfig(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleToggleEnabled = async () => {
    if (!config) return;
    setIsSaving(true);
    const success = await handleAction(
      async () => {
        await updateLiveChatConfigAction({
          isEnabled: !config.isEnabled,
          allowedPaths: config.allowedPaths,
          excludedPaths: config.excludedPaths,
        });
        return true;
      },
      config.isEnabled ? "Live Chat kapatıldı" : "Live Chat açıldı",
    );

    if (success) {
      setConfig({ ...config, isEnabled: !config.isEnabled });
    }
    setIsSaving(false);
  };

  const handleAddPath = async () => {
    if (!newPath.trim() || !config) return;

    if (!newPath.startsWith("/")) {
      toast.error("Yol '/' ile başlamalıdır");
      return;
    }

    if (config.allowedPaths.includes(newPath)) {
      toast.error("Bu yol zaten ekli");
      return;
    }

    if (config.excludedPaths.includes(newPath)) {
      toast.error("Bu yol engellenen sayfalar listesinde mevcut");
      return;
    }

    const updatedPaths = [...config.allowedPaths, newPath];
    const success = await handleAction(async () => {
      await updateLiveChatConfigAction({
        isEnabled: config.isEnabled,
        allowedPaths: updatedPaths,
        excludedPaths: config.excludedPaths,
      });
      return true;
    }, "Yol eklendi");

    if (success) {
      setConfig({ ...config, allowedPaths: updatedPaths });
      setNewPath("");
    }
    setIsSaving(false);
  };

  const handleRemovePath = async (path: string) => {
    if (!config) return;
    const updatedPaths = config.allowedPaths.filter((p: string) => p !== path);
    setIsSaving(true);
    const success = await handleAction(async () => {
      await updateLiveChatConfigAction({
        isEnabled: config.isEnabled,
        allowedPaths: updatedPaths,
        excludedPaths: config.excludedPaths,
      });
      return true;
    }, "Yol kaldırıldı");

    if (success) {
      setConfig({ ...config, allowedPaths: updatedPaths });
    }
    setIsSaving(false);
  };

  const handleAddExcludedPath = async () => {
    if (!newExcludedPath.trim() || !config) return;

    if (!newExcludedPath.startsWith("/")) {
      toast.error("Yol '/' ile başlamalıdır");
      return;
    }

    if (config.excludedPaths.includes(newExcludedPath)) {
      toast.error("Bu yol zaten engellenenlerde ekli");
      return;
    }

    if (config.allowedPaths.includes(newExcludedPath)) {
      toast.error("Bu yol görünür sayfalar listesinde mevcut");
      return;
    }

    const updatedPaths = [...config.excludedPaths, newExcludedPath];
    const success = await handleAction(async () => {
      await updateLiveChatConfigAction({
        isEnabled: config.isEnabled,
        allowedPaths: config.allowedPaths,
        excludedPaths: updatedPaths,
      });
      return true;
    }, "Yol engellenenlere eklendi");

    if (success) {
      setConfig({ ...config, excludedPaths: updatedPaths });
      setNewExcludedPath("");
    }
    setIsSaving(false);
  };

  const handleRemoveExcludedPath = async (path: string) => {
    if (!config) return;
    const updatedPaths = config.excludedPaths.filter((p: string) => p !== path);
    setIsSaving(true);
    const success = await handleAction(async () => {
      await updateLiveChatConfigAction({
        isEnabled: config.isEnabled,
        allowedPaths: config.allowedPaths,
        excludedPaths: updatedPaths,
      });
      return true;
    }, "Engel kaldırıldı");

    if (success) {
      setConfig({ ...config, excludedPaths: updatedPaths });
    }
    setIsSaving(false);
  };

  const handleSaveGreeting = async () => {
    if (!greetingForm.pathname.trim()) {
      toast.error("Lütfen bir yol (pathname) girin");
      return;
    }

    if (!greetingForm.pathname.startsWith("/")) {
      toast.error("Yol '/' ile başlamalıdır");
      return;
    }

    setIsSaving(true);
    try {
      await upsertLiveChatGreetingAction(greetingForm);
      await fetchConfig();
      setIsAddingGreeting(false);
      setGreetingForm({
        pathname: "",
        translations: Object.keys(languageNames).map((lang) => ({
          language: lang as Language,
          text: "",
        })),
      });
      toast.success("Karşılama mesajı kaydedildi");
    } catch {
      toast.error("Kaydedilirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditGreeting = (greeting: any) => {
    setGreetingForm({
      pathname: greeting.pathname,
      translations: Object.keys(languageNames).map((lang) => {
        const trans = greeting.translations.find(
          (t: any) => t.language === lang,
        );
        return {
          language: lang as Language,
          text: trans ? trans.text : "",
        };
      }),
    });
    setIsAddingGreeting(true);
  };

  const handleDeleteGreeting = async (id: string) => {
    if (!confirm("Bu karşılama mesajını silmek istediğinize emin misiniz?"))
      return;
    setIsSaving(true);
    const success = await handleAction(async () => {
      await deleteLiveChatGreetingAction(id);
      return true;
    }, "Karşılama mesajı silindi");

    if (success) {
      await fetchConfig();
    }
    setIsSaving(false);
  };

  const handleUploadSound = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "ping" | "notification",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Lütfen bir ses dosyası seçin");
      return;
    }

    setIsUploadingSound(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      await uploadLiveChatSoundAction(formData);
      await fetchConfig();
      toast.success("Ses yüklendi");
    } catch (err) {
      toast.error("Ses yüklenirken hata oluştu");
    } finally {
      setIsUploadingSound(null);
    }
  };

  const handleResetSound = async (type: "ping" | "notification") => {
    setIsUploadingSound(type);
    try {
      await resetLiveChatSoundAction(type);
      await fetchConfig();
      toast.success("Ses varsayılana sıfırlandı");
    } catch (err) {
      toast.error("Sıfırlanırken hata oluştu");
    } finally {
      setIsUploadingSound(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Global Settings */}
      <Card className="border-primary/20 bg-primary/5 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Power
                  className={`w-5 h-5 ${config.isEnabled ? "text-green-500" : "text-red-500"}`}
                />
                Live Chat Durumu
              </CardTitle>
              <CardDescription>
                Live Chat&apos;i tüm site genelinde açıp kapatabilir veya
                belirli sayfalarda görünmesini sağlayabilirsiniz.
              </CardDescription>
            </div>
            <Button
              variant={config.isEnabled ? "destructive" : "default"}
              onClick={handleToggleEnabled}
              disabled={isSaving}
              className="px-8"
            >
              {config.isEnabled ? "Kapat" : "Aç"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Path Configuration */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layout className="w-5 h-5 text-primary" />
              Görüneceği Sayfalar
            </CardTitle>
            <CardDescription>
              Hangi sayfalarda widget'ın görüneceğini belirleyin.{" "}
              <strong>DİL ÖN EKİ OLMADAN</strong> giriniz (örn: /blog). Boş
              bırakılırsa tüm sayfalarda görünür.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-muted rounded border border-border pointer-events-none group-focus-within:border-primary/50 transition-colors z-10">
                  <Globe className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    /[dil]
                  </span>
                </div>
                <Input
                  placeholder="/blog"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPath()}
                  className="pl-28"
                />
              </div>
              {newPath && (
                <div className="flex flex-wrap gap-2 items-center text-[10px] bg-primary/5 p-2 rounded-lg border border-primary/10 animate-in fade-in slide-in-from-top-1">
                  <span className="font-bold text-primary uppercase">
                    Eşleşecek Sayfalar:
                  </span>
                  <div className="flex gap-2">
                    {["tr", "en"].map((lang) => (
                      <code
                        key={lang}
                        className="bg-background px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground"
                      >
                        /{lang}
                        {newPath === "/" ? "" : newPath}
                      </code>
                    ))}
                    <span className="text-muted-foreground">...</span>
                  </div>
                </div>
              )}
              <Button
                className="w-full h-9"
                onClick={handleAddPath}
                disabled={isSaving || !newPath.trim()}
              >
                <Plus className="w-4 h-4 mr-2" /> Sayfa Ekle
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {!config.allowedPaths || config.allowedPaths.length === 0 ? (
                <Badge
                  variant="outline"
                  className="text-muted-foreground px-3 py-1"
                >
                  Tüm Sayfalar
                </Badge>
              ) : (
                config.allowedPaths.map((path: string) => (
                  <Badge
                    key={path}
                    className="flex items-center gap-1 pl-3 pr-1 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  >
                    {path}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent text-primary/50 hover:text-primary"
                      onClick={() => handleRemovePath(path)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Excluded Path Configuration */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <X className="w-5 h-5 text-destructive" />
              Görünmeyecek Sayfalar
            </CardTitle>
            <CardDescription>
              Widget&apos;ın <strong>KESİNLİKLE</strong> görünmeyeceği sayfalar.
              Bu ayar görünür sayfalardan daha önceliklidir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-muted rounded border border-border pointer-events-none group-focus-within:border-primary/50 transition-colors z-10">
                  <Globe className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    /[dil]
                  </span>
                </div>
                <Input
                  placeholder="/admin"
                  value={newExcludedPath}
                  onChange={(e) => setNewExcludedPath(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddExcludedPath()
                  }
                  className="pl-28"
                />
              </div>
              <Button
                variant="outline"
                className="w-full h-9 border-destructive/20 text-destructive hover:bg-destructive/5"
                onClick={handleAddExcludedPath}
                disabled={isSaving || !newExcludedPath.trim()}
              >
                <Plus className="w-4 h-4 mr-2" /> Sayfayı Engelle
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {!config.excludedPaths || config.excludedPaths.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Herhangi bir engel yok.
                </p>
              ) : (
                config.excludedPaths.map((path: string) => (
                  <Badge
                    key={path}
                    variant="destructive"
                    className="flex items-center gap-1 pl-3 pr-1 py-1 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                  >
                    {path}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent text-destructive/50 hover:text-destructive"
                      onClick={() => handleRemoveExcludedPath(path)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Greetings Overview */}
        <Card className="border-border/50 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Karşılama Mesajları
              </CardTitle>
              <CardDescription>
                Sayfaya özel ilk AI baloncuğu mesajları.{" "}
                <strong>DİL ÖN EKİ OLMADAN</strong> giriniz (örn: /blog veya ana
                sayfa için /).
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddingGreeting(true)}
              disabled={isAddingGreeting}
            >
              <Plus className="w-4 h-4 mr-2" /> Yeni
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!config.greetings || config.greetings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 italic">
                  Henüz özel karşılama mesajı yok.
                </p>
              ) : (
                config.greetings.map((g: any) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-primary">
                        {g.pathname}
                      </code>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {g.translations.find((t: any) => t.language === "tr")
                          ?.text || "..."}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditGreeting(g)}
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteGreeting(g.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sound Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Ses Ayarları
          </CardTitle>
          <CardDescription>
            Bildirim ve mesaj seslerini buradan özelleştirebilirsiniz. Boş
            bırakılırsa varsayılan sesler kullanılır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ping Sound */}
            <div className="space-y-3 p-4 border border-border/50 rounded-xl bg-muted/10">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary" />
                  Ping (Gelen Mesaj)
                </Label>
                {config.pingSoundUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => handleResetSound("ping")}
                    disabled={isUploadingSound === "ping"}
                  >
                    Varsayılana Dön
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="audio/mp3,audio/wav"
                    onChange={(e) => handleUploadSound(e, "ping")}
                    disabled={isUploadingSound === "ping"}
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>
                {config.pingSoundUrl && (
                  <audio
                    controls
                    src={config.pingSoundUrl}
                    className="h-8 w-full mt-2"
                  />
                )}
                <p className="text-[10px] text-muted-foreground italic">
                  {!config.pingSoundUrl
                    ? "Varsayılan: /assets/sounds/ping.mp3"
                    : "Özel ses yüklendi (MinIO)"}
                </p>
              </div>
            </div>

            {/* Notification Sound */}
            <div className="space-y-3 p-4 border border-border/50 rounded-xl bg-muted/10">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary" />
                  Bildirim (Karşılama/Hata)
                </Label>
                {config.notificationSoundUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => handleResetSound("notification")}
                    disabled={isUploadingSound === "notification"}
                  >
                    Varsayılana Dön
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="audio/mp3,audio/wav"
                    onChange={(e) => handleUploadSound(e, "notification")}
                    disabled={isUploadingSound === "notification"}
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>
                {config.notificationSoundUrl && (
                  <audio
                    controls
                    src={config.notificationSoundUrl}
                    className="h-8 w-full mt-2"
                  />
                )}
                <p className="text-[10px] text-muted-foreground italic">
                  {!config.notificationSoundUrl
                    ? "Varsayılan: /assets/sounds/notification.mp3"
                    : "Özel ses yüklendi (MinIO)"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Greeting Editor */}
      {isAddingGreeting && (
        <Card className="border-primary/30 shadow-lg bg-background/50 backdrop-blur animate-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg">Karşılama Mesajı Düzenle</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Sayfa Yolu (Pathname)</Label>
                <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">
                  Dil ön eki otomatik eklenir
                </div>
                <div className="relative group">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-muted rounded border border-border pointer-events-none group-focus-within:border-primary/50 transition-colors z-10">
                    <Globe className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      /[dil]
                    </span>
                  </div>
                  <Input
                    placeholder="örn: / veya /blog"
                    value={greetingForm.pathname}
                    onChange={(e) =>
                      setGreetingForm({
                        ...greetingForm,
                        pathname: e.target.value,
                      })
                    }
                    className="pl-28"
                  />
                </div>
                {greetingForm.pathname && (
                  <div className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded flex flex-wrap gap-2 items-center">
                    <span className="font-semibold italic">
                      Tüm dillerde geçerli olur:
                    </span>
                    {["tr", "en"].map((lang) => (
                      <code key={lang} className="bg-background px-1">
                        /{lang}
                        {greetingForm.pathname === "/"
                          ? ""
                          : greetingForm.pathname}
                      </code>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Mesaj İçeriği (Dillere Göre)</Label>
              <LanguageTabs
                sourceLang="tr"
                targetLangs={Object.keys(languageNames).filter(
                  (l) => l !== "tr",
                )}
              >
                {(lang) => (
                  <div className="space-y-4" key={lang}>
                    <Input
                      placeholder={`${languageNames[lang]} karşılama mesajı...`}
                      value={
                        greetingForm.translations.find(
                          (t) => t.language === lang,
                        )?.text || ""
                      }
                      onChange={(e) => {
                        const newTrans = [...greetingForm.translations];
                        const idx = newTrans.findIndex(
                          (t) => t.language === lang,
                        );
                        if (idx > -1) {
                          newTrans[idx].text = e.target.value;
                        } else {
                          newTrans.push({
                            language: lang as Language,
                            text: e.target.value,
                          });
                        }
                        setGreetingForm({
                          ...greetingForm,
                          translations: newTrans,
                        });
                      }}
                    />
                  </div>
                )}
              </LanguageTabs>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => setIsAddingGreeting(false)}
              >
                İptal
              </Button>
              <Button onClick={handleSaveGreeting} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" /> Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
