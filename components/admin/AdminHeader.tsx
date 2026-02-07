"use client";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Home, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b-4 border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/tr"
            className="flex items-center gap-2 font-pixel text-xs uppercase tracking-tight text-muted-foreground hover:text-primary transition-colors hover:bg-secondary/20 p-2 border-2 border-transparent hover:border-border"
          >
            <Home className="w-4 h-4" />
            Ana Sayfaya Dön
          </Link>
          <div className="w-px h-6 bg-border" />
          <span className="font-pixel text-sm uppercase tracking-widest text-primary">
            Admin Panel
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/tr" })}
            className="flex items-center gap-2 font-pixel text-[10px] uppercase tracking-tighter text-destructive hover:bg-destructive/10 p-2 border-2 border-transparent hover:border-destructive transition-all"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </div>
    </header>
  );
}
