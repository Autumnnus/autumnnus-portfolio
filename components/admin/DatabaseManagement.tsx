"use client";

import { AlertCircle, Database, Download, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function DatabaseManagement() {
  const t = useTranslations("Admin.Database");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/export");
      if (!response.ok) throw new Error(t("error"));

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(t("confirm"))) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("error"));
      }

      toast.success(t("success"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
      console.error(err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-8 bg-card border border-border rounded-xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-red-500/10 rounded-lg">
          <Database className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleExport}
          disabled={loading}
          className="flex-1 px-6 py-4 bg-secondary text-secondary-foreground rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-3 border border-border"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          <div className="text-left">
            <div className="font-bold">{t("export")}</div>
            <div className="text-xs opacity-70">{t("exportSub")}</div>
          </div>
        </button>

        <label className="flex-1 cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleImport}
            disabled={loading}
          />
          <div className="px-6 py-4 bg-red-500 text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-500/20">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <div className="text-left">
              <div className="font-bold">{t("import")}</div>
              <div className="text-xs opacity-70">{t("importSub")}</div>
            </div>
          </div>
        </label>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        ⚠️ {t("warning")}
      </p>
    </div>
  );
}
