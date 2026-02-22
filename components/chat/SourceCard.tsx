"use client";

import { type SourceItem } from "@/app/api/chat/route";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExternalLink, Github, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface SourceCardProps {
  source: SourceItem;
  className?: string;
}

export function SourceCard({ source, className }: SourceCardProps) {
  const t = useTranslations("Chat");
  return (
    <Link href={source.url} className={cn("group block", className)}>
      <div className="flex gap-3 rounded-xl border border-border/60 bg-card/50 p-3 transition-all hover:border-primary/40 hover:bg-card hover:shadow-sm">
        {source.imageUrl && (
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border/30 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={source.imageUrl}
              alt={source.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {source.title}
            </p>
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/60 mt-0.5 transition-colors group-hover:text-primary" />
          </div>

          {source.description && (
            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
              {source.description}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {source.category && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {source.category}
              </Badge>
            )}
            {source.technologies?.slice(0, 3).map((tech) => (
              <Badge
                key={tech}
                variant="outline"
                className="h-4 px-1.5 text-[10px]"
              >
                {tech}
              </Badge>
            ))}
            {source.tags?.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="h-4 px-1.5 text-[10px]"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {(source.github || source.liveDemo) && (
            <div className="mt-1 flex items-center gap-2">
              {source.github && (
                <a
                  href={source.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-3 w-3" />
                  <span>GitHub</span>
                </a>
              )}
              {source.liveDemo && (
                <a
                  href={source.liveDemo}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="h-3 w-3" />
                  <span>{t("liveDemo")}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

interface SourceListProps {
  sources: SourceItem[];
}

export function SourceList({ sources }: SourceListProps) {
  const t = useTranslations("Chat");
  if (sources.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-border/30 pt-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {t("sources")}
      </p>
      <div className="flex flex-col gap-1.5">
        {sources.map((source) => (
          <SourceCard
            key={`${source.sourceType}-${source.url}`}
            source={source}
          />
        ))}
      </div>
    </div>
  );
}
