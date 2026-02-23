"use client";
import { cn } from "@/lib/utils";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

interface EmbeddingStats {
  totalCount: number;
  bySource: Array<{
    sourceType: string;
    _count: {
      _all: number;
    };
  }>;
}

interface EmbeddingItem {
  id: string;
  sourceType: string;
  title: string;
  lastUpdated: string;
  status: "synced" | "outdated" | "missing";
}

interface EmbeddingDetail {
  id: string;
  chunkText: string;
  chunkIndex: number;
  language: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EmbeddingsPage() {
  const t = useTranslations("Admin.Embeddings");
  const tNav = useTranslations("Admin.Navigation");
  const tCommon = useTranslations("Admin.Common");
  const { data: stats, mutate: mutateStats } = useSWR<EmbeddingStats>(
    "/api/admin/embeddings",
    fetcher,
  );

  const {
    data: itemsData,
    mutate: mutateItems,
    isLoading: itemsLoading,
  } = useSWR<{ items: EmbeddingItem[] }>(
    "/api/admin/embeddings/items",
    fetcher,
  );

  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncingItem, setSyncingItem] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [selectedItem, setSelectedItem] = useState<EmbeddingItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: detailsData, isLoading: detailsLoading } = useSWR<{
    embeddings: EmbeddingDetail[];
  }>(
    selectedItem
      ? `/api/admin/embeddings/details?sourceType=${selectedItem.sourceType}&sourceId=${selectedItem.id}`
      : null,
    fetcher,
  );

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const res = await fetch("/api/admin/embeddings", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(t("syncSuccess"));
      mutateStats();
      mutateItems();
    } catch (error) {
      toast.error(t("syncError"));
      console.error(error);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncSingle = async (sourceType: string, sourceId: string) => {
    setSyncingItem(sourceId);
    try {
      const res = await fetch("/api/admin/embeddings/sync-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType, sourceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(t("syncSuccess"));
      mutateStats();
      mutateItems();
    } catch (error) {
      toast.error(t("syncError"));
      console.error(error);
    } finally {
      setSyncingItem(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(t("deleteConfirm"))) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/embeddings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(t("deleteSuccess"));
      mutateStats();
      mutateItems();
    } catch (error) {
      toast.error(t("deleteError"));
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async (
    e: React.MouseEvent,
    sourceType: string,
    sourceId: string,
  ) => {
    e.stopPropagation();
    if (!confirm(t("deleteConfirm"))) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/embeddings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType, sourceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(t("deleteSuccess"));
      mutateStats();
      mutateItems();
      if (selectedItem?.id === sourceId) {
        setSelectedItem(null);
        setIsDetailOpen(false);
      }
    } catch (error) {
      toast.error(t("deleteError"));
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const currentItems = itemsData?.items || [];

  const filteredItems = currentItems.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesType = typeFilter === "all" || item.sourceType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8 animate-in fade-in zoom-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/40 bg-clip-text text-transparent">
            {t("title")}
          </h2>
          <p className="text-muted-foreground mt-2 font-medium max-w-2xl">
            {t("description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleDeleteAll}
            disabled={isDeleting}
            className="flex-1 sm:flex-none border border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive rounded-2xl h-12 px-6 transition-all"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            {t("clearDb")}
          </Button>
          <Button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-12 px-8 shadow-xl shadow-primary/20 transition-all font-bold group"
          >
            {isSyncingAll ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            )}
            {t("syncAll")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border-primary/20 bg-primary/5 shadow-2xl shadow-primary/5 group transition-all hover:-translate-y-1 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Database size={64} className="text-primary" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">
              {t("totalChunks")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary">
              {stats?.totalCount || 0}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tighter opacity-70">
              {t("totalChunksDesc")}
            </p>
          </CardContent>
        </Card>

        {stats?.bySource.map((s) => (
          <Card
            key={s.sourceType}
            className="rounded-3xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 hover:border-primary/20 border border-border/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {s.sourceType}
              </CardTitle>
              <Badge
                variant="secondary"
                className="px-2 py-0 h-5 text-[10px] font-bold rounded-full"
              >
                {s.sourceType}s
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s._count._all}</div>
              <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tighter opacity-70">
                {t("activeChunks")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl shadow-2xl border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 bg-muted/10 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {t("contentSync")}
              </CardTitle>
              <CardDescription className="font-medium">
                {t("contentSyncDesc")}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  className="pl-11 w-full sm:w-[250px] bg-background rounded-2xl border-border/50 h-12 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="flex-1 sm:w-[140px] bg-background rounded-2xl h-12 border-border/50 font-medium">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
                    <SelectItem value="all">{t("typeAll")}</SelectItem>
                    <SelectItem value="project">{tNav("projects")}</SelectItem>
                    <SelectItem value="blog">{tNav("blog")}</SelectItem>
                    <SelectItem value="profile">{tNav("profile")}</SelectItem>
                    <SelectItem value="experience">
                      {tNav("experience")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1 sm:w-[140px] bg-background rounded-2xl h-12 border-border/50 font-medium">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
                    <SelectItem value="all">{t("statusAll")}</SelectItem>
                    <SelectItem value="synced">{t("synced")}</SelectItem>
                    <SelectItem value="outdated">{t("outdated")}</SelectItem>
                    <SelectItem value="missing">{t("missing")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[140px] pl-8 text-xs font-bold uppercase tracking-widest py-6">
                    {tCommon("category")}
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest py-6">
                    {tCommon("title")}
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest py-6 hidden md:table-cell">
                    {tCommon("date")}
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest py-6">
                    {tCommon("status")}
                  </TableHead>
                  <TableHead className="text-right pr-8 text-xs font-bold uppercase tracking-widest py-6">
                    {tCommon("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!mounted || itemsLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-64 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-4 animate-pulse">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="font-bold tracking-widest text-xs uppercase">
                          {t("loading")}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-64 text-center text-muted-foreground p-8"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="opacity-10" />
                        <span className="font-bold text-sm">
                          {tCommon("noResults")}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className="group hover:bg-muted/30 transition-all cursor-pointer border-border/30"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsDetailOpen(true);
                      }}
                    >
                      <TableCell className="pl-8 font-bold text-xs uppercase tracking-tight py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-2.5 h-2.5 rounded-full shadow-sm ring-2 ring-background",
                              item.sourceType === "project"
                                ? "bg-blue-500"
                                : item.sourceType === "blog"
                                  ? "bg-purple-500"
                                  : item.sourceType === "profile"
                                    ? "bg-orange-500"
                                    : "bg-emerald-500",
                            )}
                          />
                          {item.sourceType}
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm truncate max-w-[150px] sm:max-w-[300px]">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5 group-hover:text-primary transition-colors">
                            ID: {item.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground font-medium text-xs hidden md:table-cell py-5"
                        suppressHydrationWarning
                      >
                        {mounted &&
                          new Date(item.lastUpdated).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                      </TableCell>
                      <TableCell className="py-5">
                        {item.status === "synced" && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 px-3 py-1 rounded-full border-emerald-200/50 text-[10px] font-bold gap-1.5 transition-all">
                            <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                            <span className="hidden sm:inline">
                              {t("synced")}
                            </span>
                          </Badge>
                        )}
                        {item.status === "outdated" && (
                          <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 px-3 py-1 rounded-full border-amber-200/50 text-[10px] font-bold gap-1.5 transition-all">
                            <AlertTriangle className="w-3.5 h-3.5" />{" "}
                            <span className="hidden sm:inline">
                              {t("outdated")}
                            </span>
                          </Badge>
                        )}
                        {item.status === "missing" && (
                          <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 px-3 py-1 rounded-full border-rose-200/50 text-[10px] font-bold gap-1.5 transition-all">
                            <XCircle className="w-3.5 h-3.5" />{" "}
                            <span className="hidden sm:inline">
                              {t("missing")}
                            </span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-8 py-5">
                        <div className="flex items-center justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 sm:translate-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                            onClick={(e) =>
                              handleDeleteSingle(e, item.sourceType, item.id)
                            }
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant={
                              item.status === "synced" ? "ghost" : "default"
                            }
                            size="sm"
                            className={cn(
                              "h-9 rounded-xl font-bold transition-all px-4",
                              item.status !== "synced" &&
                                "bg-primary shadow-lg shadow-primary/20",
                            )}
                            disabled={syncingItem === item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSyncSingle(item.sourceType, item.id);
                            }}
                          >
                            {syncingItem === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw
                                className={cn(
                                  "w-4 h-4",
                                  item.status !== "synced" && "animate-pulse",
                                )}
                              />
                            )}
                            <span className="hidden xl:inline ml-2">
                              {t("sync")}
                            </span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <AnimatePresence>
        {isDetailOpen && selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 px-4"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] lg:w-[650px] bg-background/95 backdrop-blur-2xl border-l border-border/50 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-border/50 flex items-center justify-between bg-muted/5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                    <Database size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight truncate">
                      {selectedItem.title}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      {t("itemDetails")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-2xl hover:bg-muted shrink-0 h-10 w-10 active:scale-95 transition-all"
                >
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 sm:p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-6 bg-muted/20 p-6 rounded-3xl border border-border/50">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {tCommon("category")}
                      </span>
                      <p className="font-bold capitalize flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            itemColorMap[
                              selectedItem.sourceType as keyof typeof itemColorMap
                            ] || "bg-gray-500",
                          )}
                        />
                        {selectedItem.sourceType}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {tCommon("status")}
                      </span>
                      <div>
                        {selectedItem.status === "synced" && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full border-emerald-200/50">
                            {t("synced")}
                          </Badge>
                        )}
                        {selectedItem.status === "outdated" && (
                          <Badge className="bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full border-amber-200/50">
                            {t("outdated")}
                          </Badge>
                        )}
                        {selectedItem.status === "missing" && (
                          <Badge className="bg-rose-500/10 text-rose-600 px-3 py-1 rounded-full border-rose-200/50">
                            {t("missing")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        {t("chunks")}
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/5 border-primary/20"
                      >
                        {detailsData?.embeddings.length || 0} Total
                      </Badge>
                    </div>

                    {detailsLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {t("loading")}
                        </span>
                      </div>
                    ) : detailsData?.embeddings.length === 0 ? (
                      <div className="text-center py-16 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50 p-8">
                        <Database className="w-16 h-16 text-muted-foreground/10 mx-auto mb-4" />
                        <p className="font-bold text-muted-foreground">
                          {t("noChunks")}
                        </p>
                        <Button
                          variant="outline"
                          className="mt-6 rounded-2xl px-8 h-12 border-primary/20 hover:bg-primary/5 transition-all text-primary font-bold"
                          onClick={() =>
                            handleSyncSingle(
                              selectedItem.sourceType,
                              selectedItem.id,
                            )
                          }
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {t("sync")}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {detailsData?.embeddings.map((emb) => (
                          <div
                            key={emb.id}
                            className="group relative bg-card border border-border/50 rounded-3xl p-5 sm:p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <Badge
                                variant="outline"
                                className="bg-primary/5 text-primary text-[10px] font-bold px-3 py-1 rounded-full border-primary/10"
                              >
                                Chunk #{emb.chunkIndex}
                              </Badge>
                              <Badge className="text-[10px] font-bold px-3 py-1 bg-muted text-muted-foreground rounded-full border-border/50">
                                {emb.language.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-foreground/80 leading-relaxed font-mono bg-muted/30 p-4 sm:p-5 rounded-2xl border border-border/50 group-hover:bg-background transition-colors max-h-[300px] overflow-y-auto custom-scrollbar">
                              {emb.chunkText}
                            </div>
                            <div className="mt-4 text-[10px] text-muted-foreground flex items-center justify-between px-1">
                              <span
                                className="font-medium italic"
                                suppressHydrationWarning
                              >
                                {mounted &&
                                  new Date(emb.updatedAt).toLocaleString(
                                    undefined,
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                              </span>
                              <span className="font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                ID: {emb.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <div className="p-6 sm:p-8 border-t border-border/50 bg-muted/5 mt-auto flex flex-col sm:flex-row gap-4">
                <Button
                  variant="ghost"
                  className="flex-1 h-12 rounded-2xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-100 font-bold active:scale-[0.98] transition-all"
                  onClick={(e) =>
                    handleDeleteSingle(
                      e,
                      selectedItem.sourceType,
                      selectedItem.id,
                    )
                  }
                  disabled={isDeleting}
                >
                  <Trash2 className="w-5 h-5 mr-3" />
                  {t("deleteSingle")}
                </Button>
                <Button
                  className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                  onClick={() =>
                    handleSyncSingle(selectedItem.sourceType, selectedItem.id)
                  }
                  disabled={syncingItem === selectedItem.id}
                >
                  {syncingItem === selectedItem.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5 mr-3" />
                  )}
                  {t("sync")}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const itemColorMap = {
  project: "bg-blue-500",
  blog: "bg-purple-500",
  profile: "bg-orange-500",
  experience: "bg-emerald-500",
};
