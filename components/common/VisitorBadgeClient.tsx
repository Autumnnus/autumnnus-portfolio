"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateTime } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CloudLightning,
  CloudSnow,
  Crown,
  Flame,
  Gem,
  Leaf,
  type LucideIcon,
  Mountain,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  TreeDeciduous,
  Trees,
  Trophy,
  Users,
  Wind,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

interface BadgeTier {
  name: string;
  icon: LucideIcon;
  minCount: number;
  gradient: string;
  glowColor: string;
  borderColor: string;
  textColor: string;
  particleColor: string;
  bgColor: string;
  iconBg: string;
}

const AUTUMN_TIERS: BadgeTier[] = [
  {
    name: "FallenLeaf",
    icon: Leaf,
    minCount: 0,
    gradient: "linear-gradient(135deg, #65a30d, #4d7c0f, #365314)", // Olive Green
    glowColor: "rgba(101, 163, 13, 0.4)",
    borderColor: "#4d7c0f",
    textColor: "#365314",
    particleColor: "#84cc16",
    bgColor: "rgba(101, 163, 13, 0.15)",
    iconBg: "rgba(101, 163, 13, 0.25)",
  },
  {
    name: "Amber",
    icon: Sun,
    minCount: 100,
    gradient: "linear-gradient(135deg, #d97706, #b45309, #92400e)", // Honey/Amber
    glowColor: "rgba(217, 119, 6, 0.5)",
    borderColor: "#b45309",
    textColor: "#78350f",
    particleColor: "#f59e0b",
    bgColor: "rgba(217, 119, 6, 0.15)",
    iconBg: "rgba(217, 119, 6, 0.25)",
  },
  {
    name: "HarvestWind",
    icon: Wind,
    minCount: 500,
    gradient: "linear-gradient(135deg, #ea580c, #c2410c, #9a3412)", // Burnt Orange/Cinnamon
    glowColor: "rgba(234, 88, 12, 0.5)",
    borderColor: "#c2410c",
    textColor: "#7c2d12",
    particleColor: "#fb923c",
    bgColor: "rgba(234, 88, 12, 0.15)",
    iconBg: "rgba(234, 88, 12, 0.25)",
  },
  {
    name: "GoldenOak",
    icon: TreeDeciduous,
    minCount: 1000,
    gradient: "linear-gradient(135deg, #ca8a04, #a16207, #854d0e)", // Bronze/Goldenrod
    glowColor: "rgba(202, 138, 4, 0.5)",
    borderColor: "#a16207",
    textColor: "#713f12",
    particleColor: "#facc15",
    bgColor: "rgba(202, 138, 4, 0.15)",
    iconBg: "rgba(202, 138, 4, 0.25)",
  },
  {
    name: "CrimsonForest",
    icon: Trees,
    minCount: 2500,
    gradient: "linear-gradient(135deg, #dc2626, #b91c1c, #991b1b)", // Crimson/Red
    glowColor: "rgba(220, 38, 38, 0.5)",
    borderColor: "#b91c1c",
    textColor: "#7f1d1d",
    particleColor: "#f87171",
    bgColor: "rgba(220, 38, 38, 0.15)",
    iconBg: "rgba(220, 38, 38, 0.25)",
  },
  {
    name: "AutumnStorm",
    icon: CloudLightning,
    minCount: 5000,
    gradient: "linear-gradient(135deg, #9333ea, #7e22ce, #6b21a8)", // Purple/Plum
    glowColor: "rgba(147, 51, 234, 0.5)",
    borderColor: "#7e22ce",
    textColor: "#581c87",
    particleColor: "#c084fc",
    bgColor: "rgba(147, 51, 234, 0.15)",
    iconBg: "rgba(147, 51, 234, 0.25)",
  },
  {
    name: "Phoenix",
    icon: Flame,
    minCount: 10000,
    gradient: "linear-gradient(135deg, #ef4444, #ea580c, #b91c1c)", // Fiery Red-Orange
    glowColor: "rgba(239, 68, 68, 0.6)",
    borderColor: "#ea580c",
    textColor: "#7c2d12",
    particleColor: "#fdba74",
    bgColor: "rgba(239, 68, 68, 0.15)",
    iconBg: "rgba(239, 68, 68, 0.25)",
  },
  {
    name: "SeasonLord",
    icon: Crown,
    minCount: 25000,
    gradient: "linear-gradient(135deg, #fbbf24, #d97706, #b45309)", // Royal Gold
    glowColor: "rgba(251, 191, 36, 0.7)",
    borderColor: "#d97706",
    textColor: "#78350f",
    particleColor: "#fde047",
    bgColor: "rgba(251, 191, 36, 0.18)",
    iconBg: "rgba(251, 191, 36, 0.3)",
  },
];

const WINTER_TIERS: BadgeTier[] = [
  {
    name: "FirstFrost",
    icon: Snowflake,
    minCount: 0,
    gradient: "linear-gradient(135deg, #67e8f9, #22d3ee, #06b6d4)",
    glowColor: "rgba(103, 232, 249, 0.4)",
    borderColor: "#22d3ee",
    textColor: "#cffafe",
    particleColor: "#67e8f9",
    bgColor: "rgba(34, 211, 238, 0.08)",
    iconBg: "rgba(34, 211, 238, 0.15)",
  },
  {
    name: "FrozenTrail",
    icon: Wind,
    minCount: 100,
    gradient: "linear-gradient(135deg, #64748b, #475569, #334155)",
    glowColor: "rgba(100, 116, 139, 0.5)",
    borderColor: "#94a3b8",
    textColor: "#e2e8f0",
    particleColor: "#94a3b8",
    bgColor: "rgba(100, 116, 139, 0.08)",
    iconBg: "rgba(100, 116, 139, 0.15)",
  },
  {
    name: "Blizzard",
    icon: CloudSnow,
    minCount: 500,
    gradient: "linear-gradient(135deg, #38bdf8, #0ea5e9, #0284c7)",
    glowColor: "rgba(56, 189, 248, 0.5)",
    borderColor: "#38bdf8",
    textColor: "#bae6fd",
    particleColor: "#7dd3fc",
    bgColor: "rgba(56, 189, 248, 0.08)",
    iconBg: "rgba(56, 189, 248, 0.15)",
  },
  {
    name: "IceCrystal",
    icon: Gem,
    minCount: 1000,
    gradient: "linear-gradient(135deg, #818cf8, #6366f1, #4f46e5)",
    glowColor: "rgba(129, 140, 248, 0.5)",
    borderColor: "#818cf8",
    textColor: "#e0e7ff",
    particleColor: "#a5b4fc",
    bgColor: "rgba(129, 140, 248, 0.08)",
    iconBg: "rgba(129, 140, 248, 0.15)",
  },
  {
    name: "Aurora",
    icon: Sparkles,
    minCount: 2500,
    gradient: "linear-gradient(135deg, #34d399, #2dd4bf, #22d3ee)",
    glowColor: "rgba(52, 211, 153, 0.5)",
    borderColor: "#34d399",
    textColor: "#a7f3d0",
    particleColor: "#6ee7b7",
    bgColor: "rgba(52, 211, 153, 0.08)",
    iconBg: "rgba(52, 211, 153, 0.15)",
  },
  {
    name: "Glacier",
    icon: Mountain,
    minCount: 5000,
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8)",
    glowColor: "rgba(59, 130, 246, 0.5)",
    borderColor: "#3b82f6",
    textColor: "#bfdbfe",
    particleColor: "#60a5fa",
    bgColor: "rgba(59, 130, 246, 0.08)",
    iconBg: "rgba(59, 130, 246, 0.15)",
  },
  {
    name: "PolarStar",
    icon: Star,
    minCount: 10000,
    gradient: "linear-gradient(135deg, #e0e7ff, #c7d2fe, #a5b4fc)",
    glowColor: "rgba(224, 231, 255, 0.6)",
    borderColor: "#c7d2fe",
    textColor: "#eef2ff",
    particleColor: "#e0e7ff",
    bgColor: "rgba(199, 210, 254, 0.1)",
    iconBg: "rgba(199, 210, 254, 0.2)",
  },
  {
    name: "EternalWinter",
    icon: Crown,
    minCount: 25000,
    gradient: "linear-gradient(135deg, #93c5fd, #60a5fa, #3b82f6, #1e40af)",
    glowColor: "rgba(147, 197, 253, 0.7)",
    borderColor: "#93c5fd",
    textColor: "#dbeafe",
    particleColor: "#bfdbfe",
    bgColor: "rgba(147, 197, 253, 0.12)",
    iconBg: "rgba(147, 197, 253, 0.25)",
  },
];

function getTier(count: number, tiers: BadgeTier[]): BadgeTier {
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (count >= tiers[i].minCount) return tiers[i];
  }
  return tiers[0];
}

function getProgress(count: number, tiers: BadgeTier[]): number {
  const tier = getTier(count, tiers);
  const tierIndex = tiers.indexOf(tier);
  const nextTier = tiers[tierIndex + 1];

  if (!nextTier) return 100;

  const range = nextTier.minCount - tier.minCount;
  const progress = count - tier.minCount;
  return Math.min((progress / range) * 100, 100);
}

interface ParticleData {
  radius: number;
  size: number;
  duration: number;
  repeatDelay: number;
}

function Particle({
  color,
  delay,
  index,
  data,
}: {
  color: string;
  delay: number;
  index: number;
  data: ParticleData;
}) {
  const angle = (index * 360) / 8;
  const x = Math.cos((angle * Math.PI) / 180) * data.radius;
  const y = Math.sin((angle * Math.PI) / 180) * data.radius;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: data.size,
        height: data.size,
        backgroundColor: color,
        left: "50%",
        top: "50%",
      }}
      initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        x: [0, x * 0.5, x],
        y: [0, y * 0.5, y],
        scale: [0, 1.5, 0],
      }}
      transition={{
        duration: data.duration,
        delay,
        repeat: Infinity,
        repeatDelay: data.repeatDelay,
        ease: "easeOut",
      }}
    />
  );
}

interface SparkleData {
  left: string;
  top: string;
  repeatDelay: number;
}

function FloatingSparkle({
  color,
  delay,
  data,
}: {
  color: string;
  delay: number;
  data: SparkleData;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: 6,
        height: 6,
        left: data.left,
        top: data.top,
      }}
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        rotate: [0, 180],
      }}
      transition={{
        duration: 1.5,
        delay,
        repeat: Infinity,
        repeatDelay: data.repeatDelay,
      }}
    >
      <svg viewBox="0 0 24 24" fill={color}>
        <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41Z" />
      </svg>
    </motion.div>
  );
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function ThematicExplosion({
  tier,
  isWinter,
}: {
  tier: BadgeTier;
  isWinter: boolean;
}) {
  const particles = useMemo(() => Array.from({ length: 25 }), []);
  const TierIcon = tier.icon;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md z-50">
      {/* Core Explosion Glow */}
      <motion.div
        className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{ background: tier.gradient, width: 120, height: 120 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1.5, 2] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {particles.map((_, i) => {
        const angle = seededRandom(i) * Math.PI * 2;
        const velocity = 60 + seededRandom(i + 1) * 120;
        const randomX = Math.cos(angle) * velocity;
        const randomY = Math.sin(angle) * velocity + 40;

        const randomScale = 0.5 + seededRandom(i + 2) * 1;
        const initialRotate = seededRandom(i + 3) * 360;
        const rotateAmount =
          (seededRandom(i + 4) > 0.5 ? 1 : -1) * (180 + seededRandom(i) * 180);

        const particleType = i % 3;

        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/4 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
            style={{ color: tier.particleColor }}
            initial={{
              opacity: 0,
              x: 0,
              y: 0,
              scale: 0,
              rotate: initialRotate,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: randomX,
              y: randomY,
              scale: [0, randomScale, randomScale * 0.8],
              rotate: initialRotate + rotateAmount,
            }}
            transition={{
              duration: 1.5 + seededRandom(i) * 1,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            {particleType === 0 ? (
              <TierIcon size={12 + seededRandom(i) * 8} />
            ) : particleType === 1 ? (
              isWinter ? (
                <Snowflake size={10 + seededRandom(i) * 8} />
              ) : (
                <Leaf size={10 + seededRandom(i) * 8} />
              )
            ) : (
              <div
                className="rounded-full blur-[1px]"
                style={{
                  backgroundColor: tier.particleColor,
                  width: 6 + seededRandom(i) * 4,
                  height: 6 + seededRandom(i) * 4,
                  boxShadow: `0 0 ${10 + seededRandom(i) * 10}px ${tier.glowColor}`,
                }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
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
  externalOpen?: boolean;
}

export default function VisitorBadgeClient({
  count,
  label,
  milestones = [],
  tierNames,
  locale,
  milestonesTitle,
  lockedLabel,
  externalOpen,
}: VisitorBadgeClientProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (externalOpen) {
      requestAnimationFrame(() => setIsOpen(true));
    }
  }, [externalOpen]);

  useEffect(() => {
    const handleTrigger = () => {
      setIsOpen(true);
      setShowExplosion(true);
      setTimeout(() => setShowExplosion(false), 3000);
    };

    window.addEventListener("trigger-visitor-badge", handleTrigger);
    return () =>
      window.removeEventListener("trigger-visitor-badge", handleTrigger);
  }, []);

  const activeTiers =
    mounted && resolvedTheme === "dark" ? WINTER_TIERS : AUTUMN_TIERS;

  const tier = useMemo(() => getTier(count, activeTiers), [count, activeTiers]);
  const progress = useMemo(
    () => getProgress(count, activeTiers),
    [count, activeTiers],
  );
  const TierIcon = tier.icon;
  const tierIndex = activeTiers.indexOf(tier);
  const isHighTier = tierIndex >= 4;
  const particleCount = Math.min(tierIndex + 3, 8);

  const particleDataList = useMemo<ParticleData[]>(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        radius: 30 + seededRandom(i + 1) * 20,
        size: 3 + seededRandom(i + 10) * 3,
        duration: 2 + seededRandom(i + 20) * 1.5,
        repeatDelay: 1 + seededRandom(i + 30) * 2,
      })),
    [],
  );

  const sparkleDataList = useMemo<SparkleData[]>(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        left: `${20 + seededRandom(i + 40) * 60}%`,
        top: `${10 + seededRandom(i + 50) * 80}%`,
        repeatDelay: 2 + seededRandom(i + 60) * 3,
      })),
    [],
  );

  const BadgeContent = (
    <motion.button
      type="button"
      className="relative cursor-pointer select-none outline-none"
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {particleDataList.slice(0, particleCount).map((data, i) => (
        <Particle
          key={`p-${i}`}
          color={tier.particleColor}
          delay={i * 0.3}
          index={i}
          data={data}
        />
      ))}

      {isHighTier &&
        sparkleDataList.map((data, i) => (
          <FloatingSparkle
            key={`s-${i}`}
            color={tier.particleColor}
            delay={i * 0.8}
            data={data}
          />
        ))}

      {/* Outer Glow Ring */}
      <motion.div
        className="absolute -inset-1 rounded-2xl opacity-60 blur-md pointer-events-none"
        style={{ background: tier.gradient }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="relative overflow-hidden rounded-2xl w-full max-w-[550px]"
        style={{
          background: tier.bgColor,
          border: `2px solid ${tier.borderColor}`,
          boxShadow: `0 0 20px ${tier.glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)`,
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "easeInOut",
          }}
        />

        <div className="relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 w-full">
          <motion.div
            className="relative flex items-center justify-center rounded-xl p-1.5 sm:p-2"
            style={{ backgroundColor: tier.iconBg }}
            animate={
              isHighTier
                ? {
                    boxShadow: [
                      `0 0 8px ${tier.glowColor}`,
                      `0 0 16px ${tier.glowColor}`,
                      `0 0 8px ${tier.glowColor}`,
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={
                isHighTier
                  ? { rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }
                  : { scale: [1, 1.05, 1] }
              }
              transition={{
                duration: isHighTier ? 2 : 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <TierIcon
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                style={{ color: tier.borderColor }}
                suppressHydrationWarning
              />
            </motion.div>
          </motion.div>

          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs sm:text-sm leading-none font-bold"
                style={{ color: tier.textColor }}
              >
                {count.toLocaleString(locale)}
              </span>
              <Users
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50"
                style={{ color: tier.textColor }}
                suppressHydrationWarning
              />
            </div>
            <span
              className="text-[8px] sm:text-[9px] font-pixel uppercase tracking-widest opacity-80 leading-none truncate"
              style={{ color: tier.borderColor }}
            >
              {label}
            </span>
          </div>

          <motion.div
            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: `${tier.borderColor}22`,
              border: `1px solid ${tier.borderColor}44`,
            }}
            animate={
              isHighTier
                ? {
                    borderColor: [
                      `${tier.borderColor}44`,
                      `${tier.borderColor}88`,
                      `${tier.borderColor}44`,
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span
              className="text-[7px] sm:text-[8px] font-pixel font-bold uppercase tracking-wider"
              style={{ color: tier.borderColor }}
            >
              {tierNames[tier.name] || tier.name}
            </span>
          </motion.div>
        </div>

        {progress < 100 && (
          <div
            className="relative h-[3px] w-full"
            style={{ backgroundColor: `${tier.borderColor}15` }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: tier.gradient }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                width: "30%",
              }}
              animate={{ x: ["-100%", "400%"] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
              }}
            />
          </div>
        )}

        {progress >= 100 && (
          <motion.div
            className="h-[3px] w-full"
            style={{
              background:
                "linear-gradient(90deg, #fbbf24, #f97316, #ef4444, #ec4899, #a855f7, #6366f1, #3b82f6, #fbbf24)",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        )}
      </motion.div>
    </motion.button>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{BadgeContent}</PopoverTrigger>

      <PopoverContent
        className="p-0 overflow-hidden border-2 bg-card/95 backdrop-blur-sm shadow-2xl z-50 pointer-events-auto"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        sideOffset={10}
        onWheel={(e) => e.stopPropagation()}
      >
        <AnimatePresence>
          {showExplosion && (
            <ThematicExplosion
              tier={tier}
              isWinter={resolvedTheme === "dark"}
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="relative flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <span className="font-pixel text-xs tracking-wider font-bold">
                {milestonesTitle}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-muted/50 transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>

          {/* List */}
          <div
            className="max-h-[350px] overflow-y-auto p-2 space-y-1 custom-scrollbar scroll-smooth"
            onWheel={(e) => e.stopPropagation()}
          >
            {activeTiers.map((tierItem, i) => {
              const reachedMilestone = milestones.find(
                (m) => getTier(m.count, activeTiers).name === tierItem.name,
              );
              const isUnlocked = !!reachedMilestone;
              const TierIcon = tierItem.icon;

              return (
                <motion.div
                  key={tierItem.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isUnlocked ? 1 : 0.5, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors group ${
                    isUnlocked ? "hover:bg-muted/30" : "grayscale opacity-50"
                  }`}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm border border-border/50 relative overflow-hidden"
                    style={{
                      background: isUnlocked ? tierItem.bgColor : "bg-muted",
                      borderColor: isUnlocked
                        ? tierItem.borderColor
                        : "currentColor",
                    }}
                  >
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-background/50 z-10" />
                    )}
                    <TierIcon
                      className="w-4 h-4 z-20"
                      style={{
                        color: isUnlocked
                          ? tierItem.textColor
                          : "muted-foreground",
                      }}
                    />
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="font-bold text-sm"
                          style={{
                            color: isUnlocked
                              ? tierItem.borderColor
                              : "muted-foreground",
                          }}
                        >
                          {tierItem.minCount > 0
                            ? tierItem.minCount.toLocaleString()
                            : "0"}{" "}
                          +
                        </span>
                      </div>
                      <span
                        className="text-[9px] font-pixel text-muted-foreground uppercase opacity-80 truncate leading-snug"
                        title={tierNames[tierItem.name] || tierItem.name}
                      >
                        {tierNames[tierItem.name] || tierItem.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      {isUnlocked && reachedMilestone ? (
                        <>
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="text-[10px]">
                            {formatDateTime(reachedMilestone.reachedAt, locale)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] opacity-50 flex items-center gap-1">
                          {lockedLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer gradient line */}
          <div className="h-1 w-full bg-linear-to-r from-transparent via-primary/50 to-transparent" />
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
