"use client";

import PixelIcon from "@/components/pixel/PixelIcon";
import { useSeasonTransition } from "@/components/pixel/SeasonTransition";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { MouseEvent } from "react";

type Season = "autumn" | "winter";

export default function SeasonSwitch({ className }: { className?: string }) {
  const t = useTranslations("Common.season");
  const { resolvedTheme } = useTheme();
  const { switchSeason } = useSeasonTransition();
  const mounted = useMounted();
  const current: Season | null = mounted
    ? resolvedTheme === "dark"
      ? "winter"
      : "autumn"
    : null;

  const choose = (season: Season, event: MouseEvent<HTMLButtonElement>) => {
    if (!current || season === current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    switchSeason({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const options: { season: Season; icon: "leaf" | "snowflake" }[] = [
    { season: "autumn", icon: "leaf" },
    { season: "winter", icon: "snowflake" },
  ];

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cn("pixel-frame flex bg-slot", className)}
    >
      {options.map(({ season, icon }) => {
        const active = current === season;
        return (
          <button
            key={season}
            type="button"
            aria-pressed={active}
            onClick={(event) => choose(season, event)}
            className={cn(
              "flex h-11 items-center gap-2 px-3.5 font-pixel text-base font-semibold transition-colors duration-100",
              active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-primary/20",
            )}
          >
            <PixelIcon name={icon} className="h-3.5 w-3.5" />
            {t(season)}
          </button>
        );
      })}
    </div>
  );
}
