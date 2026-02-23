"use client";

import {
  createSocialLinkAction,
  deleteSocialLinkAction,
} from "@/app/[locale]/admin/actions";
import Icon from "@/components/common/Icon";
import { SocialLink } from "@prisma/client";
import { Loader2, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SocialLinksManager({
  initialLinks,
}: {
  initialLinks: SocialLink[];
}) {
  const t = useTranslations("Admin.SocialLinks");
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newHref, setNewHref] = useState("");
  const [newIcon, setNewIcon] = useState("");

  const [iconSearchQuery, setIconSearchQuery] = useState("");
  const [iconSearchResults, setIconSearchResults] = useState<
    Array<{ name: string; icon: string; hex: string }>
  >([]);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);
  const [showIconDropdown, setShowIconDropdown] = useState(false);

  useEffect(() => {
    const searchIcons = async () => {
      if (!iconSearchQuery.trim()) {
        setIconSearchResults([]);
        return;
      }

      setIsSearchingIcons(true);
      try {
        const res = await fetch(
          `/api/admin/icons?q=${encodeURIComponent(iconSearchQuery)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setIconSearchResults(data.icons || []);
        } else {
          setIconSearchResults([]);
        }
      } catch (error) {
        console.error("Failed to search icons", error);
        setIconSearchResults([]);
      } finally {
        setIsSearchingIcons(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchIcons();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [iconSearchQuery]);

  const handleSelectSearchedIcon = (iconItem: {
    name: string;
    icon: string;
    hex: string;
  }) => {
    setNewName(iconItem.name);
    setNewIcon(iconItem.icon);
    setShowIconDropdown(false);
    setIconSearchQuery("");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newHref || !newIcon) return;
    setLoading(true);
    try {
      const newLink = await createSocialLinkAction({
        name: newName,
        href: newHref,
        icon: newIcon,
      });
      setLinks([...links, newLink]);
      setNewName("");
      setNewHref("");
      setNewIcon("");
      toast.success("Bağlantı eklendi.");
      router.refresh();
    } catch (error) {
      toast.error(t("addError") + ": " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    setLoadingId(id);
    try {
      await deleteSocialLinkAction(id);
      setLinks(links.filter((l) => l.id !== id));
      toast.success("Bağlantı silindi.");
      router.refresh();
    } catch (error) {
      toast.error(t("deleteError") + ": " + (error as Error).message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border/50 shadow-sm space-y-6">
      <div className="flex items-center gap-3 px-1">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold">{t("title")}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <div
            key={link.id}
            className="flex items-center justify-between p-4 border border-border/50 rounded-2xl bg-muted/20 hover:bg-muted/40 hover:border-primary/20 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3.5 overflow-hidden">
              <div className="p-2.5 bg-background rounded-xl shadow-sm border border-border/50 group-hover:border-primary/30 transition-colors">
                <Icon src={link.icon} alt={link.name} size={24} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm tracking-tight truncate">
                  {link.name}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate opacity-70">
                  {link.href}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(link.id)}
              disabled={loadingId === link.id}
              className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-2 shrink-0"
            >
              {loadingId === link.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
        {links.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground text-sm font-medium italic opacity-60">
            {t("noLinks") || "Henüz sosyal medya bağlantısı eklenmemiş"}
          </div>
        )}
      </div>

      <form
        onSubmit={handleAdd}
        className="space-y-5 pt-6 border-t border-border/50"
      >
        <div className="space-y-4">
          <div className="space-y-2 relative">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
              {t("searchLabel")}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search size={16} />
              </div>
              <input
                value={iconSearchQuery || newName}
                onChange={(e) => {
                  setIconSearchQuery(e.target.value);
                  setNewName(e.target.value);
                  setShowIconDropdown(true);
                }}
                onFocus={() => setShowIconDropdown(true)}
                onBlur={() => setTimeout(() => setShowIconDropdown(false), 200)}
                placeholder={t("searchPlaceholder")}
                className="w-full py-3.5 pl-11 pr-11 rounded-xl border border-border bg-background/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all shadow-sm"
                required
              />
              {isSearchingIcons && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              )}
            </div>

            {showIconDropdown && iconSearchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1.5 bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                {iconSearchResults.map((result, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSearchedIcon(result)}
                    className="flex items-center gap-3.5 px-4 py-3 hover:bg-primary/10 cursor-pointer transition-colors border-b border-border/30 last:border-0 group/item"
                  >
                    <div className="p-1.5 bg-muted rounded-lg group-hover/item:bg-background transition-colors">
                      <Image
                        src={result.icon}
                        alt={result.name}
                        width={20}
                        height={20}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-tight">
                      {result.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                {t("urlLabel")}
              </label>
              <input
                value={newHref}
                onChange={(e) => setNewHref(e.target.value)}
                placeholder="https://..."
                className="w-full py-3 px-4 rounded-xl border border-border bg-background/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all shadow-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                {t("iconLabel")}
              </label>
              <input
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder={t("iconPlaceholder")}
                className="w-full py-3 px-4 rounded-xl border border-border bg-background/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all shadow-sm"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-sm shadow-xl shadow-primary/20 group"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          )}
          {t("add")}
        </button>
      </form>
    </div>
  );
}
