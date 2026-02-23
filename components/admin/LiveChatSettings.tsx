"use client";

import {
  deleteLiveChatGreetingAction,
  getLiveChatConfigAction,
  GreetingTranslationInput,
  LiveChatConfigData,
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
  Music,
  Plus,
  Power,
  Save,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import LanguageTabs from "./LanguageTabs";

interface LiveChatGreetingWithId extends LiveChatGreetingInput {
  id: string;
}

interface LiveChatConfigDataExtended extends Omit<
  LiveChatConfigData,
  "greetings"
> {
  greetings: LiveChatGreetingWithId[];
}

export default function LiveChatSettings() {
  const t = useTranslations("Admin.LiveChat");
  const commonT = useTranslations("Admin.Common");
  const [config, setConfig] = useState<LiveChatConfigDataExtended | null>(null);
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
      quickAnswers: [],
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
      config.isEnabled ? t("close") : t("open"),
    );

    if (success) {
      setConfig({ ...config, isEnabled: !config.isEnabled });
    }
    setIsSaving(false);
  };

  const handleAddPath = async () => {
    if (!newPath.trim() || !config) return;

    if (!newPath.startsWith("/")) {
      toast.error(t("errorPathStart"));
      return;
    }

    if (config.allowedPaths.includes(newPath)) {
      toast.error(t("errorPathExists"));
      return;
    }

    if (config.excludedPaths.includes(newPath)) {
      toast.error(t("errorPathBlocked"));
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
    }, t("successPathAdded"));

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
    }, t("successPathRemoved"));

    if (success) {
      setConfig({ ...config, allowedPaths: updatedPaths });
    }
    setIsSaving(false);
  };

  const handleAddExcludedPath = async () => {
    if (!newExcludedPath.trim() || !config) return;

    if (!newExcludedPath.startsWith("/")) {
      toast.error(t("errorPathStart"));
      return;
    }

    if (config.excludedPaths.includes(newExcludedPath)) {
      toast.error(t("errorPathBlocked"));
      return;
    }

    if (config.allowedPaths.includes(newExcludedPath)) {
      toast.error(t("errorPathVisible"));
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
    }, t("successPathBlocked"));

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
    }, t("successBlockRemoved"));

    if (success) {
      setConfig({ ...config, excludedPaths: updatedPaths });
    }
    setIsSaving(false);
  };

  const handleSaveGreeting = async () => {
    if (!greetingForm.pathname.trim()) {
      toast.error(t("errorEnterPath"));
      return;
    }

    if (!greetingForm.pathname.startsWith("/")) {
      toast.error(t("errorPathStart"));
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
          quickAnswers: [],
        })),
      });
      toast.success(t("successGreetingSaved"));
    } catch {
      toast.error(t("errorGreetingSave"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditGreeting = (greeting: LiveChatGreetingWithId) => {
    setGreetingForm({
      pathname: greeting.pathname,
      translations: Object.keys(languageNames).map((lang) => {
        const trans = greeting.translations.find(
          (trans: GreetingTranslationInput) => trans.language === lang,
        );
        return {
          language: lang as Language,
          text: trans ? trans.text : "",
          quickAnswers: trans?.quickAnswers || [],
        };
      }),
    });
    setIsAddingGreeting(true);
  };

  const handleDeleteGreeting = async (id: string) => {
    if (!confirm(t("confirmDeleteGreeting"))) return;
    setIsSaving(true);
    const success = await handleAction(async () => {
      await deleteLiveChatGreetingAction(id);
      return true;
    }, t("successGreetingDeleted"));

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
      toast.error(t("errorSelectAudio"));
      return;
    }

    setIsUploadingSound(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      await uploadLiveChatSoundAction(formData);
      await fetchConfig();
      toast.success(t("successSoundUploaded"));
    } catch {
      toast.error(t("errorSoundUpload"));
    } finally {
      setIsUploadingSound(null);
    }
  };

  const handleResetSound = async (type: "ping" | "notification") => {
    setIsUploadingSound(type);
    try {
      await resetLiveChatSoundAction(type);
      await fetchConfig();
      toast.success(t("successSoundReset"));
    } catch {
      toast.error(t("errorSoundReset"));
    } finally {
      setIsUploadingSound(null);
    }
  };

  if (isLoading || !config) {
    return <div className="p-8 text-center">{commonT("loading")}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Global Settings */}
      <Card className="border-primary/20 bg-primary/5 shadow-none">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Power
                  className={`w-5 h-5 ${config.isEnabled ? "text-green-500" : "text-red-500"}`}
                />
                {t("status")}
              </CardTitle>
              <CardDescription>{t("statusDesc")}</CardDescription>
            </div>
            <Button
              variant={config.isEnabled ? "destructive" : "default"}
              onClick={handleToggleEnabled}
              disabled={isSaving}
              className="w-full sm:w-auto px-8"
            >
              {config.isEnabled ? commonT("close") : commonT("open")}
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
              {t("visiblePages")}
            </CardTitle>
            <CardDescription>
              {t("visiblePagesDesc")} <strong>{t("noPrefixNote")}</strong>{" "}
              {t("visiblePagesDesc_note")}
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
                    {t("matchingPages")}
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
                <Plus className="w-4 h-4 mr-2" /> {t("addPage")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {!config.allowedPaths || config.allowedPaths.length === 0 ? (
                <Badge
                  variant="outline"
                  className="text-muted-foreground px-3 py-1"
                >
                  {t("allPages")}
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
              {t("excludedPages")}
            </CardTitle>
            <CardDescription>
              {t("excludedPagesDesc")} <strong>{t("noPrefixNote")}</strong>{" "}
              {t("excludedPagesDesc_note")}
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
                <Plus className="w-4 h-4 mr-2" /> {t("blockPage")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {!config.excludedPaths || config.excludedPaths.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {commonT("noResults")}
                </p>
              ) : (
                config.excludedPaths.map((path: string) => (
                  <Badge
                    key={path}
                    variant="outline"
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
                {t("greetingMessages")}
              </CardTitle>
              <CardDescription>{t("greetingMessagesDesc")}</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddingGreeting(true)}
              disabled={isAddingGreeting}
            >
              <Plus className="w-4 h-4 mr-2" /> {commonT("new")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!config.greetings || config.greetings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 italic">
                  {t("noGreetings")}
                </p>
              ) : (
                config.greetings.map((g: LiveChatGreetingWithId) => (
                  <div
                    key={g.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-all gap-3 group"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                      <code className="text-[10px] sm:text-xs bg-muted px-2 py-1 rounded font-mono text-primary border border-primary/10">
                        {g.pathname}
                      </code>
                      <span className="text-xs text-muted-foreground truncate max-w-full sm:max-w-[150px] lg:max-w-[300px]">
                        {g.translations.find(
                          (trans: GreetingTranslationInput) =>
                            trans.language === "tr",
                        )?.text || "..."}
                      </span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 flex-1 sm:flex-none gap-2"
                        onClick={() => handleEditGreeting(g)}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="sm:hidden">{commonT("edit")}</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 flex-1 sm:flex-none text-destructive hover:text-destructive gap-2"
                        onClick={() => handleDeleteGreeting(g.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="sm:hidden">{commonT("delete")}</span>
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
            {t("soundSettings")}
          </CardTitle>
          <CardDescription>{t("soundSettingsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ping Sound */}
            <div className="space-y-4 p-4 border border-border/50 rounded-xl bg-muted/5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <Label className="flex items-center gap-2 font-bold">
                  <Volume2 className="w-4 h-4 text-primary" />
                  {t("pingSound")}
                </Label>
                {config.pingSoundUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] text-destructive hover:bg-destructive/10 px-2"
                    onClick={() => handleResetSound("ping")}
                    disabled={isUploadingSound === "ping"}
                  >
                    {t("resetToDefault")}
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="audio/mp3,audio/wav"
                  onChange={(e) => handleUploadSound(e, "ping")}
                  disabled={isUploadingSound === "ping"}
                  className="cursor-pointer file:cursor-pointer text-xs"
                />
                {config.pingSoundUrl && (
                  <audio
                    controls
                    src={config.pingSoundUrl}
                    className="h-8 w-full"
                  />
                )}
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-primary/40" />
                  {!config.pingSoundUrl ? t("defaultSound") : t("customSound")}
                </p>
              </div>
            </div>

            {/* Notification Sound */}
            <div className="space-y-4 p-4 border border-border/50 rounded-xl bg-muted/5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <Label className="flex items-center gap-2 font-bold">
                  <Volume2 className="w-4 h-4 text-primary" />
                  {t("notificationSound")}
                </Label>
                {config.notificationSoundUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] text-destructive hover:bg-destructive/10 px-2"
                    onClick={() => handleResetSound("notification")}
                    disabled={isUploadingSound === "notification"}
                  >
                    {t("resetToDefault")}
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="audio/mp3,audio/wav"
                  onChange={(e) => handleUploadSound(e, "notification")}
                  disabled={isUploadingSound === "notification"}
                  className="cursor-pointer file:cursor-pointer text-xs"
                />
                {config.notificationSoundUrl && (
                  <audio
                    controls
                    src={config.notificationSoundUrl}
                    className="h-8 w-full"
                  />
                )}
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-primary/40" />
                  {!config.notificationSoundUrl
                    ? t("defaultSound")
                    : t("customSound")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Greeting Editor */}
      {isAddingGreeting && (
        <Card className="border-primary/30 shadow-2xl bg-background/80 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-primary/5">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              {t("editGreeting")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="space-y-6 max-w-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold">{t("pathname")}</Label>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">
                    {t("autoPrefixNote")}
                  </span>
                </div>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-2.5 py-1.5 bg-muted rounded-md border border-border pointer-events-none group-focus-within:border-primary/50 group-focus-within:bg-primary/5 transition-all z-10">
                    <Globe className="w-3.5 h-3.5 text-primary/60" />
                    <span className="text-[11px] font-mono font-bold text-muted-foreground">
                      /[dil]
                    </span>
                  </div>
                  <Input
                    placeholder={t("pathPlaceholder")}
                    value={greetingForm.pathname}
                    onChange={(e) =>
                      setGreetingForm({
                        ...greetingForm,
                        pathname: e.target.value,
                      })
                    }
                    className="pl-32 h-11 text-sm bg-muted/20 focus:bg-background transition-all"
                  />
                </div>
                {greetingForm.pathname && (
                  <div className="text-[11px] text-muted-foreground bg-primary/5 p-3 rounded-lg flex flex-wrap gap-2 items-center border border-primary/10 animate-in fade-in duration-300">
                    <span className="font-bold text-primary italic mr-2">
                      {t("allLanguagesNote")}
                    </span>
                    {["tr", "en"].map((lang) => (
                      <code
                        key={lang}
                        className="bg-background px-2 py-0.5 rounded border border-border/50 shadow-sm text-primary font-mono"
                      >
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
              <Label>{t("messageContent")}</Label>
              <LanguageTabs
                sourceLang="tr"
                targetLangs={Object.keys(languageNames).filter(
                  (l) => l !== "tr",
                )}
              >
                {(lang) => {
                  const currentTrans = greetingForm.translations.find(
                    (t) => t.language === lang,
                  ) || {
                    language: lang as Language,
                    text: "",
                    quickAnswers: [],
                  };

                  const handleUpdateTrans = (
                    updates: Partial<GreetingTranslationInput>,
                  ) => {
                    const newTrans = [...greetingForm.translations];
                    const idx = newTrans.findIndex((t) => t.language === lang);
                    if (idx > -1) {
                      newTrans[idx] = { ...newTrans[idx], ...updates };
                    } else {
                      newTrans.push({
                        language: lang as Language,
                        text: "",
                        quickAnswers: [],
                        ...updates,
                      });
                    }
                    setGreetingForm({
                      ...greetingForm,
                      translations: newTrans,
                    });
                  };

                  return (
                    <div className="space-y-6" key={lang}>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">
                          {t("messageContent")}
                        </Label>
                        <Input
                          placeholder={t("greetingPlaceholder", {
                            name:
                              languageNames[
                                lang as keyof typeof languageNames
                              ] || lang,
                          })}
                          value={currentTrans.text}
                          onChange={(e) =>
                            handleUpdateTrans({ text: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold flex items-center gap-2">
                            {t("quickAnswers") || "Hızlı Cevaplar"}
                            <span className="text-[10px] font-normal text-muted-foreground">
                              (
                              {t("maxQuickAnswers", { count: 4 }) ||
                                "En fazla 4 adet"}
                              )
                            </span>
                          </Label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[0, 1, 2, 3].map((index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`${t("quickAnswer") || "Cevap"} ${index + 1}`}
                                value={currentTrans.quickAnswers?.[index] || ""}
                                onChange={(e) => {
                                  const newAnswers = [
                                    ...(currentTrans.quickAnswers || []),
                                  ];
                                  newAnswers[index] = e.target.value;
                                  handleUpdateTrans({
                                    quickAnswers: newAnswers.filter(
                                      (a, i) => a.trim() !== "" || i < index,
                                    ),
                                  });
                                }}
                                className="h-9 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                          {t("quickAnswersDesc") ||
                            "Kullanıcıya karşılama mesajıyla birlikte sunulacak hızlı soru/cevap butonları."}
                        </p>
                      </div>
                    </div>
                  );
                }}
              </LanguageTabs>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => setIsAddingGreeting(false)}
              >
                {commonT("cancel")}
              </Button>
              <Button onClick={handleSaveGreeting} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" /> {commonT("save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
