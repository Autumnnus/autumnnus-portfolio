"use client";

import {
  createSkillAction,
  deleteSkillAction,
} from "@/app/[locale]/admin/actions";
import Icon from "@/components/common/Icon";
import { Skill } from "@prisma/client";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
      router.refresh();
    } catch (error) {
      alert(t("addError") + ": " + (error as Error).message);
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
      router.refresh();
    } catch (error) {
      alert(t("deleteError") + ": " + (error as Error).message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-6">
      <h3 className="text-xl font-bold">{t("title")}</h3>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 border rounded-full bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <Icon src={skill.icon} alt={skill.name} size={16} />
            <span className="font-semibold text-xs whitespace-nowrap">
              {skill.name}
            </span>
            <button
              onClick={() => handleDelete(skill.id, skill.name)}
              disabled={loadingId === skill.id}
              className="p-1 text-red-500 hover:bg-red-500/10 rounded-full transition-colors shrink-0"
              title={t("delete")}
            >
              {loadingId === skill.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="space-y-4 pt-4 border-t">
        <div className="space-y-2 relative">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
            {t("searchLabel")}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search size={14} />
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
              className="w-full py-2.5 pl-9 pr-10 rounded-lg border bg-background text-sm focus:border-primary outline-hidden transition-all"
              required
            />
            {isSearchingIcons && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                <Loader2 size={14} className="animate-spin" />
              </div>
            )}
          </div>

          {showIconDropdown && iconSearchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
              {iconSearchResults.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSearchedIcon(result)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-muted cursor-pointer transition-colors border-b border-border/50 last:border-0"
                >
                  <Image
                    src={result.icon}
                    alt={result.name}
                    width={20}
                    height={20}
                    className="object-contain"
                    unoptimized
                  />
                  <span className="text-sm font-medium">{result.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
            {t("iconLabel")}
          </label>
          <input
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder={t("iconPlaceholder")}
            className="w-full p-2.5 rounded-lg border bg-background text-sm focus:border-primary outline-hidden transition-all"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {t("add")}
        </button>
      </form>
    </div>
  );
}
