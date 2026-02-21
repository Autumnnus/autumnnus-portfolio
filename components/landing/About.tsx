"use client";

import SectionHeading from "@/components/common/SectionHeading";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

interface AboutData {
  aboutTitle?: string;
  aboutDescription?: string;
  quests?: { id: string; completed: boolean; order: number; label: string }[];
}

export default function About({
  data,
  stats,
}: {
  data?: AboutData | null;
  stats?: {
    projectCount: number;
    experienceYears: number;
    visitorCount: number;
    blogCount: number;
  };
}) {
  const t = useTranslations("About");

  const title = data?.aboutTitle || t("title");
  const description = data?.aboutDescription || t("description");

  const handleVisitorClick = () => {
    // Scroll to footer
    const footer = document.querySelector("footer");
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth" });
      // Trigger badge animation after a small delay to let scroll finish
      setTimeout(() => {
        const event = new CustomEvent("trigger-visitor-badge");
        window.dispatchEvent(event);
      }, 800);
    }
  };

  const quests = data?.quests ?? [];

  return (
    <section className="py-20 relative px-4" id="about">
      <SectionHeading subHeading={t("subTitle")} heading={title} />

      <div className="relative mt-12 max-w-6xl mx-auto">
        {/* Decorative elements from the image - Fixed positioning */}
        <div className="absolute -top-6 left-4 z-10 sm:-left-4">
          <div className="w-12 h-12 bg-foreground border-4 border-foreground shadow-[4px_4px_0_0_var(--primary)] flex items-center justify-center">
            <div className="w-6 h-4 bg-card rounded-sm relative">
              <div className="absolute top-1 left-1 w-2 h-0.5 bg-foreground" />
              <div className="absolute top-2 left-1 w-3 h-0.5 bg-foreground" />
            </div>
          </div>
        </div>

        {/* Main Dialogue Box - Using themed colors */}
        <div className="bg-card border-[6px] border-foreground p-6 md:p-12 relative shadow-[10px_10px_0_0_rgba(0,0,0,0.1)] dark:shadow-[10px_10px_0_0_rgba(255,255,255,0.05)]">
          {/* Corner accents - Simplified for better scaling */}
          <div className="absolute top-4 right-4 text-primary font-bold text-2xl select-none leading-none">
            ⌝
          </div>
          <div className="absolute bottom-4 left-4 text-primary font-bold text-2xl select-none leading-none">
            ⌞
          </div>
          <div className="absolute bottom-4 right-4 text-primary font-bold text-2xl select-none leading-none">
            ⌟
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
            {/* Left Column: Story */}
            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-8 h-1 bg-primary" />
                <h3 className="text-xl md:text-3xl font-bold text-foreground tracking-tight">
                  [{t("journeyTitle")}]
                </h3>
              </div>

              <div className="space-y-6">
                {description
                  .split("\n")
                  .filter((p: string) => p.trim() !== "")
                  .map((paragraph: string, index: number) => (
                    <p
                      key={index}
                      className="text-foreground/80 text-base md:text-xl leading-relaxed font-medium"
                    >
                      {paragraph.trim()}
                    </p>
                  ))}
              </div>
            </div>

            {/* Right Column: Quest Box */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-muted/30 border-2 border-border p-6 space-y-6 shadow-inner rounded-sm">
                <h4 className="text-primary font-pixel text-[10px] md:text-xs uppercase tracking-[0.15em] font-bold">
                  {t("currentQuest")}
                </h4>

                <ul className="space-y-5">
                  {quests.length > 0 ? (
                    quests.map((quest, idx) => (
                      <li
                        key={quest.id ?? idx}
                        className="flex items-start gap-4 group"
                      >
                        <div className="mt-1 flex-shrink-0">
                          {quest.completed ? (
                            <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                              <Check className="w-3 h-3 text-card stroke-4" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-foreground/30" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-foreground text-sm md:text-base font-semibold",
                            !quest.completed && "text-foreground/50",
                          )}
                        >
                          {quest.label}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-foreground/40 text-sm italic">—</li>
                  )}
                </ul>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 md:gap-3 w-full">
                <div
                  className="bg-muted/30 py-4 px-1 border-2 border-border/40 flex flex-col items-center justify-center min-h-[70px] md:min-h-[80px] rounded-sm overflow-hidden text-center cursor-help transition-colors hover:bg-muted/50"
                  data-tooltip-id="about-stats-tooltip"
                  data-tooltip-content={t("statYearsTooltip")}
                >
                  <div className="text-xl md:text-2xl font-bold font-mono text-primary leading-none mb-1">
                    {stats?.experienceYears || 0}
                  </div>
                  <div className="text-[9px] md:text-[11px] font-mono uppercase text-foreground/70 tracking-tighter md:tracking-normal truncate w-full px-1">
                    {t("statYears")}
                  </div>
                </div>
                <div
                  className="bg-muted/30 py-4 px-1 border-2 border-border/40 flex flex-col items-center justify-center min-h-[70px] md:min-h-[80px] rounded-sm overflow-hidden text-center cursor-help transition-colors hover:bg-muted/50"
                  data-tooltip-id="about-stats-tooltip"
                  data-tooltip-content={t("statProjsTooltip")}
                >
                  <div className="text-xl md:text-2xl font-bold font-mono text-primary leading-none mb-1">
                    {stats?.projectCount || 0}
                  </div>
                  <div className="text-[9px] md:text-[11px] font-mono uppercase text-foreground/70 tracking-tighter md:tracking-normal truncate w-full px-1">
                    {t("statProjs")}
                  </div>
                </div>
                <div
                  className="bg-muted/30 py-4 px-1 border-2 border-border/40 flex flex-col items-center justify-center min-h-[70px] md:min-h-[80px] rounded-sm overflow-hidden text-center cursor-help transition-colors hover:bg-muted/50"
                  data-tooltip-id="about-stats-tooltip"
                  data-tooltip-content={t("statBlogsTooltip")}
                >
                  <div className="text-xl md:text-2xl font-bold font-mono text-primary leading-none mb-1">
                    {stats?.blogCount || 0}
                  </div>
                  <div className="text-[9px] md:text-[11px] font-mono uppercase text-foreground/70 tracking-tighter md:tracking-normal truncate w-full px-1">
                    {t("statBlogs")}
                  </div>
                </div>
                <button
                  onClick={handleVisitorClick}
                  className="bg-primary/10 py-4 px-1 border-2 border-primary/40 flex flex-col items-center justify-center min-h-[70px] md:min-h-[80px] rounded-sm overflow-hidden text-center cursor-pointer transition-all hover:bg-primary/20 hover:border-primary active:scale-95 group"
                  data-tooltip-id="about-stats-tooltip"
                  data-tooltip-content={t("statWinsTooltip")}
                >
                  <div className="text-xl md:text-2xl font-bold font-mono text-primary leading-none mb-1 group-hover:scale-110 transition-transform">
                    {stats?.visitorCount || 0}
                  </div>
                  <div className="text-[9px] md:text-[11px] font-mono uppercase text-primary/70 tracking-tighter md:tracking-normal truncate w-full px-1 flex items-center justify-center gap-1">
                    {t("statWins")}
                  </div>
                </button>
              </div>

              <Tooltip
                id="about-stats-tooltip"
                className="z-50 shadow-xl rounded-md! px-4! py-3! text-xs! font-mono! border-2!"
                style={{
                  backgroundColor: "var(--card)",
                  color: "var(--foreground)",
                  border: "2px solid var(--primary)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
