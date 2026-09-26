"use client";

import PixelIcon from "@/components/pixel/PixelIcon";
import { Achievement, ACHIEVEMENT_EVENT } from "@/lib/pixel/achievements";
import { playSound } from "@/lib/pixel/sound";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const SHOW_MS = 4600;
const EXIT_MS = 320;

/** Shows queued achievements one at a time, bottom-left, like a console. */
export default function AchievementHost() {
  const t = useTranslations("Common");
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [leaving, setLeaving] = useState(false);
  const current = queue[0];

  useEffect(() => {
    const onAchievement = (event: Event) => {
      const { detail } = event as CustomEvent<Achievement>;
      setQueue((items) =>
        items.some((item) => item.id === detail.id) ? items : [...items, detail],
      );
    };
    window.addEventListener(ACHIEVEMENT_EVENT, onAchievement);
    return () => window.removeEventListener(ACHIEVEMENT_EVENT, onAchievement);
  }, []);

  useEffect(() => {
    if (!current) return;
    playSound("fanfare");
    const leave = setTimeout(() => setLeaving(true), SHOW_MS);
    const next = setTimeout(() => {
      setLeaving(false);
      setQueue((items) => items.slice(1));
    }, SHOW_MS + EXIT_MS);
    return () => {
      clearTimeout(leave);
      clearTimeout(next);
    };
  }, [current]);

  if (!current) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-4 z-[70] sm:bottom-6 sm:left-6"
    >
      <div
        key={current.id}
        className={cn(
          "pixel-panel flex max-w-[21rem] items-center gap-3.5 p-3 pr-4",
          leaving ? "achievement-out" : "achievement-in",
        )}
      >
        <div className="achievement-icon relative flex h-12 w-12 shrink-0 items-center justify-center bg-gold text-px-ink pixel-frame-sm">
          <PixelIcon name={current.icon ?? "trophy"} className="h-7 w-7" />
          <PixelIcon
            name="sparkle"
            className="achievement-spark absolute -right-2 -top-2 h-3 w-3 text-gold"
          />
        </div>
        <div className="min-w-0">
          <p className="font-pixel text-xs tracking-wider text-ember uppercase">
            {t("achievementUnlocked")}
          </p>
          <p className="font-pixel text-lg leading-tight font-bold">
            {current.title}
          </p>
          <p className="text-sm leading-snug text-muted-foreground">
            {current.description}
          </p>
        </div>
      </div>
    </div>
  );
}
