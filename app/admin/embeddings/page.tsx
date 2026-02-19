"use client";

import { Database, Loader2, RefreshCw, Trash2 } from "lucide-react";
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EmbeddingsPage() {
  const { data, error, isLoading, mutate } = useSWR<EmbeddingStats>(
    "/api/admin/embeddings",
    fetcher,
  );

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/admin/embeddings", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Embeddings synced successfully!");
      mutate();
    } catch (error) {
      toast.error("Failed to sync embeddings.");
      console.error(error);
    } finally {
      setIsSyncing(false);
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
      mutate();
    } catch (error) {
      toast.error("Failed to delete embeddings.");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Failed to load stats.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Embedding Management
          </h2>
          <p className="text-muted-foreground">
            Manage vector embeddings for AI Chat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteAll}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-red-500 hover:text-red-600"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete All
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync All Content
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Chunks</h3>
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{data?.totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Total vector embeddings in DB
            </p>
          </div>
        </div>

        {data?.bySource.map((s) => (
          <div
            key={s.sourceType}
            className="rounded-xl border bg-card text-card-foreground shadow"
          >
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium capitalize">
                {s.sourceType} Chunks
              </h3>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{s._count._all}</div>
              <p className="text-xs text-muted-foreground">
                Embeddings for {s.sourceType}s
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
