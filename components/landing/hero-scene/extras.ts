import { bayer, GROUND_Y, rng, Season, SeasonArt } from "./art";

/**
 * The scene's supporting cast: drifting clouds, pumpkins and a snowman, a
 * fox or penguin wandering past, fireflies after dark, and everything the
 * secret codes summon (fireworks, a UFO, a rain or snow storm, a turn of the
 * day). Weather and the day cycle are independent envelopes, so both codes
 * can run at once without cancelling each other.
 * The engine owns the loop; this module owns the state and the sprites.
 */
import type { CheatId } from "@/lib/pixel/cheats";

export { CHEATS, type CheatId } from "@/lib/pixel/cheats";
export type SceneFx = "boom" | "beam" | "hop" | "thunder" | "gust";

// Code effects fade in, hold, then fade out (seconds).
const FADE = 1.8;
const WEATHER_S = 14;
const CYCLE_S = 18;

/** 0 → 1 over FADE after `start`, back to 0 over FADE before `end`. */
function envelope(time: number, start: number, end: number) {
  return Math.max(0, Math.min(1, (time - start) / FADE, (end - time) / FADE));
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Palette = Record<string, string>;

// ---------- Sprites ----------

const PUMPKIN_BIG = ["...g...", ".ooOoo.", "oooOooo", "oooOooo", ".ooOoo."];
const PUMPKIN_BIG_LIT = ["...g...", ".ooOoo.", "oyoOoyo", "ooyyyoo", ".ooOoo."];
const PUMPKIN_SMALL = ["..g..", ".oOo.", "ooOoo", ".oOo."];
const PUMPKIN_SMALL_LIT = ["..g..", ".yOy.", "oyyyo", ".oOo."];

const SNOWMAN = [
  "...www...",
  "..wewew..",
  "..wwnnnn.",
  "...wwS...",
  "..wwwwS..",
  ".wwwbwwS.",
  ".wwwwwwS.",
  ".wwwbwwS.",
  "..wwwwS..",
];
const HAT = [".kkk.", ".kkk.", "kkkkk"];

const FOX_TOP = ["......o.o", "w.....oXo", "ooooooooX", ".ooooooW."];
const FOX = [
  [...FOX_TOP, ".o....o.."],
  [...FOX_TOP, "..o..o..."],
];
const PENGUIN_TOP = [".kkk.", "kkkek", "kkwwy", "kkwww", "kkwww", ".kww."];
const PENGUIN = [
  [...PENGUIN_TOP, ".y.y."],
  [...PENGUIN_TOP, "y...y"],
];

const UFO = [
  "....ggg....",
  "...ggggg...",
  ".mmmmmmmmm.",
  "mlmlmlmlmlm",
  "..mmmmmmm..",
];

const COLORS: Record<string, Palette> = {
  pumpkin: { g: "#5e6e2c", o: "#e0692e", O: "#b8471c", y: "#ffd24a" },
  snowman: { w: "#eef3ff", S: "#c9d6f2", e: "#1a1a2e", b: "#1a1a2e", n: "#f08a3e" },
  hat: { k: "#1a1a2e" },
  fox: { o: "#d2601f", w: "#fff6e5", W: "#fff6e5", X: "#2a1a12" },
  penguin: { k: "#1a1a2e", w: "#ffffff", e: "#ffffff", y: "#f2a93b" },
  ufo: { g: "#9fe7f5", m: "#8a94a8" },
};

const FIREWORK = ["#ff6b6b", "#ffd24a", "#6bff9e", "#6bc8ff", "#f59eff", "#ffffff"];
const LIGHTS = ["#ff6b6b", "#ffd24a", "#6bff9e", "#6bc8ff"];
const UFO_LIGHTS = ["#ff5f5f", "#ffd24a", "#7cff9b"];

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: string[],
  colors: Palette,
  x: number,
  y: number,
  flip = false,
) {
  const width = grid[0].length;
  grid.forEach((row, dy) => {
    for (let dx = 0; dx < width; dx++) {
      const color = colors[row[dx]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + (flip ? width - 1 - dx : dx), y + dy, 1, 1);
    }
  });
}

// ---------- State ----------

interface Cloud {
  x: number;
  y: number;
  speed: number;
  canvas: HTMLCanvasElement;
}

interface Critter {
  x: number;
  dir: 1 | -1;
  speed: number;
  age: number;
  hopStart: number;
  lift: number;
  frozen: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  color: string;
  rocket: boolean;
}

interface Firefly {
  x: number;
  y: number;
  phase: number;
}

interface Ufo {
  x: number;
  y: number;
  phase: "in" | "beam" | "out";
  t: number;
  targetX: number;
}

type CloudSet = Season | "day";

function buildCloud(rand: () => number, set: CloudSet) {
  const w = 16 + Math.floor(rand() * 12);
  const h = 7;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const light = { autumn: "#fff4de", winter: "#3e5590", day: "#f4f8ff" }[set];
  const shade = { autumn: "#f3cf9c", winter: "#2f4274", day: "#c9d6ec" }[set];
  const blobs = [
    { x: w * 0.3, y: 4, rx: w * 0.28, ry: 3 },
    { x: w * 0.55, y: 3, rx: w * 0.3, ry: 3.2 },
    { x: w * 0.78, y: 4.5, rx: w * 0.22, ry: 2.4 },
  ];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inside = blobs.some(
        (b) => ((x + 0.5 - b.x) / b.rx) ** 2 + ((y + 0.5 - b.y) / b.ry) ** 2 <= 1,
      );
      if (!inside) continue;
      ctx.fillStyle = y >= h - 2 ? shade : light;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

/** A pale, low winter sun for the day half of the cycle (same size as the moon). */
function buildWinterSun() {
  const r = 7;
  const halo = 10;
  const size = halo * 2 + 1;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  for (let y = -halo; y <= halo; y++) {
    for (let x = -halo; x <= halo; x++) {
      const d = x * x + y * y;
      let color: string | null = null;
      if (d <= r * r + r * 0.8) color = (x + 3) ** 2 + (y + 3) ** 2 <= 5 ? "#fffbea" : "#ffeebb";
      else if (d <= halo * halo && ((x + y) & 1) === 0) color = "#e6eefa";
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + halo, y + halo, 1, 1);
    }
  }
  return canvas;
}

export class SceneExtras {
  private width = 0;
  private clouds: Record<CloudSet, Cloud[]> = { autumn: [], winter: [], day: [] };
  private winterSun: HTMLCanvasElement | null = null;
  private fireflies: Firefly[] = [];
  critter: Critter | null = null;
  private critterSeason: Season = "autumn";
  private nextCritter = 7;
  private sparks: Spark[] = [];
  private rocketsLeft = 0;
  private nextRocket = 0;
  private ufo: Ufo | null = null;
  private weatherSpan = { start: -100, end: -100 };
  private cycleSpan = { start: -100, end: -100 };
  private lanternUntil = 0;
  private hatStart = -10_000;

  constructor(width: number) {
    this.resize(width);
  }

  resize(width: number) {
    this.width = width;
    const rand = rng(width * 31 + 7);
    for (const set of ["autumn", "winter", "day"] as const) {
      this.clouds[set] = Array.from({ length: 3 }, (_, i) => ({
        x: (width / 3) * i + rand() * 30,
        y: 3 + Math.floor(rand() * 13),
        speed: 1.2 + rand() * 1.8,
        canvas: buildCloud(rand, set),
      }));
    }
    this.fireflies = Array.from({ length: 16 }, () => ({
      x: rand() * width,
      y: 36 + rand() * 20,
      phase: rand() * Math.PI * 2,
    }));
  }

  /** Strength of the weather code: a downpour in autumn, a snowstorm in winter. */
  weather(time: number) {
    return envelope(time, this.weatherSpan.start, this.weatherSpan.end);
  }

  /** Strength of the day-cycle code: evening in autumn, daylight in winter. */
  cycle(time: number) {
    return envelope(time, this.cycleSpan.start, this.cycleSpan.end);
  }

  /** Restart a span without a jump if it is still running. */
  private extend(span: { start: number; end: number }, time: number, length: number) {
    const level = envelope(time, span.start, span.end);
    span.start = time - level * FADE;
    span.end = time + length;
  }

  // ---------- Rectangles for hit testing and markers ----------

  decorRects(season: Season, art: SeasonArt, dx: number): Rect[] {
    const cabinX = art.cabin.x + dx;
    if (season === "autumn") {
      return [
        { x: cabinX - 10, y: GROUND_Y - 4, w: 7, h: 5 },
        { x: cabinX + 20, y: GROUND_Y - 3, w: 5, h: 4 },
      ];
    }
    return [{ x: cabinX - 15, y: GROUND_Y - 11, w: 9, h: 12 }];
  }

  critterRect(season: Season): Rect | null {
    const c = this.critter;
    if (!c || this.critterSeason !== season) return null;
    const [w, h] = season === "autumn" ? [9, 5] : [5, 7];
    return { x: Math.round(c.x), y: GROUND_Y + 1 - h - c.lift - this.hop(c), w, h };
  }

  private hop(c: Critter) {
    const t = (performance.now() - c.hopStart) / 380;
    return t >= 0 && t < 1 ? Math.round(Math.sin(t * Math.PI) * 7) : 0;
  }

  // ---------- Interactions ----------

  pokeDecor(season: Season, now: number) {
    if (season === "autumn") this.lanternUntil = now + 6500;
    else this.hatStart = now;
  }

  pokeCritter(now: number) {
    const c = this.critter;
    if (!c || c.frozen) return;
    c.hopStart = now;
    c.speed *= 3.2;
  }

  cheat(id: CheatId, season: Season, time: number) {
    if (id === "fireworks") {
      this.rocketsLeft = 7;
      this.nextRocket = 0;
    } else if (id === "weather") {
      this.extend(this.weatherSpan, time, WEATHER_S);
    } else if (id === "cycle") {
      this.extend(this.cycleSpan, time, CYCLE_S);
    } else if (id === "ufo" && !this.ufo) {
      if (!this.critter || this.critterSeason !== season) this.spawnCritter(season, true);
      const c = this.critter!;
      c.frozen = true;
      this.ufo = { x: -14, y: 9, phase: "in", t: 0, targetX: Math.round(c.x) };
    }
  }

  private spawnCritter(season: Season, centre = false) {
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    this.critterSeason = season;
    this.critter = {
      x: centre ? this.width * 0.42 : dir === 1 ? -10 : this.width + 2,
      dir,
      speed: season === "autumn" ? 14 : 8,
      age: 0,
      hopStart: -10_000,
      lift: 0,
      frozen: false,
    };
  }

  // ---------- Update ----------

  update(
    dt: number,
    time: number,
    season: Season,
    urgentCritter: boolean,
    onFx: (fx: SceneFx) => void,
  ) {
    for (const s of ["autumn", "winter", "day"] as const) {
      for (const cloud of this.clouds[s]) {
        cloud.x += cloud.speed * dt;
        if (cloud.x > this.width + 4) cloud.x = -cloud.canvas.width - 4;
      }
    }

    // A critter wanders past now and then (sooner if it's the last secret).
    const c = this.critter;
    if (c && this.critterSeason !== season && !c.frozen) this.critter = null;
    if (!this.critter) {
      this.nextCritter -= dt;
      if (this.nextCritter <= 0) {
        this.spawnCritter(season);
        this.nextCritter = urgentCritter ? 3 + Math.random() * 3 : 10 + Math.random() * 8;
      }
    } else if (!this.critter.frozen) {
      const critter = this.critter;
      critter.age += dt;
      critter.x += critter.dir * critter.speed * dt;
      if (critter.x < -14 || critter.x > this.width + 4) this.critter = null;
    }

    if (this.ufo) this.updateUfo(dt, onFx);

    if (this.rocketsLeft > 0) {
      this.nextRocket -= dt;
      if (this.nextRocket <= 0) {
        this.rocketsLeft--;
        this.nextRocket = 0.32 + Math.random() * 0.2;
        this.sparks.push({
          x: this.width * (0.15 + Math.random() * 0.7),
          y: GROUND_Y,
          vx: (Math.random() - 0.5) * 6,
          vy: -52 - Math.random() * 12,
          age: 0,
          life: 3,
          color: FIREWORK[Math.floor(Math.random() * FIREWORK.length)],
          rocket: true,
        });
      }
    }
    const next: Spark[] = [];
    for (const s of this.sparks) {
      s.age += dt;
      s.vy += (s.rocket ? 26 : 14) * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.rocket && (s.vy > -6 || s.y < 9)) {
        onFx("boom");
        const count = 20 + Math.floor(Math.random() * 8);
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const speed = 15 + Math.random() * 16;
          next.push({
            x: s.x,
            y: s.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            age: 0,
            life: 1 + Math.random() * 0.5,
            color: Math.random() < 0.2 ? "#ffffff" : s.color,
            rocket: false,
          });
        }
        continue;
      }
      if (s.age < s.life) next.push(s);
    }
    this.sparks = next;
  }

  private updateUfo(dt: number, onFx: (fx: SceneFx) => void) {
    const ufo = this.ufo!;
    ufo.t += dt;
    const c = this.critter;
    if (ufo.phase === "in") {
      ufo.x += 46 * dt;
      if (ufo.x + 5 >= ufo.targetX + 3) {
        ufo.phase = "beam";
        ufo.t = 0;
        onFx("beam");
      }
    } else if (ufo.phase === "beam") {
      if (c) c.lift = Math.min(GROUND_Y - 16, Math.round(ufo.t * 22));
      if (ufo.t > 1.9) {
        this.critter = null;
        ufo.phase = "out";
        ufo.t = 0;
      }
    } else {
      ufo.x += 70 * dt;
      ufo.y -= 26 * dt;
      if (ufo.x > this.width + 16 || ufo.y < -10) this.ufo = null;
    }
  }

  // ---------- Drawing ----------

  drawClouds(ctx: CanvasRenderingContext2D, season: Season, shift: number, day: number) {
    const set: CloudSet = season === "winter" && day > 0.5 ? "day" : season;
    for (const cloud of this.clouds[set]) {
      ctx.drawImage(cloud.canvas, Math.round(cloud.x) + shift, cloud.y);
    }
  }

  drawStarsAtNight(
    ctx: CanvasRenderingContext2D,
    art: SeasonArt,
    time: number,
    night: number,
  ) {
    if (night < 0.7) return;
    const share = (night - 0.7) / 0.3;
    art.stars.forEach((star, i) => {
      if (i / art.stars.length > share) return;
      const bright = Math.sin(time * star.speed + star.phase) > 0.2;
      ctx.fillStyle = bright ? "#fff6d6" : "#c9a7b8";
      ctx.fillRect(star.x, star.y, 1, 1);
    });
  }

  drawWinterSun(ctx: CanvasRenderingContext2D, x: number, y: number) {
    this.winterSun ??= buildWinterSun();
    ctx.drawImage(this.winterSun, x, y);
  }

  drawUfo(ctx: CanvasRenderingContext2D, time: number) {
    const ufo = this.ufo;
    if (!ufo) return;
    const x = Math.round(ufo.x);
    const y = Math.round(ufo.y + Math.sin(time * 6) * 1);
    if (ufo.phase === "beam") {
      const cx = x + 5;
      for (let dy = 5; dy < GROUND_Y + 1 - y; dy++) {
        const half = 1 + Math.floor((dy - 5) * 0.35);
        for (let dx = -half; dx <= half; dx++) {
          if (bayer(cx + dx, y + dy) >= 0.4) continue;
          ctx.fillStyle = "#b6f5ff";
          ctx.fillRect(cx + dx, y + dy, 1, 1);
        }
      }
    }
    const step = Math.floor(time * 8);
    drawGrid(ctx, UFO, { ...COLORS.ufo, l: UFO_LIGHTS[step % 3] }, x, y);
    ctx.fillStyle = UFO_LIGHTS[(step + 1) % 3];
    ctx.fillRect(x + 2, y + 3, 1, 1);
    ctx.fillRect(x + 8, y + 3, 1, 1);
  }

  drawCabinExtras(
    ctx: CanvasRenderingContext2D,
    season: Season,
    art: SeasonArt,
    dx: number,
    dy: number,
    time: number,
  ) {
    if (season !== "winter") return;
    const x = art.cabin.x + dx;
    const y = art.cabin.y + dy;
    const step = Math.floor(time * 3);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = LIGHTS[(i + step) % LIGHTS.length];
      ctx.fillRect(x + 1 + i * 3, y + 7, 1, 1);
    }
  }

  drawDecor(
    ctx: CanvasRenderingContext2D,
    season: Season,
    art: SeasonArt,
    dx: number,
    now: number,
  ) {
    const rects = this.decorRects(season, art, dx);
    if (season === "autumn") {
      const lit = now < this.lanternUntil;
      const glow = Math.floor(now / 120) % 3 === 0 ? "#ffb02e" : "#ffd24a";
      const colors = { ...COLORS.pumpkin, y: glow };
      drawGrid(ctx, lit ? PUMPKIN_BIG_LIT : PUMPKIN_BIG, colors, rects[0].x, rects[0].y);
      drawGrid(ctx, lit ? PUMPKIN_SMALL_LIT : PUMPKIN_SMALL, colors, rects[1].x, rects[1].y);
      return;
    }
    // Snowman: the hat pops off and the arms wave after a poke.
    const r = rects[0];
    const t = (now - this.hatStart) / 900;
    const hatLift = t >= 0 && t < 1 ? Math.round(Math.sin(t * Math.PI) * 9) : 0;
    const waving = now - this.hatStart < 2200;
    drawGrid(ctx, SNOWMAN, COLORS.snowman, r.x, r.y + 3);
    drawGrid(ctx, HAT, COLORS.hat, r.x + 2, r.y - hatLift);
    ctx.fillStyle = "#5a3e36";
    const up = waving && Math.floor(now / 140) % 2 === 0;
    ctx.fillRect(r.x, r.y + 7, 1, 1);
    ctx.fillRect(r.x - 1, r.y + 6, 1, 1);
    ctx.fillRect(r.x + 8, r.y + 7, 1, 1);
    ctx.fillRect(r.x + 9, r.y + (up ? 4 : 6), 1, 1);
    if (up) ctx.fillRect(r.x + 9, r.y + 5, 1, 1);
  }

  drawCritter(ctx: CanvasRenderingContext2D, season: Season, time: number) {
    const rect = this.critterRect(season);
    const c = this.critter;
    if (!rect || !c) return;
    const frame = c.frozen ? 0 : Math.floor(time * (season === "autumn" ? 8 : 5)) % 2;
    const flip = c.dir === -1;
    if (season === "autumn") {
      drawGrid(ctx, FOX[frame], COLORS.fox, rect.x, rect.y, flip);
    } else {
      // Penguins waddle: the body rocks a pixel side to side.
      const rock = c.frozen ? 0 : frame;
      drawGrid(ctx, PENGUIN[frame], COLORS.penguin, rect.x + rock, rect.y, flip);
    }
  }

  drawFireflies(ctx: CanvasRenderingContext2D, time: number, night: number) {
    if (night < 0.55) return;
    ctx.fillStyle = "#f9e27a";
    for (const fly of this.fireflies) {
      if (Math.sin(time * 3 + fly.phase) < 0.25) continue;
      ctx.fillRect(
        Math.round(fly.x + Math.sin(time * 0.7 + fly.phase) * 6),
        Math.round(fly.y + Math.sin(time * 1.3 + fly.phase * 2) * 3),
        1,
        1,
      );
    }
  }

  drawFireworks(ctx: CanvasRenderingContext2D) {
    for (const s of this.sparks) {
      if (!s.rocket && s.age > s.life * 0.7 && Math.floor(s.age * 20) % 2 === 0) continue;
      ctx.fillStyle = s.color;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
      if (s.rocket) {
        ctx.fillStyle = "#f9d27a";
        ctx.fillRect(Math.round(s.x), Math.round(s.y) + 1, 1, 1);
        ctx.fillStyle = "#8a6a4a";
        ctx.fillRect(Math.round(s.x), Math.round(s.y) + 2, 1, 1);
      }
    }
  }
}
