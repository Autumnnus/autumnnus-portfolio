"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import FadeIn from "../common/FadeIn";

interface GitHubCalendarProps {
  username?: string;
}

import { useLanguage } from "@/components/providers/LanguageContext";
import { Leaf, Snowflake } from "lucide-react";

export default function GitHubCalendar({
  username = "Autumnnus",
}: GitHubCalendarProps) {
  const { resolvedTheme } = useTheme();
  const { content } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ... (keeping useEffect the same)

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

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-pulse flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-3 h-3 bg-muted rounded-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 sm:p-8">
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
              {content.about.githubActivityTitle}
            </h3>
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
    </div>
  );
}
