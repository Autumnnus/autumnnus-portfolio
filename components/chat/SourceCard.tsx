"use client";

import { type SourceItem } from "@/app/api/chat/route";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExternalLink, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

interface SourceCardProps {
  source: SourceItem;
  className?: string;
}

export function SourceCard({ source, className }: SourceCardProps) {
  const t = useTranslations("Chat");
  const router = useRouter();

  const handleCardClick = () => {
    router.push(source.url);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn("group block cursor-pointer", className)}
    >
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
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors relative z-10"
                >
                  <GitHubIcon className="h-3 w-3" />
                  <span>GitHub</span>
                </a>
              )}
              {source.liveDemo && (
                <a
                  href={source.liveDemo}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors relative z-10"
                >
                  <Globe className="h-3 w-3" />
                  <span>{t("liveDemo")}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
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
