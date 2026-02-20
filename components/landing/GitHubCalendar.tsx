"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import FadeIn from "../common/FadeIn";

interface GitHubCalendarProps {
  username?: string;
}

import { Leaf, Snowflake } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import SectionHeading from "../common/SectionHeading";

export default function GitHubCalendar({
  username = "Autumnnus",
}: GitHubCalendarProps) {
  const t = useTranslations();
  const { resolvedTheme } = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const format = useFormatter();

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
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

    fetchData();
  }, [username]);

  const theme = {
    light: ["#fff8dc", "#f4a460", "#d35400", "#8b4513", "#3e2723"],
    dark: ["#1e293b", "#38bdf8", "#3498db", "#2c3e50", "#1a1a2e"],
  };

  const colorScheme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <section id="github" className="py-12">
      {loading ? (
        <div className="flex justify-center p-4">
          <div className="animate-pulse flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-3 h-3 bg-muted rounded-sm"></div>
            ))}
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No activity data found
        </div>
      ) : (
        <>
          <SectionHeading
            subHeading={t("GitHub.subTitle")}
            heading={t("GitHub.title")}
          />
          <FadeIn delay={0.2}>
            <div className="border border-border/50 p-4 sm:p-6 rounded-xl bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">
                  {resolvedTheme === "dark" ? (
                    <Snowflake className="w-6 h-6 text-primary" />
                  ) : (
                    <Leaf className="w-6 h-6 text-primary" />
                  )}
                </span>
                <h3 className="text-lg font-bold">
                  {t("GitHub.activityTitle")}
                </h3>
              </div>

              <div className="overflow-x-auto pb-2 relative">
                <ActivityCalendar
                  data={data}
                  theme={theme}
                  colorScheme={colorScheme}
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
                  className="z-50 shadow-md rounded-md! px-3! py-2! text-xs! font-medium!"
                  style={{
                    backgroundColor: "var(--popover)",
                    color: "var(--popover-foreground)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
            </div>
          </FadeIn>
        </>
      )}
    </section>
  );
}
