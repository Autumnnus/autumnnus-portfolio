"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import FadeIn from "../common/FadeIn";

interface GitHubCalendarProps {
  username?: string;
}

import { Leaf, Snowflake } from "lucide-react";
import { useTranslations } from "next-intl";
import SectionHeading from "../common/SectionHeading";

export default function GitHubCalendar({
  username = "Autumnnus",
}: GitHubCalendarProps) {
  const t = useTranslations("GitHub");
  const { resolvedTheme } = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
          <SectionHeading subHeading={t("subTitle")} heading={t("title")} />
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
                <h3 className="text-lg font-bold">{t("activityTitle")}</h3>
              </div>

              <div className="overflow-x-auto pb-2">
                <ActivityCalendar
                  data={data}
                  theme={theme}
                  colorScheme={colorScheme}
                  blockSize={12}
                  blockMargin={4}
                  fontSize={12}
                  showWeekdayLabels
                />
              </div>
            </div>
          </FadeIn>
        </>
      )}
    </section>
  );
}
