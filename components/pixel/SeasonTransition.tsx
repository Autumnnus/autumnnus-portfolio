"use client";

import { playSound } from "@/lib/pixel/sound";
import { useTheme } from "next-themes";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";

/**
 * Pixel wipes: chunky cells flood a rectangle from an origin point in an
 * ordered-dither pattern, the change happens while it is covered, then the
 * cells drain away from the same point. The season switch wipes the whole
 * viewport; the assistant panel wipes just its own box.
 */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const EDGE = 0.1;

const SEASON_COLORS = {
  dark: { fill: "#16203b", edge: "#8fd8f2" },
  light: { fill: "#f4e4c6", edge: "#e0692e" },
} as const;

type Point = { x: number; y: number };
type Rect = { left: number; top: number; width: number; height: number };

export interface PixelWipeOptions {
  rect?: Rect;
  origin: Point;
  fill: string;
  edge: string;
  cell?: number;
  coverMs?: number;
  revealMs?: number;
  onCovered: () => void;
  onDone?: () => void;
}

interface SeasonTransitionValue {
  switchSeason: (origin?: Point) => void;
  pixelWipe: (options: PixelWipeOptions) => void;
}

const SeasonTransitionContext = createContext<SeasonTransitionValue | null>(
  null,
);

export function useSeasonTransition() {
  const value = useContext(SeasonTransitionContext);
  if (!value) {
    throw new Error("useSeasonTransition must be used inside its provider");
  }
  return value;
}

export const usePixelWipe = () => useSeasonTransition().pixelWipe;

function runWipe(canvas: HTMLCanvasElement, options: PixelWipeOptions) {
  const {
    rect = {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    origin,
    fill,
    edge,
    cell = 12,
    coverMs = 480,
    revealMs = 520,
    onCovered,
    onDone,
  } = options;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.visibility = "visible";
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    onCovered();
    onDone?.();
    return;
  }

  const cols = Math.ceil(rect.width / cell);
  const rows = Math.ceil(rect.height / cell);
  const ox = (origin.x - rect.left) / cell;
  const oy = (origin.y - rect.top) / cell;
  const maxDist = Math.max(
    Math.hypot(ox, oy),
    Math.hypot(cols - ox, oy),
    Math.hypot(ox, rows - oy),
    Math.hypot(cols - ox, rows - oy),
    1,
  );

  // Each cell switches on at its own moment: mostly distance from the
  // origin, broken up by the Bayer matrix so the front is dithered.
  const activation = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dist = Math.hypot(x - ox, y - oy) / maxDist;
      activation[y * cols + x] =
        dist * 0.72 + (BAYER4[(y % 4) * 4 + (x % 4)] / 16) * 0.28;
    }
  }

  const colors = { fill, edge };
  const draw = (progress: number, covering: boolean) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const pass of ["fill", "edge"] as const) {
      ctx.fillStyle = colors[pass];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const a = activation[y * cols + x];
          const passed = a < progress;
          const isEdge = passed && a >= progress - EDGE;
          const covered = covering ? passed : !passed;
          if (!covered && !isEdge) continue;
          if ((pass === "edge") !== isEdge) continue;
          // Clip the last row/column to the rectangle.
          const w = Math.min(cell, rect.width - x * cell);
          const h = Math.min(cell, rect.height - y * cell);
          ctx.fillRect(rect.left + x * cell, rect.top + y * cell, w, h);
        }
      }
    }
  };

  const end = 1 + EDGE;
  let covering = true;
  let phaseStart = performance.now();

  const frame = (now: number) => {
    const duration = covering ? coverMs : revealMs;
    const progress = Math.min(end, ((now - phaseStart) / duration) * end);
    draw(progress, covering);

    if (progress < end) {
      requestAnimationFrame(frame);
      return;
    }
    if (covering) {
      onCovered();
      covering = false;
      phaseStart = performance.now();
      requestAnimationFrame(frame);
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.visibility = "hidden";
    onDone?.();
  };

  requestAnimationFrame(frame);
}

export function SeasonTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runningRef = useRef(false);

  const pixelWipe = useCallback((options: PixelWipeOptions) => {
    const canvas = canvasRef.current;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // One wipe at a time; anything else just happens instantly.
    if (!canvas || reduced || runningRef.current) {
      options.onCovered();
      options.onDone?.();
      return;
    }
    runningRef.current = true;
    runWipe(canvas, {
      ...options,
      onDone: () => {
        runningRef.current = false;
        options.onDone?.();
      },
    });
  }, []);

  const switchSeason = useCallback(
    (origin?: Point) => {
      if (runningRef.current) return;
      const next = resolvedTheme === "dark" ? "light" : "dark";
      playSound(next === "dark" ? "toWinter" : "toAutumn");
      pixelWipe({
        origin: origin ?? { x: window.innerWidth / 2, y: 0 },
        ...SEASON_COLORS[next],
        onCovered: () => setTheme(next),
      });
    },
    [resolvedTheme, setTheme, pixelWipe],
  );

  const value = useMemo(
    () => ({ switchSeason, pixelWipe }),
    [switchSeason, pixelWipe],
  );

  return (
    <SeasonTransitionContext.Provider value={value}>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[200]"
        style={{ visibility: "hidden" }}
      />
    </SeasonTransitionContext.Provider>
  );
}
