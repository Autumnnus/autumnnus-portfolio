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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EmbeddingsPage() {
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

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const res = await fetch("/api/admin/embeddings", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("All content synced successfully!");
      mutateStats();
      mutateItems();
    } catch (error) {
      toast.error("Failed to sync all content.");
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
      toast.success(`${sourceType} synced successfully!`);
      mutateStats();
      mutateItems();
    } catch (error) {
      toast.error(`Failed to sync ${sourceType}.`);
      console.error(error);
    } finally {
      setSyncingItem(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL embeddings?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/embeddings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("All embeddings deleted.");
      mutateStats();
      mutateItems();
    } catch (error) {
      toast.error("Failed to delete embeddings.");
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
            Vector Embeddings
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your AI knowledge base and synchronize content.
          </p>
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
            Clear Vector DB
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
            Sync All Data
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-primary/20 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Vector Chunks
            </CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stats?.totalCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total embeddings in DB
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
                Vector chunks active
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-lg border-border/50 overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Content Synchronization</CardTitle>
              <CardDescription>
                Individually update outdated AI contexts.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search titles..."
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
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="project">Projects</SelectItem>
                  <SelectItem value="blog">Blogs</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="synced">Synced</SelectItem>
                  <SelectItem value="outdated">Outdated</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
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
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Item Title</TableHead>
                  <TableHead>Last Edited</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
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
                        <span>Loading content...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-48 text-center text-muted-foreground"
                    >
                      No matching content found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium capitalize text-muted-foreground">
                        {item.sourceType}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {item.title}
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
                            <CheckCircle2 className="w-3 h-3" /> Synced
                          </Badge>
                        )}
                        {item.status === "outdated" && (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 gap-1 border-yellow-200"
                          >
                            <AlertTriangle className="w-3 h-3" /> Outdated
                          </Badge>
                        )}
                        {item.status === "missing" && (
                          <Badge
                            variant="default"
                            className="bg-red-500/10 text-red-600 hover:bg-red-500/20 gap-1 border-red-200 w-fit"
                          >
                            <XCircle className="w-3 h-3" /> Missing
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={
                            item.status === "synced" ? "ghost" : "default"
                          }
                          size="sm"
                          className={`transition-all duration-300 ${item.status !== "synced" && "shadow-sm"}`}
                          disabled={syncingItem === item.id}
                          onClick={() =>
                            handleSyncSingle(item.sourceType, item.id)
                          }
                        >
                          {syncingItem === item.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw
                              className={`w-4 h-4 mr-2 ${item.status !== "synced" ? "animate-pulse" : ""}`}
                            />
                          )}
                          Sync
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
