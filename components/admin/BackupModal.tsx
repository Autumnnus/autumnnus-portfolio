"use client";

import {
  AlertTriangle,
  Briefcase,
  CalendarDays,
  CheckSquare,
  Download,
  FileArchive,
  FileText,
  FolderOpen,
  HardDrive,
  Loader2,
  Square,
  Upload,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionMeta {
  count: number;
  items?: string[];
  imageCount?: number;
  iconCount?: number;
  logoCount?: number;
  questCount?: number;
  hasAvatar?: boolean;
  exists?: boolean;
  name?: string;
}

interface ExportPreview {
  projects: SectionMeta;
  blogs: SectionMeta;
  skills: SectionMeta;
  experiences: SectionMeta;
  profile: {
    exists: boolean;
    hasAvatar: boolean;
    name?: string;
    questCount: number;
  };
  totalAssets: number;
}

interface ImportPreview {
  timestamp?: string;
  projects: SectionMeta;
  blogs: SectionMeta;
  skills: SectionMeta;
  experiences: SectionMeta;
  profile: {
    exists: boolean;
    name?: string;
    hasAvatar: boolean;
    questCount: number;
  };
  assets: { count: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_SECTIONS = [
  "projects",
  "blogs",
  "skills",
  "experiences",
  "profile",
] as const;
type Section = (typeof ALL_SECTIONS)[number];

const SECTION_ICONS: Record<Section, React.ReactNode> = {
  projects: <FolderOpen className="w-4 h-4" />,
  blogs: <FileText className="w-4 h-4" />,
  skills: <Wrench className="w-4 h-4" />,
  experiences: <Briefcase className="w-4 h-4" />,
  profile: <User className="w-4 h-4" />,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface BackupModalProps {
  mode: "export" | "import";
  importFile?: File | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BackupModal({
  mode,
  importFile,
  onClose,
  onSuccess,
}: BackupModalProps) {
  const t = useTranslations("Admin.Database");

  const [step, setStep] = useState<"loading" | "preview" | "executing">(
    "loading",
  );
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(
    null,
  );
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(
    null,
  );
  const [selected, setSelected] = useState<Set<Section>>(
    new Set(ALL_SECTIONS),
  );
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── Fetch preview on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (mode === "export") {
      fetch("/api/admin/export/preview")
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load preview");
          return r.json();
        })
        .then((data) => {
          setExportPreview(data);
          setStep("preview");
        })
        .catch((e) => {
          setError(e.message);
          setStep("preview");
        });
    } else if (importFile) {
      const fd = new FormData();
      fd.append("file", importFile);
      fetch("/api/admin/import/preview", { method: "POST", body: fd })
        .then((r) => {
          if (!r.ok) throw new Error("Failed to parse backup file");
          return r.json();
        })
        .then((data) => {
          setImportPreview(data);
          setStep("preview");
        })
        .catch((e) => {
          setError(e.message);
          setStep("preview");
        });
    }
  }, [mode, importFile]);

  // ── Close on Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "executing") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [step, onClose]);

  // ── Section labels ────────────────────────────────────────────────────────
  const sectionLabel: Record<Section, string> = {
    projects: t("projects"),
    blogs: t("blogs"),
    skills: t("skills"),
    experiences: t("experiences"),
    profile: t("profile"),
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleSection = (s: Section) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === ALL_SECTIONS.length
        ? new Set()
        : new Set(ALL_SECTIONS),
    );

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (selected.size === 0) {
      toast.error(t("noSections"));
      return;
    }
    setStep("executing");
    setError(null);
    try {
      const params = Array.from(selected).join(",");
      const res = await fetch(`/api/admin/export?sections=${params}`);
      if (!res.ok) throw new Error(t("error"));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
      setStep("preview");
    }
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!importFile || selected.size === 0) {
      toast.error(t("noSections"));
      return;
    }
    setStep("executing");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("sections", JSON.stringify(Array.from(selected)));
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("error"));
      }
      toast.success(t("success"));
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
      setStep("preview");
    }
  };

  // ── Section row renderer ───────────────────────────────────────────────────
  const renderSectionRow = (
    section: Section,
    data: {
      count: number;
      items?: string[];
      assetCount?: number;
      assetLabel?: string;
      extra?: string;
    },
  ) => {
    const isSelected = selected.has(section);
    const isEmpty = data.count === 0 && !data.extra;

    return (
      <button
        key={section}
        onClick={() => !isEmpty && toggleSection(section)}
        disabled={isEmpty}
        className={`w-full text-left p-3 rounded-xl border transition-all ${
          isEmpty
            ? "border-border/30 opacity-40 cursor-not-allowed"
            : isSelected
              ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
              : "border-border/30 bg-muted/20 hover:bg-muted/40"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="mt-0.5 shrink-0 text-primary">
            {isEmpty ? (
              <Square className="w-4 h-4 text-muted-foreground" />
            ) : isSelected ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          {/* Icon + Name */}
          <div className="flex items-center gap-2 shrink-0 text-muted-foreground mt-0.5">
            {SECTION_ICONS[section]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold text-sm">{sectionLabel[section]}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {data.count > 0 && (
                  <span className="font-medium">
                    {data.count} {t("items")}
                  </span>
                )}
                {data.assetCount !== undefined && data.assetCount > 0 && (
                  <span>
                    · {data.assetCount} {data.assetLabel || t("images")}
                  </span>
                )}
                {data.extra && (
                  <span className="text-muted-foreground">{data.extra}</span>
                )}
              </div>
            </div>

            {/* Item list */}
            {data.items && data.items.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {data.items.slice(0, 5).join(", ")}
                {data.items.length > 5 && (
                  <span className="text-muted-foreground/60">
                    {" "}+{data.items.length - 5} {t("more")}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </button>
    );
  };

  // ── Render export sections ─────────────────────────────────────────────────
  const renderExportSections = () => {
    if (!exportPreview) return null;
    const { projects, blogs, skills, experiences, profile } = exportPreview;

    return (
      <div className="space-y-2">
        {renderSectionRow("projects", {
          count: projects.count,
          items: projects.items,
          assetCount: projects.imageCount,
          assetLabel: t("images"),
        })}
        {renderSectionRow("blogs", {
          count: blogs.count,
          items: blogs.items,
          assetCount: blogs.imageCount,
          assetLabel: t("images"),
        })}
        {renderSectionRow("skills", {
          count: skills.count,
          items: skills.items,
          assetCount: skills.iconCount,
          assetLabel: t("icons"),
        })}
        {renderSectionRow("experiences", {
          count: experiences.count,
          items: experiences.items,
          assetCount: experiences.logoCount,
          assetLabel: t("logos"),
        })}
        {renderSectionRow("profile", {
          count: profile.exists ? 1 : 0,
          items: profile.name ? [profile.name] : undefined,
          extra: profile.exists
            ? `${profile.hasAvatar ? t("withAvatar") : t("noAvatar")}${profile.questCount > 0 ? ` · ${profile.questCount} ${t("quests")}` : ""}`
            : undefined,
        })}
      </div>
    );
  };

  // ── Render import sections ─────────────────────────────────────────────────
  const renderImportSections = () => {
    if (!importPreview) return null;
    const { projects, blogs, skills, experiences, profile } = importPreview;

    return (
      <div className="space-y-2">
        {renderSectionRow("projects", {
          count: projects.count,
          items: projects.items,
        })}
        {renderSectionRow("blogs", {
          count: blogs.count,
          items: blogs.items,
        })}
        {renderSectionRow("skills", {
          count: skills.count,
          items: skills.items,
        })}
        {renderSectionRow("experiences", {
          count: experiences.count,
          items: experiences.items,
        })}
        {renderSectionRow("profile", {
          count: profile.exists ? 1 : 0,
          items: profile.name ? [profile.name] : undefined,
          extra: profile.exists
            ? `${profile.hasAvatar ? t("withAvatar") : t("noAvatar")}${profile.questCount > 0 ? ` · ${profile.questCount} ${t("quests")}` : ""}`
            : undefined,
        })}
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current && step !== "executing") onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-5 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${mode === "export" ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"}`}
            >
              {mode === "export" ? (
                <Download className="w-5 h-5" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">
                {mode === "export"
                  ? t("exportModalTitle")
                  : t("importModalTitle")}
              </h2>
              {mode === "import" && importPreview?.timestamp && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <CalendarDays className="w-3 h-3" />
                  {new Date(importPreview.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={step === "executing"}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Loading */}
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="w-7 h-7 animate-spin" />
              <p className="text-sm font-medium">
                {mode === "export" ? t("loadingPreview") : t("parsingZip")}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm flex items-center gap-2 border border-destructive/20">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview */}
          {step === "preview" && !error && (
            <>
              {/* Select all toggle */}
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {selected.size === ALL_SECTIONS.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                {selected.size === ALL_SECTIONS.length
                  ? t("deselectAll")
                  : t("selectAll")}
              </button>

              {/* Sections */}
              {mode === "export"
                ? renderExportSections()
                : renderImportSections()}

              {/* Stats footer */}
              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground border-t border-border/30">
                <HardDrive className="w-3.5 h-3.5" />
                <span>
                  {t("totalFiles")}:{" "}
                  <strong>
                    {mode === "export"
                      ? (exportPreview?.totalAssets ?? 0)
                      : (importPreview?.assets.count ?? 0)}
                  </strong>
                </span>
                <FileArchive className="w-3.5 h-3.5 ml-2" />
                <span>{t("filesInZip")}</span>
              </div>

              {/* Import warning */}
              {mode === "import" && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed font-medium">
                    {t("importWarning")}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Executing */}
          {step === "executing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="w-7 h-7 animate-spin" />
              <p className="text-sm font-medium">
                {mode === "export" ? t("exporting") : t("importing")}
              </p>
              <p className="text-xs opacity-60">{t("pleaseWait")}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "executing" && (
          <div className="flex items-center justify-between gap-3 p-5 border-t border-border/50 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              {t("cancel")}
            </button>

            {step === "preview" && !error && (
              <button
                onClick={mode === "export" ? handleExport : handleImport}
                disabled={selected.size === 0}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  mode === "export"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {mode === "export" ? (
                  <Download className="w-4 h-4" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {mode === "export" ? t("downloadZip") : t("importNow")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
