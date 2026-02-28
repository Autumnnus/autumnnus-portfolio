"use client";

import {
  getSystemStatus,
  seedDatabaseAction,
} from "@/app/[locale]/admin/status-actions";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  Info,
  Layers,
  RefreshCcw,
  ShieldCheck,
  Sprout,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface StatusData {
  db: {
    connected: boolean;
    tables: string[];
  };
  minio: {
    connected: boolean;
    bucketExists: boolean;
  };
}

export default function SystemStatus() {
  const t = useTranslations("Admin.Dashboard.status");
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getSystemStatus();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleSeed = async () => {
    if (!confirm(t("seedConfirm"))) return;

    setIsSeeding(true);
    const promise = seedDatabaseAction();

    toast.promise(promise, {
      loading: t("seeding"),
      success: (data) => {
        if (data.success) {
          fetchStatus();
          return t("seedSuccess");
        }
        throw new Error(data.error);
      },
      error: (err) => `${t("seedError")}: ${err.message}`,
    });

    try {
      await promise;
    } catch (error) {
      console.error("Seed error:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading && !status) {
    return (
      <div className="p-8 bg-card border border-border/50 rounded-3xl animate-pulse flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium">{t("checking")}</p>
        </div>
      </div>
    );
  }

  const allClear =
    status?.db.connected &&
    status?.minio.connected &&
    status?.minio.bucketExists;

  return (
    <div className="p-6 sm:p-8 bg-card border border-border/50 rounded-3xl space-y-8 shadow-xl relative overflow-hidden group">
      {/* Background Icon Decor */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity pointer-events-none">
        <ShieldCheck size={200} />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-2xl shadow-inner ${allClear ? "bg-green-500/10" : "bg-red-500/10"}`}
          >
            <ShieldCheck
              className={`w-8 h-8 ${allClear ? "text-green-500" : "text-red-500"}`}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`w-2 h-2 rounded-full ${allClear ? "bg-green-500" : "bg-red-500"} animate-pulse`}
              />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {allClear ? t("allOperational") : t("disconnected")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchStatus}
            disabled={isRefreshing || isSeeding}
            className="flex items-center gap-2 px-4 py-2 bg-background border border-border/50 rounded-xl text-sm font-bold hover:bg-muted transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {t("refresh")}
          </button>

          <button
            onClick={handleSeed}
            disabled={isRefreshing || isSeeding}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            <Sprout
              className={`w-4 h-4 ${isSeeding ? "animate-bounce" : ""}`}
            />
            {t("seed")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Database Status Card */}
        <div className="p-6 bg-background/50 border border-border/50 rounded-2xl space-y-4 hover:border-primary/30 transition-colors group/card">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Database className="w-5 h-5 text-blue-500" />
              </div>
              <span className="font-bold">{t("db")}</span>
            </div>
            {status?.db.connected ? (
              <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 size={12} />
                {t("connected")}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <XCircle size={12} />
                {t("disconnected")}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Layers size={14} className="text-primary/70" />
              <span>
                {t("tables")}:{" "}
                <span className="text-foreground font-bold">
                  {status?.db.tables.length || 0}
                </span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 custom-scrollbar">
              {status?.db.tables.map((table) => (
                <span
                  key={table}
                  className="px-2 py-1 bg-muted/50 text-[10px] font-medium rounded-md border border-border/30 hover:bg-muted transition-colors"
                >
                  {table}
                </span>
              ))}
              {status?.db.connected && status.db.tables.length === 0 && (
                <span className="text-[10px] text-orange-500 italic flex items-center gap-1">
                  <AlertTriangle size={10} />
                  No tables found
                </span>
              )}
            </div>
          </div>
        </div>

        {/* MinIO Status Card */}
        <div className="p-6 bg-background/50 border border-border/50 rounded-2xl space-y-4 hover:border-orange-500/30 transition-colors group/card">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <HardDrive className="w-5 h-5 text-orange-500" />
              </div>
              <span className="font-bold">{t("minio")}</span>
            </div>
            {status?.minio.connected ? (
              <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 size={12} />
                {t("connected")}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <XCircle size={12} />
                {t("disconnected")}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/30">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-primary/70" />
                <span className="text-xs font-medium text-muted-foreground">
                  {t("bucket")}
                </span>
              </div>
              {status?.minio.bucketExists ? (
                <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  {t("bucketExists")}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                  <XCircle size={10} />
                  {t("bucketMissing")}
                </span>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic opacity-70">
              Check if the assets bucket is correctly initialized in your MinIO
              instance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
