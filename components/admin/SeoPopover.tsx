"use client";

import { generateSeoAction } from "@/app/[locale]/admin/ai-actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface SeoPopoverProps {
  type: "blog" | "project";
  language: string;
  onSeoGenerated: (result: {
    title: string;
    description?: string;
    shortDescription?: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    excerpt?: string;
  }) => void;
}

export default function SeoPopover({
  type,
  language,
  onSeoGenerated,
}: SeoPopoverProps) {
  const t = useTranslations("Admin.Form");
  const commonT = useTranslations("Admin.Common");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleGenerate = async () => {
    if (!context || context.length < 30) {
      alert(t("seoMinChars"));
      return;
    }

    setLoading(true);
    try {
      const result = await generateSeoAction({
        type,
        content: context,
        language,
      });

      onSeoGenerated(result);
      setOpen(false);
      setContext("");
      alert(t("seoSuccess"));
    } catch (error) {
      alert(
        t("seoError") +
          ": " +
          (error instanceof Error ? error.message : "Bilinmeyen hata"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {t("seoOptimize")}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold">{t("seoContext")}</label>
            <p className="text-xs text-muted-foreground">
              {t("seoContextDesc")}
            </p>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={t("seoPlaceholder")}
              className="w-full min-h-[120px] p-2 text-sm rounded-md border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              {context.length} {t("characters")}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setContext("");
              }}
              className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors"
            >
              {commonT("cancel")}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || context.length < 30}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("generating")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t("generate")}
                </>
              )}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
