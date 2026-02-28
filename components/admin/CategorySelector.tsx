"use client";

import {
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createCategoryAction,
  deleteCategoryAction,
  getCategoriesAction,
} from "@/app/[locale]/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

interface CategorySelectorProps {
  type: "project" | "blog";
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function CategorySelector({
  type,
  value,
  onChange,
  error,
}: CategorySelectorProps) {
  const t = useTranslations("Admin.Category");
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getCategoriesAction(type);
      setCategories(data);
    } catch {
      toast.error(t("fetchError") || "Failed to fetch categories");
    } finally {
      setIsLoading(false);
    }
  }, [type, t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = () => {
    if (!searchQuery.trim()) return;

    startTransition(async () => {
      try {
        const result = await createCategoryAction(searchQuery, type);
        setCategories((prev) => [...prev, result]);
        onChange(result.id);
        setSearchQuery("");
        setOpen(false);
        toast.success(t("createSuccess") || "Category created");
      } catch {
        toast.error(t("createError") || "Failed to create category");
      }
    });
  };

  const handleDeleteCategory = (
    id: string,
    name: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (!confirm(t("deleteConfirm", { name }))) return;

    startTransition(async () => {
      try {
        await deleteCategoryAction(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        if (value === id) onChange("");
        toast.success(t("deleteSuccess") || "Category deleted");
      } catch {
        toast.error(t("deleteError") || "Failed to delete category");
      }
    });
  };

  const selectedCategory = categories.find((c) => c.id === value);
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const showAddButton =
    searchQuery.trim() !== "" &&
    !categories.some((c) => c.name.toLowerCase() === searchQuery.toLowerCase());

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-10 px-3 font-normal bg-background",
              !value && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive",
            )}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{t("loading") || "Loading..."}</span>
              </div>
            ) : selectedCategory ? (
              selectedCategory.name
            ) : (
              t("select")
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="flex flex-col">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder={t("namePlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-10 w-full border-0 bg-transparent py-3 text-sm outline-hidden focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <ScrollArea className="max-h-[300px]">
              <div className="p-1">
                {filteredCategories.length === 0 && !showAddButton && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {t("noResults") || "No categories found."}
                  </div>
                )}

                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className={cn(
                      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 group transition-colors",
                      value === category.id &&
                        "bg-accent text-accent-foreground",
                    )}
                    onClick={() => {
                      onChange(category.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === category.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex-1">{category.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) =>
                        handleDeleteCategory(category.id, category.name, e)
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {showAddButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 mt-1 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={handleCreateCategory}
                    disabled={isPending}
                  >
                    <Plus className="h-4 w-4" />
                    {t("add")}: &quot;{searchQuery}&quot;
                  </Button>
                )}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
