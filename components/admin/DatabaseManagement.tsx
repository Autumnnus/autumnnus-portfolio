"use client";

import BackupModal from "@/components/admin/BackupModal";
import { AlertCircle, Database, Download, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useRef, useState } from "react";

export default function DatabaseManagement() {
  const t = useTranslations("Admin.Database");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalMode, setModalMode] = useState<"export" | "import" | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [loadingMode, setLoadingMode] = useState<"export" | "import" | null>(
    null,
  );

  const openExportModal = () => {
    setModalMode("export");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setModalMode("import");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    setModalMode(null);
    setImportFile(null);
    setLoadingMode(null);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="p-4 sm:p-8 bg-card border border-border/50 rounded-2xl space-y-8 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
          <Database size={160} />
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative z-10">
          <div className="p-4 bg-red-500/10 rounded-2xl shadow-inner border border-red-500/20">
            <Database className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t("title")}
            </h2>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              {t("description")}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 relative z-10">
          {/* Export button */}
          <button
            onClick={openExportModal}
            disabled={loadingMode !== null}
            className="flex-1 px-6 py-5 sm:py-6 bg-background text-foreground rounded-2xl font-bold hover:bg-muted transition-all flex items-center justify-center gap-4 border border-border/50 shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl text-blue-500">
              {loadingMode === "export" ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              ) : (
                <Download className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>
            <div className="text-left">
              <div className="font-bold text-base sm:text-lg">{t("export")}</div>
              <div className="text-xs text-muted-foreground font-medium opacity-70">
                {t("exportSub")}
              </div>
            </div>
          </button>

          {/* Import button */}
          <label className="flex-1 cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleFileSelect}
              disabled={loadingMode !== null}
            />
            <div className="px-6 py-5 sm:py-6 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-4 shadow-lg shadow-red-500/20 active:scale-[0.98] h-full">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl">
                {loadingMode === "import" ? (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </div>
              <div className="text-left">
                <div className="font-bold text-base sm:text-lg">
                  {t("import")}
                </div>
                <div className="text-xs text-white/70 font-medium">
                  {t("importSub")}
                </div>
              </div>
            </div>
          </label>
        </div>

        <div className="p-4 bg-muted/30 rounded-xl border border-border/30 relative z-10">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center flex items-center justify-center gap-2">
            <AlertCircle size={14} className="text-red-500" />
            {t("warning")}
          </p>
        </div>
      </div>

      {/* Modal */}
      {modalMode && (
        <BackupModal
          mode={modalMode}
          importFile={importFile}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
