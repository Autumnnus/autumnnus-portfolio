"use client";

import {
  createSkillAction,
  deleteSkillAction,
} from "@/app/[locale]/admin/actions";
import Icon from "@/components/common/Icon";
import { Skill } from "@prisma/client";
import { Loader2, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SkillsManager({
  initialSkills,
}: {
  initialSkills: Skill[];
}) {
  const t = useTranslations("Admin.Skills");
  const router = useRouter();
  const [skills, setSkills] = useState(initialSkills);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
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
    if (!newName || !newIcon) return;
    setLoading(true);
    try {
      const newSkill = await createSkillAction({
        name: newName,
        icon: newIcon,
      });
      setSkills([...skills, newSkill]);
      setNewName("");
      setNewIcon("");
      toast.success("Yetenek eklendi."); // We can rely on default toast since it's a simple manager
      router.refresh();
    } catch (error) {
      toast.error(t("addError") + ": " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("deleteConfirm", { name }))) return;
    setLoadingId(id);
    try {
      await deleteSkillAction(id);
      setSkills(skills.filter((s) => s.id !== id));
      toast.success("Yetenek silindi.");
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

      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="flex items-center gap-2.5 pl-3.5 pr-2 py-2 border border-border/50 rounded-full bg-muted/20 hover:bg-muted/40 hover:border-primary/20 transition-all duration-300 group"
          >
            <Icon src={skill.icon} alt={skill.name} size={18} />
            <span className="font-bold text-[11px] sm:text-xs uppercase tracking-tight whitespace-nowrap">
              {skill.name}
            </span>
            <button
              onClick={() => handleDelete(skill.id, skill.name)}
              disabled={loadingId === skill.id}
              className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all shrink-0"
              title={t("delete")}
            >
              {loadingId === skill.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ))}
        {skills.length === 0 && (
          <div className="w-full text-center py-8 text-muted-foreground text-sm font-medium italic opacity-60">
            {t("noSkills") || "Henüz yetenek eklenmemiş"}
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
                  setNewName(e.target.value); // Sync manual typing
                  setShowIconDropdown(true);
                }}
                onFocus={() => setShowIconDropdown(true)}
                onBlur={() => setTimeout(() => setShowIconDropdown(false), 200)}
                placeholder={t("searchPlaceholder")}
                className="w-full py-3 pl-11 pr-11 rounded-xl border border-border bg-background/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all shadow-sm"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-sm shadow-lg shadow-primary/20 group"
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
