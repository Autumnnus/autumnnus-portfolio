"use client";

import PixelIcon from "@/components/pixel/PixelIcon";
import { showAchievement } from "@/lib/pixel/achievements";
import { playSound, SoundName } from "@/lib/pixel/sound";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { SCENE_H, Season } from "./art";
import { HeroSceneEngine, HOTSPOTS, HotspotId, PokeResult } from "./engine";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export const INTRO_SEEN_KEY = "autumnnus:intro-seen";
const SECRETS_KEY = "autumnnus:scene-secrets";

const POKE_SOUND: Record<PokeResult, SoundName> = {
  tree: "rustle",
  cabin: "knock",
  sky: "twinkle",
  ground: "pop",
};

function readFound(): HotspotId[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(SECRETS_KEY) ?? "[]");
    return Array.isArray(stored)
      ? HOTSPOTS.filter((id) => stored.includes(id))
      : [];
  } catch {
    return [];
  }
}

interface Geometry {
  scale: number;
  offsetX: number;
}

interface Bubble {
  id: HotspotId;
  left: number;
  top: number;
  side: "left" | "right";
}

/**
 * Canvas host for the living landscape. The wrapper's CSS height is always a
 * whole multiple of the scene height (140/210/280px), which fixes the pixel
 * scale; the scene width then follows the wrapper so pixels stay square.
 * On top sits a thin DOM layer for the quest: a hint bubble that walks the
 * visitor to each hotspot, a progress counter and hover labels.
 */
export default function HeroScene({ label }: { label: string }) {
  const t = useTranslations("Hero.scene");
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HeroSceneEngine | null>(null);
  const geometryRef = useRef<Geometry>({ scale: 4, offsetX: 0 });
  const foundRef = useRef<HotspotId[]>([]);
  const hoverRef = useRef<HotspotId | null>(null);

  const { resolvedTheme } = useTheme();
  const season: Season | null = resolvedTheme
    ? resolvedTheme === "dark"
      ? "winter"
      : "autumn"
    : null;

  const [interactive, setInteractive] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [found, setFound] = useState<HotspotId[]>([]);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [hint, setHint] = useState<Bubble | null>(null);
  const [hover, setHover] = useState<Bubble | null>(null);

  const currentSeason = useEffectEvent(() => season);

  const handlePoke = useEffectEvent((kind: PokeResult) => {
    playSound(POKE_SOUND[kind]);
    if (kind === "cabin") setTimeout(() => playSound("meow"), 520);
    if (kind === "ground" || foundRef.current.includes(kind)) return;

    const next = [...foundRef.current, kind];
    foundRef.current = next;
    engineRef.current?.setFound(next);
    setFound(next);
    setHint(null);
    try {
      localStorage.setItem(SECRETS_KEY, JSON.stringify(next));
    } catch {
      // Private mode: progress lasts until reload.
    }
    if (next.length === HOTSPOTS.length) {
      setTimeout(
        () =>
          showAchievement({
            id: "scene-explorer",
            title: t("achievement.title"),
            description: t("achievement.description"),
            icon: "star",
          }),
        650,
      );
    } else {
      setTimeout(() => playSound("item"), 260);
    }
  });

  // Create the engine once the theme is known.
  const ready = season !== null;
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const initialSeason = currentSeason();
    if (!ready || !wrap || !canvas || !initialSeason) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const intro = !document.documentElement.dataset.introSeen;
    const engine = new HeroSceneEngine(canvas, {
      season: initialSeason,
      intro,
      reducedMotion,
      onPoke: (kind) => handlePoke(kind),
      onIntroEnd: () => setIntroDone(true),
    });
    engineRef.current = engine;

    const initialFound = readFound();
    foundRef.current = initialFound;
    engine.setFound(initialFound);
    setFound(initialFound);
    setInteractive(!reducedMotion);
    if (!intro || reducedMotion) setIntroDone(true);

    let visible = true;
    const sync = () => {
      if (visible && !document.hidden) engine.start();
      else engine.stop();
    };

    const measure = () => {
      const scale = Math.max(1, Math.round(wrap.clientHeight / SCENE_H));
      const width = Math.ceil(wrap.clientWidth / scale);
      canvas.style.width = `${width * scale}px`;
      canvas.style.height = `${SCENE_H * scale}px`;
      engine.resize(width);
      const next = { scale, offsetX: (wrap.clientWidth - width * scale) / 2 };
      geometryRef.current = next;
      setGeometry(next);
    };
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(wrap);

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    intersection.observe(wrap);
    document.addEventListener("visibilitychange", sync);

    const onPointerMove = (event: PointerEvent) => {
      engine.setPointer(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * 2 - 1,
      );
    };
    const onScroll = () => {
      // 0 at the top of the page, 1 once the scene has scrolled away.
      const bottom = wrap.getBoundingClientRect().bottom + window.scrollY;
      engine.setScroll(window.scrollY / Math.max(1, bottom));
    };
    let konami = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("input, textarea, [contenteditable='true']")
      )
        return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      konami = key === KONAMI[konami] ? konami + 1 : key === KONAMI[0] ? 1 : 0;
      if (konami === KONAMI.length) {
        konami = 0;
        engine.storm();
        playSound("fanfare");
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    onScroll();
    sync();

    return () => {
      engine.destroy();
      engineRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [ready]);

  useEffect(() => {
    if (season) engineRef.current?.setSeason(season);
  }, [season]);

  const questOpen = interactive && introDone;
  useEffect(() => {
    engineRef.current?.setHints(questOpen);
  }, [questOpen]);

  // Walk the visitor to the next undiscovered hotspot. The first hint comes
  // right after the intro; later ones give the last discovery a moment.
  const nextTarget = HOTSPOTS.find((id) => !found.includes(id));
  useEffect(() => {
    if (!questOpen || !nextTarget || !geometry) return;
    const show = setTimeout(
      () => {
        const rect = engineRef.current?.hotspot(nextTarget);
        if (!rect) return;
        const { scale, offsetX } = geometry;
        const side = nextTarget === "sky" ? "left" : "right";
        setHint({
          id: nextTarget,
          side,
          left: offsetX + (side === "right" ? rect.x + rect.w + 2 : rect.x - 2) * scale,
          top: (rect.y + rect.h * 0.3) * scale,
        });
      },
      found.length ? 1600 : 500,
    );
    return () => clearTimeout(show);
  }, [questOpen, nextTarget, geometry, found.length, season]);

  const toScene = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const { scale } = geometryRef.current;
    return {
      x: Math.floor((event.clientX - rect.left) / scale),
      y: Math.floor((event.clientY - rect.top) / scale),
    };
  };

  const updateHover = (x: number, y: number) => {
    const engine = engineRef.current;
    const id = questOpen ? (engine?.hitTest(x, y)?.id ?? null) : null;
    if (id === hoverRef.current) return;
    hoverRef.current = id;
    const rect = id ? engine?.hotspot(id) : null;
    if (!id || !rect) {
      setHover(null);
      return;
    }
    const { scale, offsetX } = geometryRef.current;
    setHover({
      id,
      side: "right",
      left: offsetX + (rect.x + rect.w / 2) * scale,
      top: rect.y * scale - 6,
    });
  };

  const hoverLabel = (id: HotspotId) =>
    id === "sky" ? t(season === "winter" ? "tooltip.moon" : "tooltip.sun") : t(`tooltip.${id}`);

  return (
    <div
      ref={wrapRef}
      className="relative h-[140px] overflow-hidden bg-card sm:h-[210px] lg:h-[280px]"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        data-pixel-clickable=""
        className="pixel-render absolute left-1/2 top-0 block -translate-x-1/2 touch-manipulation"
        onPointerDown={(event) => {
          const { x, y } = toScene(event);
          engineRef.current?.poke(x, y);
        }}
        onPointerMove={(event) => {
          const { x, y } = toScene(event);
          engineRef.current?.trail(x, y);
          updateHover(x, y);
        }}
        onPointerLeave={() => {
          hoverRef.current = null;
          setHover(null);
        }}
      />

      {questOpen && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="px-pop absolute left-2 top-2 flex items-center gap-1.5 bg-card/90 px-2 py-1 font-pixel text-[11px] tracking-wider uppercase pixel-frame-sm sm:left-3 sm:top-3 sm:text-xs"
            aria-label={t("secretsLabel", { found: found.length, total: HOTSPOTS.length })}
          >
            <span aria-hidden="true">{t("secrets")}</span>
            <span aria-hidden="true" className="flex gap-0.5">
              {HOTSPOTS.map((id, index) => (
                <PixelIcon
                  key={id}
                  name="star"
                  className={cn(
                    "h-3 w-3 sm:h-3.5 sm:w-3.5",
                    index < found.length
                      ? "scene-star-on text-gold"
                      : "text-muted-foreground/40",
                  )}
                />
              ))}
            </span>
          </div>

          {hint && !hover && (
            <div
              key={hint.id}
              className={cn(
                "px-pop absolute flex items-center gap-1",
                hint.side === "left" && "-translate-x-full flex-row-reverse",
              )}
              style={{ left: hint.left, top: hint.top }}
            >
              <PixelIcon
                name="hand"
                palette={{ o: "#fff6e5" }}
                className={cn(
                  "h-6 w-6 text-px-ink sm:h-7 sm:w-7",
                  hint.side === "right" ? "scene-tap-left -rotate-90" : "scene-tap-right rotate-90",
                )}
              />
              <span className="scene-hint bg-card px-2 py-1 font-pixel text-xs leading-tight whitespace-nowrap pixel-frame-sm sm:px-2.5 sm:py-1.5 sm:text-sm">
                {t(`hint.${hint.id}`)}
              </span>
            </div>
          )}

          {hover && (
            <span
              className="absolute -translate-x-1/2 -translate-y-full bg-foreground px-2 py-1 font-pixel text-xs whitespace-nowrap text-background"
              style={{ left: hover.left, top: hover.top }}
            >
              {hoverLabel(hover.id)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
