import type { PixelIconName } from "@/components/pixel/PixelIcon";

/** Game-style "achievement unlocked" toasts, shown by AchievementHost. */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: PixelIconName;
}

export const ACHIEVEMENT_EVENT = "pixel-achievement";

export function showAchievement(achievement: Achievement) {
  window.dispatchEvent(
    new CustomEvent<Achievement>(ACHIEVEMENT_EVENT, { detail: achievement }),
  );
}
