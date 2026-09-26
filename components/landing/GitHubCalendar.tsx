"use client";

import PixelIcon from "@/components/pixel/PixelIcon";
import Reveal from "@/components/pixel/Reveal";
import { cn } from "@/lib/utils";
import { useFormatter, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import SectionHeading from "../common/SectionHeading";

interface GitHubCalendarProps {
  username?: string;
}

interface Contribution {
  date: string;
  count: number;
  level: number;
}

const CalendarSkeleton = () => (
  <div className="flex w-full animate-pulse gap-[4px] overflow-hidden">
    {Array.from({ length: 52 }).map((_, i) => (
      <div key={i} className="flex flex-col gap-[4px]">
        {Array.from({ length: 7 }).map((_, j) => (
          <div key={j} className="h-[12px] w-[12px] bg-muted" />
        ))}
      </div>
    ))}
  </div>
);

// Contribution levels as seasonal pixel ramps.
const CALENDAR_THEME = {
  light: ["#efdcba", "#f2c58f", "#e0692e", "#b4461c", "#6e2a12"],
  dark: ["#1b2544", "#34507f", "#4f8fc4", "#8fd8f2", "#e6f7ff"],
};

export default function GitHubCalendar({
  username = "Autumnnus",
}: GitHubCalendarProps) {
  const t = useTranslations();
  const { resolvedTheme } = useTheme();
  const [data, setData] = useState<Contribution[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | "last">("last");
  const [loading, setLoading] = useState(true);
  const format = useFormatter();

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${username}?y=${selectedYear}`,
        );
        const json = await response.json();

        if (json.contributions) {
          setData(json.contributions);
        }
      } catch (error) {
        console.error("Error fetching GitHub data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [username, selectedYear]);

  useEffect(() => {
    if (!username) return;

    const fetchYears = async () => {
      try {
        const response = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${username}`,
        );
        const json = await response.json();

        if (json.total) {
          const yearKeys = Object.keys(json.total)
            .filter((key) => /^\d{4}$/.test(key))
            .map((key) => parseInt(key))
            .sort((a, b) => b - a);
          setYears(yearKeys);
        }
      } catch (error) {
        console.error("Error fetching GitHub years:", error);
      }
    };

    fetchYears();
  }, [username]);

  const colorScheme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <section id="github" className="relative z-10 py-16">
      <SectionHeading
        subHeading={t("GitHub.subTitle")}
        heading={t("GitHub.title")}
        icon="sparkles"
      />
      <Reveal className="p-1">
        <div className="pixel-panel p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center text-primary pixel-slot">
              <PixelIcon name="leaf" className="h-5 w-5 dark:hidden" />
              <PixelIcon name="snowflake" className="hidden h-5 w-5 dark:block" />
            </span>
            <h3 className="font-pixel text-lg font-bold">{t("GitHub.activityTitle")}</h3>
            <div className="ml-auto flex flex-wrap gap-2 p-[3px]">
              {(["last", ...years] as const).map((year) => (
                <button
                  key={year}
                  type="button"
                  aria-pressed={selectedYear === year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "h-8 px-3 font-pixel text-sm transition-colors duration-100",
                    selectedYear === year
                      ? "bg-primary text-primary-foreground pixel-frame-sm"
                      : "text-muted-foreground hover:bg-primary/20 hover:text-foreground",
                  )}
                >
                  {year === "last" ? t("GitHub.lastYear") : year}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-scrollbar relative flex min-h-[150px] items-end overflow-x-auto pb-2">
            {data.length === 0 && loading ? (
              <CalendarSkeleton />
            ) : data.length === 0 && !loading ? (
              <div className="text-center w-full text-muted-foreground py-8">
                {t("GitHub.noData")}
              </div>
            ) : (
              <div
                className={`transition-opacity duration-300 w-full ${
                  loading ? "opacity-30 pointer-events-none" : "opacity-100"
                }`}
              >
                <ActivityCalendar
                  data={data}
                  theme={CALENDAR_THEME}
                  colorScheme={colorScheme}
                  blockRadius={0}
                  blockSize={12}
                  blockMargin={4}
                  fontSize={12}
                  showWeekdayLabels
                  renderBlock={(block, activity) => {
                    const countText =
                      activity.count === 0
                        ? t("GitHub.noContributions")
                        : t("GitHub.contributionCount", {
                            count: activity.count,
                          });

                    const dateText = format.dateTime(new Date(activity.date), {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    const tooltipHtml = t("GitHub.tooltip", {
                      countText: "[[COUNT]]",
                      date: dateText,
                    }).replace("[[COUNT]]", `<strong>${countText}</strong>`);

                    return React.cloneElement(
                      block as React.ReactElement<Record<string, string>>,
                      {
                        "data-tooltip-id": "gh-calendar-tooltip",
                        "data-tooltip-html": tooltipHtml,
                      },
                    );
                  }}
                />
                <ReactTooltip
                  id="gh-calendar-tooltip"
                  className="z-50 rounded-none! px-3! py-2! font-pixel! text-sm!"
                  border="3px solid var(--px-ink)"
                  style={{
                    backgroundColor: "var(--card)",
                    color: "var(--card-foreground)",
                  }}
                />
              </div>
            )}

            {/* Önceki veri varken yükleme yapılıyorsa ortada ufak bir spinner/pulse göster */}
            {data.length > 0 && loading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="flex gap-1.5 bg-card p-2 pixel-frame-sm">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      className="chat-dot h-2.5 w-2.5 bg-primary"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
