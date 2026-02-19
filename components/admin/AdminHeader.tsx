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

        <nav className="flex items-center gap-6 mr-6">
          <Link
            href="/admin/projects"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/admin/blog"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/admin/experience"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Experience
          </Link>
          <Link
            href="/admin/profile"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Profile
          </Link>
          <Link
            href="/admin/embeddings"
            className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
          >
            Embeddings
          </Link>
        </nav>

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
