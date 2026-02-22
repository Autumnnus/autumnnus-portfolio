"use client";

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
import { Separator } from "@radix-ui/react-separator";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Database,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
      toast.success(t("syncSuccess")); // Or a more specific one but syncSuccess is fine
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
    <div className="space-y-8 p-4 md:p-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t("title")}
          </h2>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={handleDeleteAll}
            disabled={isDeleting}
            className="shadow-sm"
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
            className="shadow-md bg-primary hover:bg-primary/90 transition-all duration-300"
          >
            {isSyncingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {t("syncAll")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-primary/20 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalChunks")}
            </CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stats?.totalCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("totalChunksDesc")}
            </p>
          </CardContent>
        </Card>

        {stats?.bySource.map((s) => (
          <Card
            key={s.sourceType}
            className="shadow-sm hover:shadow-md transition-all duration-300 border-border/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {s.sourceType}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {s.sourceType}s
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s._count._all}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("activeChunks")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-lg border-border/50 overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{t("contentSync")}</CardTitle>
              <CardDescription>{t("contentSyncDesc")}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  className="pl-9 w-[200px] lg:w-[250px] bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] bg-background">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
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
                <SelectTrigger className="w-[130px] bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("statusAll")}</SelectItem>
                  <SelectItem value="synced">{t("synced")}</SelectItem>
                  <SelectItem value="outdated">{t("outdated")}</SelectItem>
                  <SelectItem value="missing">{t("missing")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-sm z-10">
                <TableRow>
                  <TableHead className="w-[120px] pl-6">
                    {tCommon("category")}
                  </TableHead>
                  <TableHead>{tCommon("title")}</TableHead>
                  <TableHead>{tCommon("date")}</TableHead>
                  <TableHead>{tCommon("status")}</TableHead>
                  <TableHead className="text-right pr-6">
                    {tCommon("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-48 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span>{t("loading")}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-48 text-center text-muted-foreground"
                    >
                      {tCommon("noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className="group hover:bg-muted/40 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsDetailOpen(true);
                      }}
                    >
                      <TableCell className="pl-6 font-medium capitalize text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              item.sourceType === "project"
                                ? "bg-blue-500"
                                : item.sourceType === "blog"
                                  ? "bg-purple-500"
                                  : item.sourceType === "profile"
                                    ? "bg-orange-500"
                                    : "bg-green-500"
                            }`}
                          />
                          {item.sourceType}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex flex-col">
                          <span>{item.title}</span>
                          <span className="text-[10px] text-muted-foreground font-normal truncate max-w-[200px]">
                            ID: {item.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(item.lastUpdated).toLocaleDateString(
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
                      <TableCell>
                        {item.status === "synced" && (
                          <Badge
                            variant="secondary"
                            className="bg-green-500/10 text-green-600 hover:bg-green-500/20 gap-1 border-green-200"
                          >
                            <CheckCircle2 className="w-3 h-3" /> {t("synced")}
                          </Badge>
                        )}
                        {item.status === "outdated" && (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 gap-1 border-yellow-200"
                          >
                            <AlertTriangle className="w-3 h-3" />{" "}
                            {t("outdated")}
                          </Badge>
                        )}
                        {item.status === "missing" && (
                          <Badge
                            variant="default"
                            className="bg-red-500/10 text-red-600 hover:bg-red-500/20 gap-1 border-red-200 w-fit"
                          >
                            <XCircle className="w-3 h-3" /> {t("missing")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) =>
                              handleDeleteSingle(e, item.sourceType, item.id)
                            }
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={
                              item.status === "synced" ? "outline" : "default"
                            }
                            size="sm"
                            className={`h-8 transition-all duration-300 ${item.status !== "synced" && "shadow-sm"}`}
                            disabled={syncingItem === item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSyncSingle(item.sourceType, item.id);
                            }}
                          >
                            {syncingItem === item.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw
                                className={`w-4 h-4 mr-2 ${item.status !== "synced" ? "animate-pulse" : ""}`}
                              />
                            )}
                            {t("sync")}
                          </Button>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-background border-l shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between bg-card">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    {t("itemDetails")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedItem.title}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-full hover:bg-muted"
                >
                  <XCircle className="w-6 h-6 text-muted-foreground" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {tCommon("category")}
                      </span>
                      <p className="font-semibold capitalize">
                        {selectedItem.sourceType}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {tCommon("status")}
                      </span>
                      <div>
                        {selectedItem.status === "synced" && (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-200 bg-green-50"
                          >
                            {t("synced")}
                          </Badge>
                        )}
                        {selectedItem.status === "outdated" && (
                          <Badge
                            variant="outline"
                            className="text-yellow-600 border-yellow-200 bg-yellow-50"
                          >
                            {t("outdated")}
                          </Badge>
                        )}
                        {selectedItem.status === "missing" && (
                          <Badge
                            variant="outline"
                            className="text-red-600 border-red-200 bg-red-50"
                          >
                            {t("missing")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="h-px bg-border" />

                  <div className="space-y-4">
                    <h4 className="font-bold flex items-center gap-2 text-primary">
                      {t("chunks")}
                      <Badge variant="secondary" className="ml-auto">
                        {detailsData?.embeddings.length || 0}
                      </Badge>
                    </h4>

                    {detailsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-muted-foreground">
                          {t("loading")}
                        </span>
                      </div>
                    ) : detailsData?.embeddings.length === 0 ? (
                      <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                        <Database className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">{t("noChunks")}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
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
                            className="group relative bg-card border rounded-xl p-4 hover:border-primary/40 transition-colors shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge
                                variant="outline"
                                className="bg-primary/5 text-primary text-[10px]"
                              >
                                Chunk #{emb.chunkIndex}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {emb.language.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-foreground/80 leading-relaxed font-mono bg-muted/30 p-3 rounded-lg border border-border/50">
                              {emb.chunkText}
                            </div>
                            <div className="mt-2 text-[10px] text-muted-foreground flex items-center justify-between">
                              <span>
                                {new Date(emb.updatedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <div className="p-6 border-t bg-card mt-auto flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1 shadow-md"
                  onClick={(e) =>
                    handleDeleteSingle(
                      e,
                      selectedItem.sourceType,
                      selectedItem.id,
                    )
                  }
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("deleteSingle")}
                </Button>
                <Button
                  className="flex-1 shadow-md"
                  onClick={() =>
                    handleSyncSingle(selectedItem.sourceType, selectedItem.id)
                  }
                  disabled={syncingItem === selectedItem.id}
                >
                  {syncingItem === selectedItem.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
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
