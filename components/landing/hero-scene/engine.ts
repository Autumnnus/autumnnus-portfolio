import {
  BAYER8,
  bayer,
  blendSky,
  buildSeasonArt,
  buildSky,
  GROUND_Y,
  OVERSCAN,
  PALETTE,
  SCENE_H,
  Season,
  SeasonArt,
  TreeSprite,
} from "./art";
import { CheatId, SceneExtras, SceneFx } from "./extras";

/**
 * Runtime for the hero landscape: parallax layers, weather particles, birds,
 * a shooting star, scroll-driven dusk and a dithered cross-fade between
 * seasons. Positions are floats but everything is drawn on whole pixels, so
 * motion reads as stepped pixel animation. Units are scene pixels/second.
 */
type ParticleKind = "leaf" | "snow" | "spark" | "smoke" | "rain" | "splash";

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  maxVy: number;
  gravity: number;
  age: number;
  life: number;
  color: string;
  size: 1 | 2;
  phase: number;
  sway: number;
  landY: number;
  settled: boolean;
}

interface Bird {
  x: number;
  y: number;
  vx: number;
  phase: number;
}

interface Meteor {
  x: number;
  y: number;
  age: number;
}

/** Clickable spots in the scene; finding them all is a small quest. */
export type HotspotId = "tree" | "cabin" | "sky" | "decor" | "critter";
export const HOTSPOTS: HotspotId[] = ["tree", "cabin", "sky", "decor", "critter"];
export type PokeResult = HotspotId | "ground";

export interface SceneRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SceneOptions {
  season: Season;
  intro: boolean;
  reducedMotion: boolean;
  onPoke?: (kind: PokeResult) => void;
  onFx?: (fx: SceneFx) => void;
  onIntroEnd?: () => void;
}

type IntroPart = "ground" | "mid" | "far" | "trees" | "celestial";

const TRANSITION_MS = 1100;
const INTRO_MS = 1100;
const SKY_REVEAL_MS = 320;
// [delay ms, duration ms, rise in scene px]
const INTRO: Record<IntroPart, [number, number, number]> = {
  ground: [0, 360, 14],
  mid: [90, 360, 18],
  far: [180, 360, 22],
  trees: [260, 380, 28],
  celestial: [380, 700, 24],
};

const MAX_LEAVES = 90;
// "!" quest marker, drawn above anything not yet discovered.
const MARKER = [
  ".XXX.",
  "XgwgX",
  "XgggX",
  "XgggX",
  ".XgX.",
  ".XgX.",
  "..X..",
  ".....",
  ".XXX.",
  ".XgX.",
  ".XXX.",
];
const MAX_SNOW = 170;
const MAX_STORM_SNOW = 520;
const MAX_RAIN = 260;
const SHAKE = [1, -1, 1, -1];
const METEOR_TRAIL = ["#ffffff", "#cfe0ff", "#9fb4e8", "#6f84be", "#4a5d96"];

const easeOut = (t: number) => 1 - (1 - t) ** 3;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function makeBuffer(width: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = SCENE_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

export class HeroSceneEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private art: Record<Season, SeasonArt> | null = null;
  private extras: SceneExtras | null = null;
  private skies = new Map<string, HTMLCanvasElement>();
  private bufferA: CanvasRenderingContext2D | null = null;
  private bufferB: CanvasRenderingContext2D | null = null;

  private season: Season;
  private transition: { from: Season; to: Season; start: number } | null =
    null;
  private particles: Record<Season, Particle[]> = { autumn: [], winter: [] };
  private birds: Bird[] = [];
  private nextBirds = 3;
  private meteors: Meteor[] = [];
  private nextMeteor = 2.5;
  private meteorQueue = 0;
  private found = new Set<HotspotId>();
  private hints = false;
  private windowLitUntil = 0;
  private doorOpenUntil = 0;
  private faceUntil = 0;
  // Where the visible season's movable pieces were last drawn.
  private layout = { near: 0, mid: 0, midY: 0, treeY: 0, celX: 0, celY: 0 };
  private stormUntil = 0;
  private spawnDebt = { leaf: 0, snow: 0, smoke: 0, storm: 0 };
  private nextThunder = 2;
  private flashUntil = 0;
  // Winter mountains lit by the day-cycle code, keyed by the night layer.
  private dayLayers = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
  private parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  private scroll = 0;
  private time = 0;
  private lastTrail = 0;

  private introStart: number | null;
  private running = false;
  private raf = 0;
  private lastFrame = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: SceneOptions,
  ) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2D canvas unavailable");
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;
    this.season = options.season;
    // -1: start the intro clock on the first frame that actually renders.
    this.introStart = options.intro && !options.reducedMotion ? -1 : null;
  }

  // ---------- Public API ----------

  resize(width: number) {
    if (width === this.width || width <= 0) return;
    const first = this.width === 0;
    this.width = width;
    this.canvas.width = width;
    this.canvas.height = SCENE_H;
    this.ctx.imageSmoothingEnabled = false;
    this.art = {
      autumn: buildSeasonArt("autumn", width),
      winter: buildSeasonArt("winter", width),
    };
    if (this.extras) this.extras.resize(width);
    else this.extras = new SceneExtras(width);
    this.skies.clear();
    this.bufferA = makeBuffer(width);
    this.bufferB = makeBuffer(width);
    if (first) this.prefill(this.season);
    if (!this.running) this.render(performance.now());
  }

  start() {
    if (this.running || this.options.reducedMotion) return;
    this.running = true;
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
  }

  setSeason(season: Season) {
    const current = this.transition ? this.transition.to : this.season;
    if (season === current) return;

    if (!this.running || !this.art) {
      this.season = season;
      this.transition = null;
      this.particles = { autumn: [], winter: [] };
      this.prefill(season);
      this.render(performance.now());
      return;
    }

    this.transition = { from: current, to: season, start: performance.now() };
    this.season = current;
    // The trees let go of their leaves as winter arrives.
    if (current === "autumn") {
      for (let i = 0; i < 34; i++) this.spawnLeaf(undefined, true);
    }
  }

  /** Pointer position across the viewport, each axis in [-1, 1]. */
  setPointer(nx: number, ny: number) {
    this.parallax.tx = Math.max(-1, Math.min(1, nx));
    this.parallax.ty = Math.max(-1, Math.min(1, ny));
  }

  /** How far the hero has scrolled out of view, in [0, 1]. */
  setScroll(amount: number) {
    this.scroll = Math.max(0, Math.min(1, amount));
  }

  /** Hotspots the visitor has already found; they lose their marker. */
  setFound(ids: HotspotId[]) {
    this.found = new Set(ids);
  }

  /** Show "!" markers over undiscovered hotspots (after the intro). */
  setHints(on: boolean) {
    this.hints = on;
  }

  /** Where a hotspot currently is, in scene pixels. */
  hotspot(id: HotspotId): SceneRect | null {
    if (!this.art) return null;
    const art = this.art[this.visibleSeason()];
    const L = this.layout;
    if (id === "tree") {
      const tree = art.trees[0];
      return {
        x: tree.x + L.near,
        y: tree.y + L.treeY,
        w: tree.w,
        h: Math.round(tree.h * 0.8),
      };
    }
    if (id === "cabin") {
      return {
        x: art.cabin.x + L.mid,
        y: art.cabin.y + L.midY,
        w: art.cabin.w,
        h: art.cabin.h,
      };
    }
    if (id === "decor") {
      return this.extras?.decorRects(this.visibleSeason(), art, L.near)[0] ?? null;
    }
    if (id === "critter") {
      // Where to look for the critter when it isn't passing by right now.
      return (
        this.extras?.critterRect(this.visibleSeason()) ?? {
          x: Math.round(this.width * 0.42),
          y: GROUND_Y - 6,
          w: 10,
          h: 7,
        }
      );
    }
    const cel = art.celestial;
    return { x: L.celX, y: L.celY, w: cel.w, h: cel.h };
  }

  /** Which hotspot (if any) sits under a scene point. */
  hitTest(x: number, y: number): { id: HotspotId; tree?: TreeSprite } | null {
    if (!this.art) return null;
    const inside = (r: SceneRect | null) =>
      !!r && x >= r.x - 1 && x <= r.x + r.w + 1 && y >= r.y - 1 && y <= r.y + r.h;
    const L = this.layout;
    const season = this.visibleSeason();
    if (inside(this.extras?.critterRect(season) ?? null)) return { id: "critter" };
    if (this.extras?.decorRects(season, this.art[season], L.near).some(inside)) {
      return { id: "decor" };
    }
    const tree = this.art[season].trees.find((t) =>
      inside({ x: t.x + L.near, y: t.y + L.treeY, w: t.w, h: Math.round(t.h * 0.8) }),
    );
    if (tree) return { id: "tree", tree };
    if (inside(this.hotspot("cabin"))) return { id: "cabin" };
    if (inside(this.hotspot("sky"))) return { id: "sky" };
    return null;
  }

  /** A click on the scene, in scene pixels. */
  poke(x: number, y: number) {
    if (!this.art || !this.running) return;
    const season = this.visibleSeason();
    const now = performance.now();
    const hit = this.hitTest(x, y);

    if (hit?.tree) {
      const tree = hit.tree;
      tree.shakeUntil = now + 420;
      for (let i = 0; i < 16; i++) {
        const from = tree.canopy[Math.floor(Math.random() * tree.canopy.length)];
        if (season === "autumn") this.spawnLeaf(from, true);
        else this.spawnSnow(from, true);
      }
    } else if (hit?.id === "cabin") {
      // Knock knock: the light comes on and someone peeks out.
      this.windowLitUntil = now + 8000;
      this.doorOpenUntil = now + 2600;
      for (let i = 0; i < 6; i++) this.spawnSmoke(season, true);
    } else if (hit?.id === "decor") {
      this.extras?.pokeDecor(season, now);
      const r = this.hotspot("decor");
      if (r) {
        for (let i = 0; i < 8; i++) {
          const from = { x: r.x + Math.random() * r.w, y: r.y + Math.random() * 3 };
          if (season === "autumn") this.spawnLeaf(from, true);
          else this.spawnSnow(from, true);
        }
      }
    } else if (hit?.id === "critter") {
      this.extras?.pokeCritter(now);
    } else if (hit?.id === "sky") {
      this.faceUntil = now + 3200;
      if (season === "winter") this.meteorQueue = 5;
      else {
        const L = this.layout;
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          this.particles.autumn.push({
            kind: "spark",
            x: L.celX + 10 + Math.cos(angle) * 12,
            y: L.celY + 10 + Math.sin(angle) * 12,
            vx: Math.cos(angle) * 10,
            vy: Math.sin(angle) * 10,
            maxVy: 20,
            gravity: 0,
            age: 0,
            life: 0.8,
            color: PALETTE.autumn.spark[i % 2],
            size: 1,
            phase: 0,
            sway: 0,
            landY: SCENE_H,
            settled: false,
          });
        }
      }
    } else {
      for (let i = 0; i < 7; i++) {
        if (season === "autumn") this.spawnLeaf({ x, y }, true);
        else this.spawnSnow({ x, y }, true);
      }
    }
    this.options.onPoke?.(hit?.id ?? "ground");
  }

  /** Pointer moving over the scene sheds a few sparkles. */
  trail(x: number, y: number) {
    if (!this.running) return;
    const now = performance.now();
    if (now - this.lastTrail < 45) return;
    this.lastTrail = now;
    const colors = PALETTE[this.visibleSeason()].spark;
    this.particles[this.visibleSeason()].push({
      kind: "spark",
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 3,
      maxVy: 6,
      gravity: 0,
      age: 0,
      life: 0.7,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 1,
      phase: 0,
      sway: 0,
      landY: SCENE_H,
      settled: false,
    });
  }

  /** Secret codes typed on the keyboard. */
  cheat(id: CheatId) {
    if (!this.art || !this.running || !this.extras) return;
    if (id === "konami") this.storm();
    else this.extras.cheat(id, this.visibleSeason(), this.time);
  }

  /** Konami code: a leaf storm in autumn, a blizzard in winter. */
  storm() {
    if (!this.art || !this.running) return;
    this.stormUntil = this.time + 4;
    const until = performance.now() + 4000;
    this.art[this.visibleSeason()].trees.forEach((t) => (t.shakeUntil = until));
  }

  // ---------- Loop ----------

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    if (this.introStart === -1) this.introStart = now;
    this.update(dt, now);
    this.render(now);
    this.raf = requestAnimationFrame(this.frame);
  };

  private visibleSeason(): Season {
    return this.transition ? this.transition.to : this.season;
  }

  private wind() {
    const storm = this.time < this.stormUntil ? 26 : 0;
    // The weather code blows in gusts: a light gale in winter, slanting rain in autumn.
    const weather = this.extras?.weather(this.time) ?? 0;
    const gust = weather
      ? weather * (this.visibleSeason() === "winter" ? 34 : 9) * (1 + 0.45 * Math.sin(this.time * 1.7))
      : 0;
    return 2 + Math.sin(this.time * 0.3) * 3 + storm + gust;
  }

  // ---------- Particles ----------

  private prefill(season: Season) {
    if (!this.art) return;
    if (season === "winter") {
      for (let i = 0; i < 60; i++) {
        this.spawnSnow({
          x: Math.random() * this.width,
          y: Math.random() * GROUND_Y,
        });
      }
    } else {
      for (let i = 0; i < 8; i++) this.spawnLeaf();
      for (let i = 0; i < 12; i++) {
        this.spawnLeaf({ x: Math.random() * this.width, y: GROUND_Y + 2 });
        const leaf = this.particles.autumn[this.particles.autumn.length - 1];
        leaf.settled = true;
        leaf.y = leaf.landY;
        leaf.life = 4 + Math.random() * 8;
      }
    }
  }

  private spawnLeaf(from?: { x: number; y: number }, burst = false) {
    if (!this.art || this.particles.autumn.length >= MAX_LEAVES) return;
    const trees = this.art.autumn.trees;
    const fromSky = !from && !burst && Math.random() < 0.3;
    const tree: TreeSprite = trees[Math.random() < 0.7 ? 0 : 1];
    const origin =
      from ?? tree.canopy[Math.floor(Math.random() * tree.canopy.length)];
    const leaves = PALETTE.autumn.leaves;
    this.particles.autumn.push({
      kind: "leaf",
      x: fromSky ? Math.random() * this.width : origin.x,
      y: fromSky ? -2 : origin.y,
      vx: burst ? (Math.random() - 0.5) * 24 : this.wind() + (Math.random() - 0.5) * 4,
      vy: burst ? -6 - Math.random() * 12 : 2 + Math.random() * 3,
      maxVy: 5 + Math.random() * 4,
      gravity: burst ? 22 : 10,
      age: 0,
      life: 0,
      color: leaves[Math.floor(Math.random() * leaves.length)],
      size: Math.random() < 0.75 ? 2 : 1,
      phase: Math.random() * Math.PI * 2,
      sway: 0.8 + Math.random() * 1.2,
      landY: GROUND_Y + Math.floor(Math.random() * 7),
      settled: false,
    });
  }

  private spawnSnow(
    from?: { x: number; y: number },
    burst = false,
    season: Season = "winter",
    gale = false,
  ) {
    if (this.particles[season].length >= (gale ? MAX_STORM_SNOW : MAX_SNOW)) return;
    const big = !burst && Math.random() < (gale ? 0.22 : 0.1);
    // In a gale, start upwind so the slanted flakes still cover the width.
    const lead = gale ? Math.max(0, this.wind() * 0.6 - 2) * 4 : 0;
    this.particles[season].push({
      kind: "snow",
      x: from ? from.x : Math.random() * (this.width + 30 + lead) - 15 - lead,
      y: from ? from.y : -2,
      vx: burst
        ? (Math.random() - 0.5) * 20
        : this.wind() * 0.6 - 2 + (Math.random() - 0.5) * 2,
      vy: burst ? -4 - Math.random() * 10 : (big ? 9 : 4) + Math.random() * 4 + (gale ? 9 : 0),
      maxVy: big ? 12 : 6 + Math.random() * 3,
      gravity: burst ? 14 : 0,
      age: 0,
      life: 0,
      color: big ? "#ffffff" : PALETTE.winter.snow,
      size: big ? 2 : 1,
      phase: Math.random() * Math.PI * 2,
      sway: 0.4 + Math.random() * 0.8,
      landY: GROUND_Y + Math.floor(Math.random() * 9),
      settled: false,
    });
  }

  private spawnRain() {
    if (this.particles.autumn.length >= MAX_RAIN + MAX_LEAVES) return;
    const vy = 95 + Math.random() * 30;
    const vx = this.wind() * 2.2;
    // Start upwind so the slanted drops still cover the whole width.
    const lead = (vx / vy) * GROUND_Y;
    this.particles.autumn.push({
      kind: "rain",
      x: Math.random() * (this.width + Math.abs(lead)) - Math.max(0, lead),
      y: -3 - Math.random() * 6,
      vx,
      vy,
      maxVy: vy,
      gravity: 0,
      age: 0,
      life: 0,
      color: Math.random() < 0.3 ? "#dfe8f4" : "#9fb6d4",
      size: 1,
      phase: 0,
      sway: 0,
      landY: GROUND_Y + Math.floor(Math.random() * 9),
      settled: false,
    });
  }

  private spawnSmoke(season: Season, puff = false) {
    if (!this.art) return;
    const cabin = this.art[season].cabin;
    this.particles[season].push({
      kind: "smoke",
      x: cabin.x + 12 + Math.random() + (puff ? (Math.random() - 0.5) * 4 : 0),
      y: cabin.y - 1,
      vx: (puff ? (Math.random() - 0.5) * 8 : 2 + Math.random() * 2) + this.wind() * 0.3,
      vy: puff ? -6 - Math.random() * 6 : -3 - Math.random() * 2,
      maxVy: 0,
      gravity: 0,
      age: 0,
      life: 3.2,
      color: "",
      size: 2,
      phase: 0,
      sway: 0,
      landY: 0,
      settled: false,
    });
  }

  private update(dt: number, now: number) {
    this.time += dt;
    const ease = Math.min(1, dt * 5);
    this.parallax.x += (this.parallax.tx - this.parallax.x) * ease;
    this.parallax.y += (this.parallax.ty - this.parallax.y) * ease;

    const storming = this.time < this.stormUntil;
    const visible = this.visibleSeason();

    // Ambient spawns belong to the season that is arriving or present.
    const weather = this.extras?.weather(this.time) ?? 0;
    // Rain knocks a few more leaves loose.
    const leafRate = visible === "autumn" ? (storming ? 40 : 3 + weather * 5) : 0;
    const snowRate = visible === "winter" ? (storming ? 70 : 9) : 0;
    this.spawnDebt.leaf += leafRate * dt;
    this.spawnDebt.snow += snowRate * dt;
    this.spawnDebt.smoke += dt;
    while (this.spawnDebt.leaf >= 1) {
      this.spawnDebt.leaf--;
      this.spawnLeaf();
    }
    while (this.spawnDebt.snow >= 1) {
      this.spawnDebt.snow--;
      this.spawnSnow();
    }
    if (this.spawnDebt.smoke >= 0.45) {
      this.spawnDebt.smoke = 0;
      this.spawnSmoke(visible);
      if (this.transition) this.spawnSmoke(this.transition.from);
    }

    this.nextBirds -= dt;
    if (this.nextBirds <= 0 && visible === "autumn") {
      const y = 8 + Math.floor(Math.random() * 12);
      const vx = 10 + Math.random() * 4;
      [
        [0, 0],
        [-4, -2],
        [-4, 2],
      ].forEach(([dx, dy]) =>
        this.birds.push({ x: -6 + dx, y: y + dy, vx, phase: Math.random() * 2 }),
      );
      this.nextBirds = 8 + Math.random() * 7;
    }
    this.birds = this.birds.filter((b) => {
      b.x += b.vx * dt;
      return b.x < this.width + 8;
    });

    this.nextMeteor -= dt;
    if (this.nextMeteor <= 0 && visible === "winter") {
      this.meteors.push({
        x: this.width * (0.3 + Math.random() * 0.6),
        y: 2 + Math.random() * 8,
        age: 0,
      });
      if (this.meteorQueue > 0) {
        this.meteorQueue--;
        this.nextMeteor = 0.22 + Math.random() * 0.12;
      } else {
        this.nextMeteor = 6 + Math.random() * 7;
      }
    }
    if (this.meteorQueue > 0 && this.nextMeteor > 0.4) this.nextMeteor = 0;
    this.meteors = this.meteors.filter((m) => {
      m.age += dt;
      m.x -= 44 * dt;
      m.y += 18 * dt;
      return m.age <= 0.7;
    });

    const urgent =
      !this.found.has("critter") &&
      HOTSPOTS.every((id) => id === "critter" || this.found.has(id));
    this.extras?.update(dt, this.time, visible, urgent, (fx) => this.options.onFx?.(fx));
    // The weather code: a downpour with thunder in autumn, a snowstorm in winter.
    if (weather > 0) {
      this.spawnDebt.storm += (visible === "winter" ? 120 : 150) * weather * dt;
      while (this.spawnDebt.storm >= 1) {
        this.spawnDebt.storm--;
        if (visible === "winter") this.spawnSnow(undefined, false, "winter", true);
        else this.spawnRain();
      }
      this.nextThunder -= dt;
      if (weather > 0.8 && this.nextThunder <= 0 && this.art) {
        if (visible === "autumn") {
          this.flashUntil = now + 140;
          this.nextThunder = 3.5 + Math.random() * 3;
          setTimeout(() => this.options.onFx?.("thunder"), 180);
        } else {
          // A gust: the pines sway and the wind howls.
          this.art.winter.trees.forEach((t) => (t.shakeUntil = now + 700));
          this.nextThunder = 2.5 + Math.random() * 2;
          this.options.onFx?.("gust");
        }
      }
    } else {
      this.spawnDebt.storm = 0;
      this.nextThunder = 1.2;
    }

    for (const season of ["autumn", "winter"] as const) {
      this.particles[season] = this.stepParticles(this.particles[season], dt);
    }

    if (this.introStart !== null && this.introStart >= 0) {
      if (now - this.introStart > INTRO_MS) {
        this.introStart = null;
        this.options.onIntroEnd?.();
      }
    }
  }

  private stepParticles(list: Particle[], dt: number) {
    const kept: Particle[] = [];
    const wind = this.wind();
    for (const p of list) {
      p.age += dt;
      switch (p.kind) {
        case "leaf":
          if (p.settled) {
            if (p.age < p.life) kept.push(p);
            continue;
          }
          p.vy = Math.min(p.maxVy, p.vy + p.gravity * dt);
          p.vx += (wind - p.vx) * dt * 0.5;
          p.x += (p.vx + Math.cos(p.age * 2.4 + p.phase) * p.sway * 3) * dt;
          p.y += p.vy * dt;
          if (p.vy > 0 && p.y >= p.landY) {
            p.settled = true;
            p.y = p.landY;
            p.age = 0;
            p.life = 5 + Math.random() * 5;
          }
          if (p.x > -10 && p.x < this.width + 10) kept.push(p);
          break;
        case "rain":
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.y >= p.landY) {
            kept.push({ ...p, kind: "splash", y: p.landY, age: 0, life: 0.16 });
          } else if (p.x > -20 && p.x < this.width + 20) {
            kept.push(p);
          }
          break;
        case "snow":
          if (p.gravity) p.vy = Math.min(p.maxVy, p.vy + p.gravity * dt);
          p.x += (p.vx + Math.cos(p.age * 1.8 + p.phase) * p.sway * 2) * dt;
          p.y += p.vy * dt;
          if (!(p.vy > 0 && p.y >= p.landY) && p.x > -16 && p.x < this.width + 16)
            kept.push(p);
          break;
        default:
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.age < p.life) kept.push(p);
      }
    }
    return kept;
  }

  // ---------- Rendering ----------

  private render(now: number) {
    if (!this.art || !this.bufferA || !this.bufferB) return;

    // Waiting for the first visible frame: show the bare panel.
    if (this.introStart === -1) {
      this.ctx.fillStyle = PALETTE[this.season].panel;
      this.ctx.fillRect(0, 0, this.width, SCENE_H);
      return;
    }

    if (this.transition) {
      const p = (now - this.transition.start) / TRANSITION_MS;
      if (p >= 1) {
        const { from, to } = this.transition;
        this.season = to;
        this.transition = null;
        this.particles[from] = [];
      } else {
        const { from, to } = this.transition;
        this.drawSeason(this.bufferA, from, now, p, 0);
        this.drawSeason(this.bufferB, to, now, 0, 1 - p);
        const a = this.bufferA.getImageData(0, 0, this.width, SCENE_H);
        const b = this.bufferB.getImageData(0, 0, this.width, SCENE_H);
        for (let y = 0; y < SCENE_H; y++) {
          for (let x = 0; x < this.width; x++) {
            if (BAYER8[(y & 7) * 8 + (x & 7)] >= p) continue;
            const i = (y * this.width + x) * 4;
            a.data[i] = b.data[i];
            a.data[i + 1] = b.data[i + 1];
            a.data[i + 2] = b.data[i + 2];
          }
        }
        this.ctx.putImageData(a, 0, 0);
        return;
      }
    }

    this.drawSeason(this.ctx, this.season, now, 0, 0);
    this.revealSky(now);
  }

  private sky(season: Season, dusk: number) {
    const levels = PALETTE[season].sky;
    const max = levels.length - 1;
    const pos = Math.min(max, dusk * max);
    const base = Math.floor(pos);
    const amount = Math.round((pos - base) * 8) / 8;
    const key = `${season}:${base}:${amount}`;
    let sky = this.skies.get(key);
    if (!sky) {
      const baseKey = `${season}:${base}:0`;
      let lower = this.skies.get(baseKey);
      if (!lower) {
        lower = buildSky(this.width, levels[base]);
        this.skies.set(baseKey, lower);
      }
      sky =
        amount > 0 && base < max
          ? blendSky(lower, buildSky(this.width, levels[base + 1]), amount)
          : lower;
      this.skies.set(key, sky);
    }
    return sky;
  }

  private introOffset(part: IntroPart, now: number) {
    if (this.introStart === null) return 0;
    if (this.introStart < 0) return INTRO[part][2];
    const [delay, duration, rise] = INTRO[part];
    const t = (now - this.introStart - delay) / duration;
    if (t >= 1) return 0;
    const offset = (1 - easeOut(Math.max(0, t))) * rise;
    return Math.ceil(offset / 2) * 2;
  }

  private drawSeason(
    ctx: CanvasRenderingContext2D,
    season: Season,
    now: number,
    leave: number,
    arrive: number,
  ) {
    const art = this.art![season];
    const W = this.width;
    const shift = (factor: number) => Math.round(this.parallax.x * factor);

    const extras = this.extras;
    const visible = season === this.visibleSeason();
    const settled = this.introStart === null;
    // The cycle code turns autumn to evening and winter night to day; the
    // weather code is layered on top, so the two never fight.
    const cycle = extras?.cycle(this.time) ?? 0;
    const weather = extras?.weather(this.time) ?? 0;
    const night = season === "autumn" ? Math.max(this.scroll, cycle * 0.82) : this.scroll;
    const day = season === "winter" ? cycle : 0;
    ctx.drawImage(this.sky(season, season === "autumn" ? night : day), 0, 0);

    if (season === "winter") {
      this.drawStars(ctx, art, Math.max(day, weather * 0.8));
      if (day < 0.95) this.drawAurora(ctx, night, (1 - day) * (1 - weather * 0.7));
    } else {
      extras?.drawStarsAtNight(ctx, art, this.time, night);
    }

    const cel = art.celestial;
    const introRise = Math.round((leave + arrive) * 26) + this.introOffset("celestial", now);
    let celY = season === "autumn" ? 20 : 7;
    if (season === "autumn") celY += Math.round(night * 14);
    // In winter the moon sets behind the mountains while a pale sun rises.
    celY += Math.round(day * 34) + introRise;
    let celX = Math.round(W * 0.76) - Math.floor(cel.w / 2) + shift(0.8);
    ctx.drawImage(cel.canvas, celX, celY);
    if (day > 0) {
      const sunX = Math.round(W * 0.24) - Math.floor(cel.w / 2) + shift(0.8);
      const sunY = 6 + Math.round((1 - day) * 34) + introRise;
      extras?.drawWinterSun(ctx, sunX, sunY);
      if (day > 0.5) {
        celX = sunX;
        celY = sunY;
      }
    }
    if (now < this.faceUntil) this.drawFace(ctx, season, celX + 10, celY + 10, now);
    extras?.drawClouds(ctx, season, shift(1), day);

    if (season === "winter" && day < 0.3) this.drawMeteor(ctx);
    else this.drawBirds(ctx);
    if (visible) extras?.drawUfo(ctx, this.time);

    const farY = Math.round(this.parallax.y) + this.introOffset("far", now);
    ctx.drawImage(art.far, -OVERSCAN + shift(1.5), farY);
    if (day > 0) {
      ctx.globalAlpha = day;
      ctx.drawImage(this.dayLayer(art.far), -OVERSCAN + shift(1.5), farY);
      ctx.globalAlpha = 1;
    }

    const midY = this.introOffset("mid", now);
    ctx.drawImage(art.mid, -OVERSCAN + shift(3), midY);
    ctx.drawImage(art.cabin.canvas, art.cabin.x + shift(3), art.cabin.y + midY);
    this.drawWindow(ctx, season, art, shift(3), midY, now, night);
    this.drawDoor(ctx, art, shift(3), midY, now);
    extras?.drawCabinExtras(ctx, season, art, shift(3), midY, this.time);
    this.drawParticles(ctx, season, "smoke");

    ctx.drawImage(art.ground, -OVERSCAN + shift(4), this.introOffset("ground", now));
    if (settled) extras?.drawDecor(ctx, season, art, shift(4), now);

    // Trees rise out of the ground during the intro, so clip them to it.
    const treeY = this.introOffset("trees", now);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, GROUND_Y + 1);
    ctx.clip();
    for (const tree of art.trees) {
      const shake = now < tree.shakeUntil ? SHAKE[Math.floor(now / 50) % 4] : 0;
      ctx.drawImage(tree.canvas, tree.x + shift(4) + shake, tree.y + treeY);
    }
    ctx.restore();

    if (settled && visible) extras?.drawCritter(ctx, season, this.time);
    this.drawParticles(ctx, season, "leaf");
    this.drawParticles(ctx, season, "snow");
    this.drawParticles(ctx, season, "rain");
    this.drawParticles(ctx, season, "splash");
    this.drawParticles(ctx, season, "spark");

    // Weather darkens autumn under rain clouds and hazes the winter sky.
    if (weather > 0) {
      ctx.save();
      ctx.globalCompositeOperation = season === "autumn" ? "multiply" : "screen";
      ctx.fillStyle =
        season === "autumn"
          ? `rgba(120, 124, 150, ${weather * 0.42})`
          : `rgba(96, 112, 150, ${weather * (0.42 + day * 0.12)})`;
      ctx.fillRect(0, 0, W, SCENE_H);
      ctx.restore();
    }

    // Autumn dusk tints the whole landscape; lights then glow on top of it.
    if (season === "autumn" && night > 0.3) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = `rgba(92, 62, 128, ${((night - 0.3) / 0.7) * 0.6})`;
      ctx.fillRect(0, 0, W, SCENE_H);
      ctx.restore();
    }
    if (season === "autumn" && (night > 0.3 || weather > 0.3)) {
      this.drawWindow(ctx, season, art, shift(3), midY, now, Math.max(night, weather));
      // Fireflies stay home in the rain.
      if (weather < 0.4) extras?.drawFireflies(ctx, this.time, night);
    }
    if (season === "autumn" && visible && now < this.flashUntil) {
      ctx.fillStyle = "rgba(255, 248, 230, 0.55)";
      ctx.fillRect(0, 0, W, SCENE_H);
    }
    if (visible) extras?.drawFireworks(ctx);

    if (visible) {
      this.layout = {
        near: shift(4),
        mid: shift(3),
        midY,
        treeY,
        celX,
        celY,
      };
      if (this.hints && this.introStart === null) this.drawMarkers(ctx, season);
    }
  }

  private drawMarkers(ctx: CanvasRenderingContext2D, season: Season) {
    const ink = season === "autumn" ? "#2a1a12" : "#0a0f1f";
    const colors: Record<string, string> = { X: ink, g: "#f2c14e", w: "#fff6d6" };
    const bob = Math.floor(this.time * 2.5) % 2 === 0 ? 0 : -1;
    for (const id of HOTSPOTS) {
      if (this.found.has(id)) continue;
      const r =
        id === "critter" ? (this.extras?.critterRect(season) ?? null) : this.hotspot(id);
      if (!r) continue;
      const x =
        id === "sky" ? r.x - 7 : Math.round(r.x + r.w / 2) - 2 - (id === "cabin" ? 3 : 0);
      const y = id === "sky" ? r.y + 5 : r.y - 13;
      MARKER.forEach((row, dy) => {
        for (let dx = 0; dx < row.length; dx++) {
          const color = colors[row[dx]];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(x + dx, y + dy + bob, 1, 1);
        }
      });
    }
  }

  /** The sun or moon smiles back when clicked. */
  private drawFace(
    ctx: CanvasRenderingContext2D,
    season: Season,
    cx: number,
    cy: number,
    now: number,
  ) {
    const blink = Math.floor(now / 140) % 12 === 0;
    ctx.fillStyle = season === "autumn" ? "#8a3212" : "#5d6fa8";
    if (blink) {
      ctx.fillRect(cx - 4, cy - 2, 2, 1);
      ctx.fillRect(cx + 2, cy - 2, 2, 1);
    } else {
      ctx.fillRect(cx - 3, cy - 3, 1, 2);
      ctx.fillRect(cx + 3, cy - 3, 1, 2);
    }
    ctx.fillRect(cx - 2, cy + 2, 1, 1);
    ctx.fillRect(cx - 1, cy + 3, 3, 1);
    ctx.fillRect(cx + 2, cy + 2, 1, 1);
    if (season === "autumn") {
      // Rays that twinkle around the rim.
      ctx.fillStyle = "#f9d27a";
      const turn = Math.floor(now / 160) % 2;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + turn * (Math.PI / 8);
        ctx.fillRect(
          Math.round(cx + Math.cos(angle) * 13),
          Math.round(cy + Math.sin(angle) * 13),
          1,
          1,
        );
      }
    }
  }

  /** After a knock the door opens and a pair of eyes blinks in the dark. */
  private drawDoor(
    ctx: CanvasRenderingContext2D,
    art: SeasonArt,
    dx: number,
    dy: number,
    now: number,
  ) {
    if (now >= this.doorOpenUntil) return;
    const x = art.cabin.x + 11 + dx;
    const y = art.cabin.y + 13 + dy;
    ctx.fillStyle = "#120a06";
    ctx.fillRect(x, y, 3, 6);
    if (Math.floor(now / 110) % 9 !== 0) {
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(x, y + 2, 1, 1);
      ctx.fillRect(x + 2, y + 2, 1, 1);
    }
  }

  /** A lighter, hazier copy of a winter layer for daylight. */
  private dayLayer(layer: HTMLCanvasElement) {
    let lit = this.dayLayers.get(layer);
    if (!lit) {
      lit = document.createElement("canvas");
      lit.width = layer.width;
      lit.height = layer.height;
      const ctx = lit.getContext("2d")!;
      ctx.drawImage(layer, 0, 0);
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "rgba(150, 178, 220, 0.62)";
      ctx.fillRect(0, 0, lit.width, lit.height);
      this.dayLayers.set(layer, lit);
    }
    return lit;
  }

  /** `hide` in [0, 1] dithers stars away (daylight, storm clouds). */
  private drawStars(ctx: CanvasRenderingContext2D, art: SeasonArt, hide = 0) {
    const p = PALETTE.winter;
    if (hide >= 1) return;
    for (const star of art.stars) {
      if (hide > 0 && bayer(star.x, star.y) < hide) continue;
      const bright = Math.sin(this.time * star.speed + star.phase) > 0.2;
      ctx.fillStyle = bright ? p.star : p.starDim;
      ctx.fillRect(star.x, star.y, 1, 1);
      if (star.big && bright) {
        ctx.fillStyle = p.starDim;
        ctx.fillRect(star.x - 1, star.y, 1, 1);
        ctx.fillRect(star.x + 1, star.y, 1, 1);
        ctx.fillRect(star.x, star.y - 1, 1, 1);
        ctx.fillRect(star.x, star.y + 1, 1, 1);
      }
    }
  }

  /** Ordered-dither aurora curtains in drifting patches; scrolling strengthens it. */
  private drawAurora(ctx: CanvasRenderingContext2D, strength: number, visibility = 1) {
    const colors = PALETTE.winter.aurora;
    const base = (0.36 + strength * 0.55) * visibility;
    const t = this.time;
    for (let x = 0; x < this.width; x++) {
      const patch =
        Math.sin(x * 0.06 + t * 0.4) * Math.sin(x * 0.021 - t * 0.25 + 1.3);
      if (patch <= 0.05) continue;
      // Vertical rays make it read as a curtain rather than a dot grid.
      const ray = 0.45 + 0.55 * Math.abs(Math.sin(x * 0.7 + Math.sin(x * 0.13 + t) * 2));
      const strength = base * Math.min(1, patch * 1.8) * ray;
      const bottom =
        16 + Math.round(3 * Math.sin(x * 0.045 + t * 0.6) + 2 * Math.sin(x * 0.11 - t * 0.35));
      for (let dy = 0; dy < 10; dy++) {
        const y = bottom - dy;
        if (y < 0) break;
        const falloff = dy < 3 ? 1 : 1 - (dy - 3) / 7;
        if (bayer(x, y) >= strength * falloff) continue;
        ctx.fillStyle = colors[dy < 3 ? 0 : dy < 7 ? 1 : 2];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  private drawBirds(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = PALETTE.autumn.bird;
    for (const bird of this.birds) {
      const x = Math.round(bird.x);
      const y = Math.round(bird.y);
      const up = (Math.floor(this.time * 5 + bird.phase) & 1) === 0;
      ctx.fillRect(x, y, 1, 1);
      ctx.fillRect(x - 1, up ? y - 1 : y, 1, 1);
      ctx.fillRect(x + 1, up ? y - 1 : y, 1, 1);
    }
  }

  private drawMeteor(ctx: CanvasRenderingContext2D) {
    for (const meteor of this.meteors) {
      METEOR_TRAIL.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(meteor.x + i * 2.4), Math.round(meteor.y - i), 1, 1);
      });
    }
  }

  private drawWindow(
    ctx: CanvasRenderingContext2D,
    season: Season,
    art: SeasonArt,
    dx: number,
    dy: number,
    now: number,
    night: number,
  ) {
    const lit = season === "winter" || night > 0.45 || now < this.windowLitUntil;
    if (!lit) return;
    const flicker = Math.sin(this.time * 9) + Math.sin(this.time * 13.7) > 1.2;
    ctx.fillStyle = flicker ? "#ffd98a" : PALETTE[season].cabin.window;
    ctx.fillRect(art.cabin.x + 5 + dx, art.cabin.y + 12 + dy, 3, 3);
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D,
    season: Season,
    kind: ParticleKind,
  ) {
    const smoke = PALETTE[season].smoke;
    for (const p of this.particles[season]) {
      if (p.kind !== kind) continue;
      const x = Math.round(p.x);
      const y = Math.round(p.y);

      if (kind === "smoke") {
        const t = p.age / p.life;
        if (bayer(x, y) < t - 0.2) continue;
        ctx.fillStyle = smoke[Math.min(2, Math.floor(t * 3))];
        const size = t < 0.4 ? 2 : 1;
        ctx.fillRect(x, y, size, size);
        continue;
      }

      if (kind === "spark") {
        ctx.fillStyle = p.color;
        if (p.age < 0.2) {
          ctx.fillRect(x, y, 1, 1);
          ctx.globalAlpha = 0.6;
          ctx.fillRect(x - 1, y, 3, 1);
          ctx.fillRect(x, y - 1, 1, 3);
          ctx.globalAlpha = 1;
        } else if ((Math.floor(p.age * 14) & 1) === 0) {
          ctx.fillRect(x, y, 1, 1);
        }
        continue;
      }

      if (kind === "rain") {
        // A short streak that leans with the wind.
        const lean = p.vx / p.vy;
        ctx.fillStyle = p.color;
        for (let i = 0; i < 3; i++) ctx.fillRect(Math.round(p.x - lean * i * 2), y - i * 2, 1, 2);
        continue;
      }

      if (kind === "splash") {
        ctx.fillStyle = "#c9d8ea";
        if (p.age < p.life / 2) {
          ctx.fillRect(x - 1, y - 1, 1, 1);
          ctx.fillRect(x + 1, y - 1, 1, 1);
        } else {
          ctx.fillRect(x - 1, y, 3, 1);
        }
        continue;
      }

      ctx.fillStyle = p.color;
      if (kind === "snow") {
        ctx.fillRect(x, y, p.size, p.size);
        // Wind-driven flakes leave a short streak behind them.
        if (p.vx > 14) ctx.fillRect(x - 1, y - (p.vy > 10 ? 1 : 0), 1, 1);
        continue;
      }

      // Leaves: settled ones lie flat and dissolve, falling ones flutter.
      if (p.settled) {
        const fade = (p.age - (p.life - 1.2)) / 1.2;
        if (fade > 0 && bayer(x, y) < fade) continue;
        ctx.fillRect(x, y, p.size, 1);
      } else if (p.size === 1) {
        ctx.fillRect(x, y, 1, 1);
      } else if ((Math.floor(p.age * 7 + p.phase) & 1) === 0) {
        ctx.fillRect(x, y, 2, 1);
        ctx.fillRect(x, y + 1, 1, 1);
      } else {
        ctx.fillRect(x + 1, y, 1, 1);
        ctx.fillRect(x, y + 1, 2, 1);
      }
    }
  }

  /** During the intro the sky dithers in from the panel colour. */
  private revealSky(now: number) {
    if (this.introStart === null || this.introStart < 0) return;
    const p = (now - this.introStart) / SKY_REVEAL_MS;
    if (p >= 1) return;
    const [r, g, b] = hexToRgb(PALETTE[this.season].panel);
    const image = this.ctx.getImageData(0, 0, this.width, SCENE_H);
    for (let y = 0; y < SCENE_H; y++) {
      for (let x = 0; x < this.width; x++) {
        if (bayer(x, y) < p) continue;
        const i = (y * this.width + x) * 4;
        image.data[i] = r;
        image.data[i + 1] = g;
        image.data[i + 2] = b;
      }
    }
    this.ctx.putImageData(image, 0, 0);
  }
}
