"use client";

import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  Briefcase,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Projects", href: "/admin/projects", icon: FolderOpen },
  { name: "Blog Posts", href: "/admin/blog", icon: FileText },
  { name: "Experience", href: "/admin/experience", icon: Briefcase },
  { name: "Profile", href: "/admin/profile", icon: User },
  { name: "Embeddings", href: "/admin/embeddings", icon: BrainCircuit },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-primary">Admin</span>Panel
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <form action={async () => {}}>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-destructive">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
