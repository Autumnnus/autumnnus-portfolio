"use client";

import PixelIcon from "@/components/pixel/PixelIcon";
import { setSoundEnabled, useSoundEnabled } from "@/lib/pixel/sound";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function SoundToggle({ className }: { className?: string }) {
  const t = useTranslations("Common.sound");
  const enabled = useSoundEnabled();
  const label = enabled ? t("turnOff") : t("turnOn");

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      onClick={() => setSoundEnabled(!enabled)}
      className={cn(
        "pixel-button pixel-button-sm pixel-button-icon",
        enabled && "pixel-button-primary",
        className,
      )}
    >
      <PixelIcon name={enabled ? "speaker" : "speakerOff"} className="h-4 w-5" />
    </button>
  );
}
