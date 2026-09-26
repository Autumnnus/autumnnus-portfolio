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

/**
 * Runtime for the hero landscape: parallax layers, weather particles, birds,
 * a shooting star, scroll-driven dusk and a dithered cross-fade between
 * seasons. Positions are floats but everything is drawn on whole pixels, so
 * motion reads as stepped pixel animation. Units are scene pixels/second.
 */
type ParticleKind = "leaf" | "snow" | "spark" | "smoke";

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

/** Clickable spots in the scene; finding all three is a small quest. */
export type HotspotId = "tree" | "cabin" | "sky";
export const HOTSPOTS: HotspotId[] = ["tree", "cabin", "sky"];
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
  private spawnDebt = { leaf: 0, snow: 0, smoke: 0 };
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
    const cel = art.celestial;
    return { x: L.celX, y: L.celY, w: cel.w, h: cel.h };
  }

  /** Which hotspot (if any) sits under a scene point. */
  hitTest(x: number, y: number): { id: HotspotId; tree?: TreeSprite } | null {
    if (!this.art) return null;
    const inside = (r: SceneRect | null) =>
      !!r && x >= r.x - 1 && x <= r.x + r.w + 1 && y >= r.y - 1 && y <= r.y + r.h;
    const L = this.layout;
    const tree = this.art[this.visibleSeason()].trees.find((t) =>
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
    return 2 + Math.sin(this.time * 0.3) * 3 + storm;
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

  private spawnSnow(from?: { x: number; y: number }, burst = false) {
    if (this.particles.winter.length >= MAX_SNOW) return;
    const big = !burst && Math.random() < 0.1;
    this.particles.winter.push({
      kind: "snow",
      x: from ? from.x : Math.random() * (this.width + 30) - 15,
      y: from ? from.y : -2,
      vx: burst
        ? (Math.random() - 0.5) * 20
        : this.wind() * 0.6 - 2 + (Math.random() - 0.5) * 2,
      vy: burst ? -4 - Math.random() * 10 : (big ? 9 : 4) + Math.random() * 4,
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
    const leafRate = visible === "autumn" ? (storming ? 40 : 3) : 0;
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

    ctx.drawImage(this.sky(season, season === "autumn" ? this.scroll : 0), 0, 0);

    if (season === "winter") {
      this.drawStars(ctx, art);
      this.drawAurora(ctx);
    }

    const cel = art.celestial;
    let celY = season === "autumn" ? 20 : 7;
    if (season === "autumn") celY += Math.round(this.scroll * 14);
    celY += Math.round((leave + arrive) * 26) + this.introOffset("celestial", now);
    const celX = Math.round(W * 0.76) - Math.floor(cel.w / 2) + shift(0.8);
    ctx.drawImage(cel.canvas, celX, celY);
    if (now < this.faceUntil) this.drawFace(ctx, season, celX + 10, celY + 10, now);

    if (season === "winter") this.drawMeteor(ctx);
    else this.drawBirds(ctx);

    ctx.drawImage(
      art.far,
      -OVERSCAN + shift(1.5),
      Math.round(this.parallax.y) + this.introOffset("far", now),
    );

    const midY = this.introOffset("mid", now);
    ctx.drawImage(art.mid, -OVERSCAN + shift(3), midY);
    ctx.drawImage(art.cabin.canvas, art.cabin.x + shift(3), art.cabin.y + midY);
    this.drawWindow(ctx, season, art, shift(3), midY, now);
    this.drawDoor(ctx, art, shift(3), midY, now);
    this.drawParticles(ctx, season, "smoke");

    ctx.drawImage(art.ground, -OVERSCAN + shift(4), this.introOffset("ground", now));

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

    this.drawParticles(ctx, season, season === "autumn" ? "leaf" : "snow");
    this.drawParticles(ctx, season, "spark");

    if (season === this.visibleSeason()) {
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
      const r = this.hotspot(id);
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

  private drawStars(ctx: CanvasRenderingContext2D, art: SeasonArt) {
    const p = PALETTE.winter;
    for (const star of art.stars) {
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
  private drawAurora(ctx: CanvasRenderingContext2D) {
    const colors = PALETTE.winter.aurora;
    const base = 0.36 + this.scroll * 0.55;
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
  ) {
    const lit =
      season === "winter" || this.scroll > 0.45 || now < this.windowLitUntil;
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

      ctx.fillStyle = p.color;
      if (kind === "snow") {
        ctx.fillRect(x, y, p.size, p.size);
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
