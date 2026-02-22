"use client";

import { Input } from "@/components/ui/Input";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface AdminSearchProps {
  placeholder?: string;
}

export default function AdminSearch({ placeholder }: AdminSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("query") || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQuery = searchParams.get("query") || "";
      if (query === currentQuery) return; // Prevent unnecessary pushes

      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("query", query);
      } else {
        params.delete("query");
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  return (
    <div className="relative mb-6">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {isPending ? (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Search size={18} />
        )}
      </div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || "Search..."}
        className="pl-10 pr-10 h-11 bg-card border-border/50 focus-visible:ring-primary shadow-sm"
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
