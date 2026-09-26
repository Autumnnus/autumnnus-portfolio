"use client";

import PixelIcon from "@/components/pixel/PixelIcon";
import { track } from "@/lib/analytics";
import { showAchievement } from "@/lib/pixel/achievements";
import {
  CHEATS,
  CheatId,
  CodeResult,
  KONAMI,
  KONAMI_SHORT,
  normalizeCode,
  TYPED_CODES,
} from "@/lib/pixel/cheats";
import { playSound, SoundName } from "@/lib/pixel/sound";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { SCENE_H, Season } from "./art";
import { HeroSceneEngine, HOTSPOTS, HotspotId, PokeResult } from "./engine";
import HintsDialog from "./HintsDialog";
import QuestBar from "./QuestBar";

const CHEAT_SOUND: Record<CheatId, SoundName> = {
  konami: "fanfare",
  fireworks: "twinkle",
  ufo: "open",
  weather: "storm",
  cycle: "chime",
};

export const INTRO_SEEN_KEY = "autumnnus:intro-seen";
// Quest progress lives for the tab session and belongs to one season:
// a reload keeps it, closing the tab or switching the theme starts over.
const QUEST_KEY = "autumnnus:quest";
const LEGACY_KEYS = ["autumnnus:scene-secrets", "autumnnus:cheats"];

const POKE_SOUND: Record<PokeResult, SoundName> = {
  tree: "rustle",
  cabin: "knock",
  sky: "twinkle",
  decor: "boing",
  critter: "hop",
  ground: "pop",
};

interface Quest {
  season: Season;
  found: HotspotId[];
  cheats: CheatId[];
  revealed: Partial<Record<CheatId, number>>;
  /** A code has been tried since the console unlocked. */
  consoleSeen: boolean;
}

const emptyQuest = (season: Season): Quest => ({
  season,
  found: [],
  cheats: [],
  revealed: {},
  consoleSeen: false,
});

function readQuest(season: Season): Quest {
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    const stored = JSON.parse(
      sessionStorage.getItem(QUEST_KEY) ?? "null",
    ) as Partial<Quest> | null;
    if (!stored || stored.season !== season) return emptyQuest(season);
    return {
      season,
      found: HOTSPOTS.filter((id) => stored.found?.includes(id)),
      cheats: CHEATS.filter((id) => stored.cheats?.includes(id)),
      revealed: stored.revealed ?? {},
      consoleSeen: Boolean(stored.consoleSeen),
    };
  } catch {
    return emptyQuest(season);
  }
}

function writeQuest(quest: Quest) {
  try {
    sessionStorage.setItem(QUEST_KEY, JSON.stringify(quest));
  } catch {
    // Storage blocked: progress lasts until reload.
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
  const questRef = useRef<Quest | null>(null);
  const seasonRef = useRef<Season | null>(null);
  const hoverRef = useRef<HotspotId | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { resolvedTheme } = useTheme();
  const season: Season | null = resolvedTheme
    ? resolvedTheme === "dark"
      ? "winter"
      : "autumn"
    : null;

  const [interactive, setInteractive] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [found, setFound] = useState<HotspotId[]>([]);
  const [cheats, setCheats] = useState<CheatId[]>([]);
  const [revealed, setRevealed] = useState<Partial<Record<CheatId, number>>>(
    {},
  );
  const [consoleSeen, setConsoleSeen] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [hint, setHint] = useState<Bubble | null>(null);
  const [hover, setHover] = useState<Bubble | null>(null);

  const currentSeason = useEffectEvent(() => season);

  /** Apply a change to the quest, mirror it into state, storage and engine. */
  const updateQuest = (change: (quest: Quest) => Quest) => {
    const current = questRef.current;
    if (!current) return;
    const next = change(current);
    questRef.current = next;
    writeQuest(next);
    setFound(next.found);
    setCheats(next.cheats);
    setRevealed(next.revealed);
    setConsoleSeen(next.consoleSeen);
    engineRef.current?.setFound(next.found);
  };

  const handlePoke = useEffectEvent((kind: PokeResult) => {
    playSound(POKE_SOUND[kind]);
    if (kind === "cabin") setTimeout(() => playSound("meow"), 520);
    const quest = questRef.current;
    if (kind === "ground" || !quest || quest.found.includes(kind)) return;

    const next = [...quest.found, kind];
    updateQuest((q) => ({ ...q, found: next }));
    setHint(null);
    track("hero_secret", {
      secret: kind,
      found: next.length,
      season: quest.season,
    });
    if (next.length === HOTSPOTS.length) {
      track("hero_secrets_complete", { season: quest.season });
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

  const runCheat = (id: CheatId) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.cheat(id);
    playSound(CHEAT_SOUND[id]);
    const quest = questRef.current;
    if (!quest) return;
    if (!quest.consoleSeen) updateQuest((q) => ({ ...q, consoleSeen: true }));
    if (quest.cheats.includes(id)) return;
    const next = [...quest.cheats, id];
    updateQuest((q) => ({ ...q, cheats: next }));
    setTimeout(
      () =>
        showAchievement({
          id: `cheat-${id}`,
          title: t(`code.${id}.title`),
          description: t(`code.${id}.description`),
          icon: id === "konami" ? "trophy" : "sparkles",
        }),
      900,
    );
    if (
      next.length === CHEATS.length &&
      quest.found.length === HOTSPOTS.length
    ) {
      track("hero_quest_complete", { season: quest.season });
      setTimeout(
        () =>
          showAchievement({
            id: "quest-master",
            title: t("quest.achievement.title"),
            description: t("quest.achievement.description"),
            icon: "crown",
          }),
        4200,
      );
    }
  };

  const handleCode = (input: string, result: CodeResult) => {
    track("hero_code", {
      input: input.trim().slice(0, 40),
      result: result.kind,
      code: result.kind === "miss" ? "-" : result.id,
      source: "console",
      season: questRef.current?.season ?? "autumn",
    });
    if (result.kind === "match") runCheat(result.id);
    else if (!questRef.current?.consoleSeen)
      updateQuest((q) => ({ ...q, consoleSeen: true }));
  };
  const handleKeyboardCode = useEffectEvent((input: string, id: CheatId) => {
    track("hero_code", {
      input,
      result: "match",
      code: id,
      source: "keyboard",
      season: questRef.current?.season ?? "autumn",
    });
    runCheat(id);
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
      onFx: (fx) => playSound(fx),
      onIntroEnd: () => setIntroDone(true),
    });
    engineRef.current = engine;

    const quest = readQuest(initialSeason);
    questRef.current = quest;
    writeQuest(quest);
    engine.setFound(quest.found);
    setFound(quest.found);
    setCheats(quest.cheats);
    setRevealed(quest.revealed);
    setConsoleSeen(quest.consoleSeen);
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
    let recent: string[] = [];
    let typed = "";
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("input, textarea, [contenteditable='true']")
      )
        return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      // Compare the latest keys against both forms, so stray extra presses
      // don't spoil it.
      recent = [...recent, key].slice(-KONAMI.length);
      const endsWith = (sequence: string[]) =>
        recent.length >= sequence.length &&
        sequence.every(
          (k, i) => k === recent[recent.length - sequence.length + i],
        );
      // Any two or more arrows right before B A also count.
      const arrowsThenBa =
        recent.length >= 4 &&
        recent.at(-2) === "b" &&
        recent.at(-1) === "a" &&
        recent.at(-3)?.startsWith("Arrow") &&
        recent.at(-4)?.startsWith("Arrow");
      if (endsWith(KONAMI) || endsWith(KONAMI_SHORT) || arrowsThenBa) {
        recent = [];
        handleKeyboardCode("↑↑↓↓BA", "konami");
        return;
      }
      // Once a sequence is under way, arrows stop scrolling the page.
      if (key.startsWith("Arrow")) {
        const underway = [KONAMI, KONAMI_SHORT].some((sequence) => {
          for (
            let n = Math.min(sequence.length - 1, recent.length);
            n >= 2;
            n--
          ) {
            if (
              sequence
                .slice(0, n)
                .every((k, i) => k === recent[recent.length - n + i])
            ) {
              return true;
            }
          }
          return false;
        });
        // Mixed arrows (↑↓←→…) look like a code too; plain ↓↓↓ still scrolls.
        const previous = recent.at(-2);
        const mixed = !!previous?.startsWith("Arrow") && previous !== key;
        if (underway || mixed) event.preventDefault();
      }
      if (key.length !== 1) return;
      typed = (typed + normalizeCode(key)).slice(-12);
      const code = Object.keys(TYPED_CODES).find((word) =>
        typed.endsWith(word),
      );
      if (code) {
        typed = "";
        handleKeyboardCode(code, TYPED_CODES[code]);
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

  // Switching the theme starts a fresh quest for the new season.
  const resetQuest = useEffectEvent((next: Season) => {
    questRef.current = emptyQuest(next);
    writeQuest(questRef.current);
    setFound([]);
    setCheats([]);
    setRevealed({});
    setConsoleSeen(false);
    setHintsOpen(false);
    setHint(null);
    engineRef.current?.setFound([]);
  });

  useEffect(() => {
    if (!season) return;
    const previous = seasonRef.current;
    seasonRef.current = season;
    engineRef.current?.setSeason(season);
    if (previous && previous !== season) resetQuest(season);
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
          left:
            offsetX +
            (side === "right" ? rect.x + rect.w + 2 : rect.x - 2) * scale,
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

  const seasonKey = season === "winter" ? "winter" : "autumn";
  const hoverLabel = (id: HotspotId) =>
    id === "sky"
      ? t(season === "winter" ? "tooltip.moon" : "tooltip.sun")
      : id === "decor"
        ? t(`tooltip.decor.${seasonKey}`)
        : t(`tooltip.${id}`);
  const hintLabel = (id: HotspotId) =>
    id === "decor" || id === "critter"
      ? t(`hint.${id}.${seasonKey}`)
      : t(`hint.${id}`);
  const allFound = found.length === HOTSPOTS.length;
  // Right after the last secret, point down at the console that just opened.
  const unlockHint = allFound && !consoleSeen && !hover;

  return (
    <div>
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
            {unlockHint && (
              <div className="px-pop absolute bottom-1 left-3 flex items-end gap-1 sm:left-5">
                <span className="scene-hint bg-card px-2 py-1 font-pixel text-xs leading-tight pixel-frame-sm sm:px-2.5 sm:py-1.5 sm:text-sm">
                  {t("quest.unlockedHint")}
                </span>
                <PixelIcon
                  name="hand"
                  palette={{ o: "#fff6e5" }}
                  className="scene-tap-down h-6 w-6 rotate-180 text-px-ink sm:h-7 sm:w-7"
                />
              </div>
            )}

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
                    hint.side === "right"
                      ? "scene-tap-left -rotate-90"
                      : "scene-tap-right rotate-90",
                  )}
                />
                <span className="scene-hint bg-card px-2 py-1 font-pixel text-xs leading-tight whitespace-nowrap pixel-frame-sm sm:px-2.5 sm:py-1.5 sm:text-sm">
                  {hintLabel(hint.id)}
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

      {questOpen && (
        <QuestBar
          secrets={found.length}
          cheats={cheats}
          fresh={allFound && !consoleSeen}
          inputRef={inputRef}
          onCode={handleCode}
          onOpenHints={() => {
            setHintsOpen(true);
            track("hero_hints_open", { found: cheats.length });
          }}
        />
      )}

      <HintsDialog
        open={hintsOpen}
        onOpenChange={setHintsOpen}
        found={cheats}
        revealed={revealed}
        onReveal={(id) => {
          const letters = (questRef.current?.revealed[id] ?? 0) + 1;
          track("hero_hint", { code: id, letters });
          updateQuest((q) => ({
            ...q,
            revealed: { ...q.revealed, [id]: letters },
          }));
        }}
        onGoToConsole={() => {
          const input = inputRef.current;
          if (!input) return;
          input.scrollIntoView({ block: "center", behavior: "smooth" });
          input.focus({ preventScroll: true });
        }}
      />
    </div>
  );
}
