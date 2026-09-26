"use client";

import PixelIcon, { PixelIconName } from "@/components/pixel/PixelIcon";
import { playSound } from "@/lib/pixel/sound";
import { cn, formatDateTime } from "@/lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { CSSProperties, useEffect, useState } from "react";

interface BadgeTier {
  name: string;
  minCount: number;
  icon: PixelIconName;
  color: string;
}

const AUTUMN_TIERS: BadgeTier[] = [
  { name: "FallenLeaf", minCount: 0, icon: "leaf", color: "#4d7c0f" },
  { name: "Amber", minCount: 100, icon: "sun", color: "#b45309" },
  { name: "HarvestWind", minCount: 500, icon: "wind", color: "#c2410c" },
  { name: "GoldenOak", minCount: 1000, icon: "tree", color: "#a16207" },
  { name: "CrimsonForest", minCount: 2500, icon: "trees", color: "#b91c1c" },
  { name: "AutumnStorm", minCount: 5000, icon: "storm", color: "#7e22ce" },
  { name: "Phoenix", minCount: 10000, icon: "flame", color: "#ea580c" },
  { name: "SeasonLord", minCount: 25000, icon: "crown", color: "#d97706" },
];

const WINTER_TIERS: BadgeTier[] = [
  { name: "FirstFrost", minCount: 0, icon: "snowflake", color: "#22d3ee" },
  { name: "FrozenTrail", minCount: 100, icon: "wind", color: "#94a3b8" },
  { name: "Blizzard", minCount: 500, icon: "cloudSnow", color: "#38bdf8" },
  { name: "IceCrystal", minCount: 1000, icon: "gem", color: "#818cf8" },
  { name: "Aurora", minCount: 2500, icon: "sparkles", color: "#34d399" },
  { name: "Glacier", minCount: 5000, icon: "mountain", color: "#3b82f6" },
  { name: "PolarStar", minCount: 10000, icon: "star", color: "#c7d2fe" },
  { name: "EternalWinter", minCount: 25000, icon: "crown", color: "#93c5fd" },
];

const XP_CELLS = 16;
const CONFETTI = 28;

function tierIndex(count: number, tiers: BadgeTier[]) {
  let index = 0;
  tiers.forEach((tier, i) => {
    if (count >= tier.minCount) index = i;
  });
  return index;
}

function progressToNext(count: number, tiers: BadgeTier[]) {
  const index = tierIndex(count, tiers);
  const next = tiers[index + 1];
  if (!next) return 1;
  const tier = tiers[index];
  return Math.min(1, (count - tier.minCount) / (next.minCount - tier.minCount));
}

const vars = (values: Record<string, string | number>) =>
  values as CSSProperties;

function XpBar({ progress, color }: { progress: number; color: string }) {
  const filled = Math.round(progress * XP_CELLS);
  return (
    <span className="flex gap-[2px] bg-px-ink p-[2px]" aria-hidden="true">
      {Array.from({ length: XP_CELLS }, (_, i) => (
        <span
          key={i}
          className="badge-xp-cell h-2.5 w-2"
          style={{
            backgroundColor: i < filled ? color : "var(--slot)",
            ...vars({ "--i": i }),
          }}
        />
      ))}
    </span>
  );
}

function BadgeFace({
  tiers,
  count,
  locale,
  label,
  tierNames,
  className,
}: {
  tiers: BadgeTier[];
  count: number;
  locale: string;
  label: string;
  tierNames: Record<string, string>;
  className?: string;
}) {
  const tier = tiers[tierIndex(count, tiers)];
  return (
    <span className={cn("items-center gap-3.5", className)}>
      <span
        className="badge-idle relative flex h-12 w-12 shrink-0 items-center justify-center pixel-slot"
        style={{ color: tier.color }}
      >
        <PixelIcon name={tier.icon} className="h-7 w-7" />
        <PixelIcon
          name="sparkle"
          className="badge-twinkle absolute -right-1.5 -top-1.5 h-3 w-3 text-gold"
        />
      </span>
      <span className="flex min-w-0 flex-col items-start gap-1.5 text-left">
        <span className="flex items-baseline gap-2">
          <span className="font-pixel text-xl leading-none font-bold">
            {count.toLocaleString(locale)}
          </span>
          <span className="font-pixel text-xs tracking-wider text-muted-foreground uppercase">
            {label}
          </span>
        </span>
        <span
          className="font-pixel text-base leading-none font-semibold"
          style={{ color: tier.color }}
        >
          {tierNames[tier.name] || tier.name}
        </span>
        <XpBar progress={progressToNext(count, tiers)} color={tier.color} />
      </span>
    </span>
  );
}

interface VisitorMilestone {
  id: string;
  count: number;
  reachedAt: string;
}

interface VisitorBadgeClientProps {
  count: number;
  label: string;
  milestones?: VisitorMilestone[];
  tierNames: Record<string, string>;
  locale: string;
  milestonesTitle: string;
  lockedLabel: string;
}

export default function VisitorBadgeClient({
  count,
  label,
  milestones = [],
  tierNames,
  locale,
  milestonesTitle,
  lockedLabel,
}: VisitorBadgeClientProps) {
  const t = useTranslations("Footer");
  const tCommon = useTranslations("Common");
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [burst, setBurst] = useState(0);

  const setOpen = (open: boolean) => {
    setIsOpen(open);
    playSound(open ? "open" : "close");
  };

  // The About section's visitor stat scrolls here and celebrates.
  useEffect(() => {
    const handleTrigger = () => {
      setIsOpen(true);
      setBurst((n) => n + 1);
      playSound("fanfare");
    };
    window.addEventListener("trigger-visitor-badge", handleTrigger);
    return () =>
      window.removeEventListener("trigger-visitor-badge", handleTrigger);
  }, []);

  // The list only renders on the client (the popover mounts on open), so it
  // can follow the theme directly; the face renders both and lets CSS pick.
  const tiers = resolvedTheme === "dark" ? WINTER_TIERS : AUTUMN_TIERS;
  const current = tierIndex(count, tiers);
  const unlocked = tiers.filter((tier) => count >= tier.minCount).length;
  const next = tiers[current + 1];
  const reachedAt = (tier: BadgeTier) =>
    milestones.find((m) => tierIndex(m.count, tiers) === tiers.indexOf(tier))
      ?.reachedAt;

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <div className="relative p-1">
        <PopoverPrimitive.Trigger
          className="group pixel-panel relative flex items-center gap-4 px-4 py-3 transition-transform duration-100 hover:-translate-y-0.5 data-[state=open]:translate-y-0.5"
          aria-label={milestonesTitle}
        >
          <BadgeFace
            tiers={AUTUMN_TIERS}
            count={count}
            locale={locale}
            label={label}
            tierNames={tierNames}
            className="flex dark:hidden"
          />
          <BadgeFace
            tiers={WINTER_TIERS}
            count={count}
            locale={locale}
            label={label}
            tierNames={tierNames}
            className="hidden dark:flex"
          />
          <PixelIcon
            name="caretDown"
            className="h-1.5 w-3 transition-transform duration-150 group-data-[state=open]:rotate-180"
          />
        </PopoverPrimitive.Trigger>

        {burst > 0 && (
          <span
            key={burst}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2"
          >
            {Array.from({ length: CONFETTI }, (_, i) => {
              const angle = (i / CONFETTI) * Math.PI * 2;
              const reach = 70 + ((i * 37) % 60);
              const colors = tiers.map((tier) => tier.color);
              return (
                <span
                  key={i}
                  className="badge-confetti absolute h-2 w-2"
                  style={{
                    backgroundColor: colors[i % colors.length],
                    ...vars({
                      "--x": `${Math.round(Math.cos(angle) * reach)}px`,
                      "--y": `${Math.round(Math.sin(angle) * reach - 30)}px`,
                      "--d": `${(i % 5) * 30}ms`,
                    }),
                  }}
                />
              );
            })}
          </span>
        )}
      </div>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="top"
          align="center"
          sideOffset={18}
          collisionPadding={12}
          tabIndex={-1}
          // Focus the log itself rather than ringing the close button.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }}
          onWheel={(event) => event.stopPropagation()}
          className="badge-log pixel-panel z-50 w-[min(24rem,calc(100vw-2rem))] outline-none"
        >
          <div className="flex items-center gap-3 border-b-4 border-px-ink px-4 py-3">
            <PixelIcon name="trophy" className="h-5 w-5 text-gold" />
            <span className="flex-1 font-pixel text-lg font-bold">
              {milestonesTitle}
            </span>
            <span className="font-pixel text-sm text-muted-foreground">
              {unlocked}/{tiers.length}
            </span>
            <PopoverPrimitive.Close
              className="pixel-button pixel-button-sm pixel-button-icon h-8 w-8"
              aria-label={tCommon("close")}
            >
              <PixelIcon name="close" className="h-3 w-3" />
            </PopoverPrimitive.Close>
          </div>

          <ol
            data-lenis-prevent
            className="custom-scrollbar max-h-[340px] overflow-y-auto p-2"
            style={vars({ "--n": tiers.length })}
          >
            {tiers.map((tier, i) => {
              const isUnlocked = count >= tier.minCount;
              const date = reachedAt(tier);
              return (
                <li
                  key={tier.name}
                  className={cn(
                    "badge-row flex items-center gap-3 px-2 py-2",
                    i === current && "badge-current bg-slot-active",
                  )}
                  style={vars({ "--i": i })}
                >
                  <span
                    className={cn(
                      "relative flex h-10 w-10 shrink-0 items-center justify-center pixel-slot",
                      !isUnlocked && "opacity-60",
                    )}
                  >
                    {isUnlocked ? (
                      <span className="badge-pop" style={{ color: tier.color }}>
                        <PixelIcon name={tier.icon} className="h-6 w-6" />
                      </span>
                    ) : (
                      <PixelIcon
                        name="lock"
                        className="badge-lock h-5 w-5 text-muted-foreground"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className="truncate font-pixel text-base font-semibold"
                        style={isUnlocked ? { color: tier.color } : undefined}
                      >
                        {tierNames[tier.name] || tier.name}
                      </span>
                      <span className="shrink-0 font-pixel text-sm text-muted-foreground">
                        {tier.minCount.toLocaleString(locale)}+
                      </span>
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {isUnlocked
                        ? date
                          ? formatDateTime(date, locale)
                          : t("unlocked")
                        : lockedLabel}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>

          {next && (
            <div className="flex items-center justify-between gap-3 border-t-4 border-px-ink px-4 py-3">
              <span className="font-pixel text-sm">
                {tierNames[next.name] || next.name}
                <span className="block text-xs text-muted-foreground">
                  {t("remaining", {
                    count: (next.minCount - count).toLocaleString(locale),
                  })}
                </span>
              </span>
              <XpBar
                progress={progressToNext(count, tiers)}
                color={tiers[current].color}
              />
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
