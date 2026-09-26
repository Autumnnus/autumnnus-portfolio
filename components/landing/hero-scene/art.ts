/**
 * Static art for the hero scene, generated once per width and season into
 * offscreen canvases. Everything is seeded so a given width always draws the
 * same landscape. Coordinates are logical scene pixels (the canvas is scaled
 * up 2–4× with `image-rendering: pixelated`).
 */
export type Season = "autumn" | "winter";

export const SCENE_H = 70;
export const GROUND_Y = 58;
/** Extra width on each side of the parallax layers. */
export const OVERSCAN = 8;

// 8×8 ordered-dither matrix, normalised to [0, 1).
const BAYER8_RAW = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36,
  14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23,
  61, 29, 53, 21,
];
export const BAYER8 = BAYER8_RAW.map((v) => v / 64);
export const bayer = (x: number, y: number) => BAYER8[(y & 7) * 8 + (x & 7)];

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PALETTE = {
  autumn: {
    // Sky bands top → horizon, one row per dusk level (scroll sinks the sun).
    sky: [
      ["#fbe6bd", "#f8d59c", "#f4be7c", "#f2ab66"],
      ["#f7d6aa", "#f3bf88", "#eea26a", "#e78a4f"],
      ["#ecbba2", "#e39c7c", "#da7e5c", "#c96341"],
      ["#b98d9e", "#a07088", "#8d5871", "#6f4259"],
    ],
    far: "#e39a5b",
    farTop: "#eeb177",
    mid: "#c2672f",
    midTop: "#d67d40",
    grass: "#9c7a2a",
    tuft: "#8a6a22",
    soil: "#7a3d1e",
    pebble: "#5a2a16",
    sun: "#f07a30",
    sunCore: "#f79a4e",
    trunk: "#4a2a16",
    trunkShade: "#361d0e",
    leaves: ["#e0692e", "#c23b22", "#e8b040", "#d4552a"],
    cabin: {
      wall: "#8b4a26",
      roof: "#5a2a16",
      roofTop: "#6e3a1e",
      door: "#3a1c0e",
      window: "#e8b040",
      chimney: "#5a2a16",
    },
    smoke: ["#f3e3c2", "#ead2a6", "#e0c290"],
    bird: "#6b3a22",
    spark: ["#f9d27a", "#e8b040"],
    panel: "#fff6e5",
  },
  winter: {
    // Night, then the pale day the cycle code brings.
    sky: [
      ["#0e1530", "#141e40", "#1a2750", "#223466"],
      ["#9db8de", "#b3c9e8", "#c8d8f0", "#dde7f6"],
    ],
    far: "#2a3f73",
    farShade: "#24376a",
    snowCap: "#dce8f7",
    mid: "#dce8f7",
    midTop: "#eef3ff",
    ground: "#c4d4ec",
    groundTop: "#dce8f7",
    groundMark: "#9cb1d6",
    moon: "#eef3ff",
    crater: "#c9d6f2",
    halo: "#2e4174",
    star: "#eef3ff",
    starDim: "#7d8fc2",
    pine: "#1f4a45",
    pineShade: "#173a36",
    pineTrunk: "#3a2a22",
    snow: "#eef3ff",
    aurora: ["#3fd8a8", "#7fe8c8", "#9b8cf0"],
    cabin: {
      wall: "#5a3e36",
      roof: "#eef3ff",
      roofTop: "#c9d6f2",
      door: "#2a1e1a",
      window: "#f2b45a",
      chimney: "#3a2a22",
    },
    smoke: ["#8fa3c8", "#6f84ae", "#556a96"],
    spark: ["#ffffff", "#8fd8f2"],
    panel: "#1f2b4d",
  },
} as const;

export interface Sprite {
  canvas: HTMLCanvasElement;
  /** Top-left in scene coordinates. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TreeSprite extends Sprite {
  /** Canopy pixels (scene coordinates) that leaves and snow shake loose from. */
  canopy: { x: number; y: number }[];
  shakeUntil: number;
}

export interface Star {
  x: number;
  y: number;
  phase: number;
  speed: number;
  big: boolean;
}

export interface SeasonArt {
  far: HTMLCanvasElement;
  mid: HTMLCanvasElement;
  ground: HTMLCanvasElement;
  trees: TreeSprite[];
  cabin: Sprite;
  celestial: Sprite;
  stars: Star[];
}

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas, ctx };
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

/** Stepped plateau ridge, like hand-drawn pixel hills. */
function ridge(
  rand: () => number,
  length: number,
  base: number,
  amp: number,
  minStep: number,
  maxStep: number,
) {
  const heights = new Array<number>(length);
  let x = 0;
  let y = base;
  while (x < length) {
    const step = minStep + Math.floor(rand() * (maxStep - minStep + 1));
    for (let i = 0; i < step && x < length; i++, x++) heights[x] = y;
    const delta = (rand() < 0.5 ? -1 : 1) * (1 + Math.floor(rand() * amp));
    y = Math.max(base - amp * 2, Math.min(base + amp, y + delta));
  }
  return heights;
}

function fillRidge(
  ctx: CanvasRenderingContext2D,
  heights: number[],
  body: string,
  top: string,
) {
  heights.forEach((h, x) => {
    ctx.fillStyle = body;
    ctx.fillRect(x, h, 1, SCENE_H - h);
    px(ctx, x, h, top);
  });
}

// ---------- Sky ----------

const BAND_TOPS = [0, 12, 26, 40];

export function buildSky(width: number, colors: readonly string[]) {
  const { canvas, ctx } = makeCanvas(width, SCENE_H);
  for (let y = 0; y < SCENE_H; y++) {
    let band = 0;
    while (band < 3 && y >= BAND_TOPS[band + 1]) band++;
    ctx.fillStyle = colors[band];
    ctx.fillRect(0, y, width, 1);
    // Two checkerboard rows lead into the next band.
    const next = BAND_TOPS[band + 1];
    if (band < 3 && y >= next - 2) {
      for (let x = y & 1; x < width; x += 2) px(ctx, x, y, colors[band + 1]);
    }
  }
  return canvas;
}

/** Blends two sky canvases with an ordered dither, `amount` in [0, 1]. */
export function blendSky(a: HTMLCanvasElement, b: HTMLCanvasElement, amount: number) {
  const { canvas, ctx } = makeCanvas(a.width, a.height);
  ctx.drawImage(a, 0, 0);
  const top = b.getContext("2d")?.getImageData(0, 0, b.width, b.height);
  const out = ctx.getImageData(0, 0, a.width, a.height);
  if (!top) return canvas;
  for (let y = 0; y < a.height; y++) {
    for (let x = 0; x < a.width; x++) {
      if (bayer(x, y) >= amount) continue;
      const i = (y * a.width + x) * 4;
      out.data[i] = top.data[i];
      out.data[i + 1] = top.data[i + 1];
      out.data[i + 2] = top.data[i + 2];
    }
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

// ---------- Trees ----------

interface Blob {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

function deciduousTree(
  rand: () => number,
  baseX: number,
  scale: number,
  colors: { base: string; shade: string; light: string },
): TreeSprite {
  const w = Math.round(34 * scale);
  const h = Math.round(40 * scale);
  const { canvas, ctx } = makeCanvas(w, h);
  const cx = Math.floor(w / 2);
  const cy = Math.round(14 * scale);
  const p = PALETTE.autumn;

  // Trunk with a little root flare and two branches.
  const trunkW = Math.max(2, Math.round(4 * scale));
  const trunkX = cx - Math.floor(trunkW / 2);
  const trunkTop = Math.round(20 * scale);
  ctx.fillStyle = p.trunk;
  ctx.fillRect(trunkX, trunkTop, trunkW, h - trunkTop);
  ctx.fillRect(trunkX - 1, h - 2, trunkW + 2, 2);
  ctx.fillStyle = p.trunkShade;
  ctx.fillRect(trunkX + trunkW - 1, trunkTop, 1, h - trunkTop);
  for (let i = 0; i < Math.round(4 * scale); i++) {
    px(ctx, trunkX - 1 - i, trunkTop + 4 - Math.floor(i / 2), p.trunk);
    px(ctx, trunkX + trunkW + i, trunkTop + 2 - Math.floor(i / 2), p.trunk);
  }

  const blobs: Blob[] = [
    { x: 0, y: 0, rx: 11, ry: 8 },
    { x: -7, y: 4, rx: 7, ry: 6 },
    { x: 8, y: 3, rx: 8, ry: 6 },
    { x: 0, y: 7, rx: 10, ry: 5 },
    { x: -2, y: -6, rx: 7, ry: 5 },
  ].map((b) => ({
    x: b.x * scale,
    y: b.y * scale,
    rx: b.rx * scale,
    ry: b.ry * scale,
  }));
  const inside = (x: number, y: number) =>
    blobs.some(
      (b) => ((x - b.x) / b.rx) ** 2 + ((y - b.y) / b.ry) ** 2 <= 1,
    );

  const canopy: { x: number; y: number }[] = [];
  for (let y = -cy; y < h - cy; y++) {
    for (let x = -cx; x < w - cx; x++) {
      if (!inside(x, y)) continue;
      const shade = x * 0.5 + y * 0.85;
      const noise = rand();
      let color: string = colors.base;
      if (shade > 6 * scale || !inside(x, y + 1)) color = colors.shade;
      else if (shade < -7 * scale) color = colors.light;
      if (noise < 0.07) color = colors.light;
      else if (noise > 0.95) color = colors.shade;
      px(ctx, cx + x, cy + y, color);
      canopy.push({ x: cx + x, y: cy + y });
    }
  }

  const x = baseX - cx;
  const y = GROUND_Y + 1 - h;
  return {
    canvas,
    x,
    y,
    w,
    h,
    canopy: canopy.map((c) => ({ x: c.x + x, y: c.y + y })),
    shakeUntil: 0,
  };
}

function pineTree(rand: () => number, baseX: number, tiers: number[][]): TreeSprite {
  const p = PALETTE.winter;
  const w = Math.max(...tiers.map(([tw]) => tw)) + 2;
  const tierH = tiers.reduce((sum, [, th]) => sum + th, 0);
  const trunkH = 4;
  const h = tierH + trunkH;
  const { canvas, ctx } = makeCanvas(w, h);
  const cx = Math.floor(w / 2);
  const canopy: { x: number; y: number }[] = [];

  let y = 0;
  for (const [tw, th] of tiers) {
    const left = cx - Math.floor(tw / 2);
    for (let row = 0; row < th; row++) {
      for (let x = left; x < left + tw; x++) {
        const color = x < cx ? p.pine : p.pineShade;
        px(ctx, x, y + row, color);
        canopy.push({ x, y: y + row });
      }
    }
    // Snow sits on the left of each tier's top edge, a little ragged.
    const snowRun = Math.max(1, Math.round(tw * 0.45));
    for (let x = left; x < left + snowRun; x++) px(ctx, x, y, p.snow);
    if (rand() < 0.6) px(ctx, left + snowRun, y, p.snow);
    y += th;
  }
  ctx.fillStyle = p.pineTrunk;
  ctx.fillRect(cx - 2, tierH, 4, trunkH);

  const x = baseX - cx;
  const top = GROUND_Y + 1 - h;
  return {
    canvas,
    x,
    y: top,
    w,
    h,
    canopy: canopy.map((c) => ({ x: c.x + x, y: c.y + top })),
    shakeUntil: 0,
  };
}

const PINE_BIG = [
  [2, 2],
  [6, 3],
  [10, 3],
  [14, 4],
  [18, 4],
  [22, 4],
];
const PINE_SMALL = [
  [2, 2],
  [6, 3],
  [10, 3],
  [14, 4],
];

// ---------- Cabin ----------

function cabin(season: Season, centerX: number): Sprite {
  const c = PALETTE[season].cabin;
  const { canvas, ctx } = makeCanvas(18, 19);
  ctx.fillStyle = c.chimney;
  ctx.fillRect(12, 0, 2, 4);
  if (season === "winter") {
    ctx.fillStyle = PALETTE.winter.snow;
    ctx.fillRect(12, 0, 2, 1);
  }
  ctx.fillStyle = c.roof;
  ctx.fillRect(4, 3, 10, 2);
  ctx.fillRect(2, 5, 14, 2);
  ctx.fillRect(0, 7, 18, 2);
  // Autumn roofs catch light on the ridge; snowy roofs shade at the eave.
  ctx.fillStyle = c.roofTop;
  if (season === "winter") ctx.fillRect(0, 8, 18, 1);
  else ctx.fillRect(4, 3, 10, 1);
  ctx.fillStyle = c.wall;
  ctx.fillRect(2, 9, 14, 10);
  ctx.fillStyle = c.door;
  ctx.fillRect(11, 13, 3, 6);
  ctx.fillStyle = c.window;
  ctx.fillRect(5, 12, 3, 3);
  if (season === "winter") {
    // Icicles hang off the eaves on both sides of the wall.
    ctx.fillStyle = "#cfe9ff";
    ctx.fillRect(0, 9, 1, 2);
    ctx.fillRect(1, 9, 1, 1);
    ctx.fillRect(16, 9, 1, 1);
    ctx.fillRect(17, 9, 1, 2);
  }
  return { canvas, x: centerX - 9, y: 37, w: 18, h: 19 };
}

// ---------- Sun & moon ----------

function sun(): Sprite {
  const p = PALETTE.autumn;
  const r = 10;
  const size = r * 2 + 1;
  const { canvas, ctx } = makeCanvas(size, size);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (d > r * r + r * 0.8) continue;
      const glint = (x + 4) ** 2 + (y + 4) ** 2 <= 5;
      px(ctx, x + r, y + r, glint ? p.sunCore : p.sun);
    }
  }
  return { canvas, x: 0, y: 0, w: size, h: size };
}

function moon(): Sprite {
  const p = PALETTE.winter;
  const r = 7;
  const halo = 10;
  const size = halo * 2 + 1;
  const { canvas, ctx } = makeCanvas(size, size);
  for (let y = -halo; y <= halo; y++) {
    for (let x = -halo; x <= halo; x++) {
      const d = x * x + y * y;
      if (d <= r * r + r * 0.8) px(ctx, x + halo, y + halo, p.moon);
      else if (d <= halo * halo && ((x + y) & 1) === 0)
        px(ctx, x + halo, y + halo, p.halo);
    }
  }
  ctx.fillStyle = p.crater;
  ctx.fillRect(halo - 3, halo - 1, 2, 2);
  ctx.fillRect(halo + 2, halo + 2, 3, 2);
  ctx.fillRect(halo, halo - 4, 2, 1);
  return { canvas, x: 0, y: 0, w: size, h: size };
}

// ---------- Layers ----------

function autumnLayers(width: number, rand: () => number) {
  const p = PALETTE.autumn;
  const len = width + OVERSCAN * 2;

  const far = makeCanvas(len, SCENE_H);
  fillRidge(far.ctx, ridge(rand, len, 40, 2, 10, 20), p.far, p.farTop);

  const mid = makeCanvas(len, SCENE_H);
  fillRidge(mid.ctx, ridge(rand, len, 50, 1, 12, 22), p.mid, p.midTop);

  const ground = makeCanvas(len, SCENE_H);
  ground.ctx.fillStyle = p.soil;
  ground.ctx.fillRect(0, GROUND_Y, len, SCENE_H - GROUND_Y);
  ground.ctx.fillStyle = p.grass;
  ground.ctx.fillRect(0, GROUND_Y, len, 1);
  for (let x = 0; x < len; x++) {
    if (rand() < 0.12) px(ground.ctx, x, GROUND_Y - 1, p.tuft);
    if (rand() < 0.05) {
      px(ground.ctx, x, GROUND_Y + 3 + Math.floor(rand() * 8), p.pebble);
    }
  }
  return { far: far.canvas, mid: mid.canvas, ground: ground.canvas };
}

function winterLayers(width: number, rand: () => number) {
  const p = PALETTE.winter;
  const len = width + OVERSCAN * 2;

  // Mountains: stepped peaks, darker on the lee side, snow on top.
  const far = makeCanvas(len, SCENE_H);
  const peaks: { cx: number; top: number; step: number; cap: number }[] = [];
  for (let x = -10; x < len + 30; x += 26 + Math.floor(rand() * 22)) {
    peaks.push({
      cx: x,
      top: 26 + Math.floor(rand() * 9),
      step: rand() < 0.5 ? 1 : 2,
      cap: 3 + Math.floor(rand() * 3),
    });
  }
  for (let x = 0; x < len; x++) {
    let best = 46;
    let owner = peaks[0];
    for (const peak of peaks) {
      const y = peak.top + Math.floor(Math.abs(x - peak.cx) / peak.step);
      if (y < best) {
        best = y;
        owner = peak;
      }
    }
    far.ctx.fillStyle = x > owner.cx ? p.farShade : p.far;
    far.ctx.fillRect(x, best, 1, SCENE_H - best);
    const capBottom = owner.top + owner.cap + (rand() < 0.35 ? 1 : 0);
    if (best < capBottom) {
      far.ctx.fillStyle = p.snowCap;
      far.ctx.fillRect(x, best, 1, capBottom - best);
    }
  }

  const mid = makeCanvas(len, SCENE_H);
  fillRidge(mid.ctx, ridge(rand, len, 53, 1, 14, 26), p.mid, p.midTop);

  const ground = makeCanvas(len, SCENE_H);
  ground.ctx.fillStyle = p.ground;
  ground.ctx.fillRect(0, GROUND_Y, len, SCENE_H - GROUND_Y);
  ground.ctx.fillStyle = p.groundTop;
  ground.ctx.fillRect(0, GROUND_Y, len, 2);
  for (let x = 0; x < len; x++) {
    if ((x & 1) === 0) px(ground.ctx, x, GROUND_Y + 2, p.groundTop);
    if (rand() < 0.04) {
      ground.ctx.fillStyle = p.groundMark;
      ground.ctx.fillRect(x, GROUND_Y + 4 + Math.floor(rand() * 7), 2, 1);
    }
  }
  return { far: far.canvas, mid: mid.canvas, ground: ground.canvas };
}

function makeStars(rand: () => number, width: number, moonX: number) {
  const stars: Star[] = [];
  while (stars.length < Math.round(width / 10)) {
    const x = Math.floor(rand() * width);
    const y = 1 + Math.floor(rand() * 32);
    if (Math.abs(x - moonX) < 14 && y < 30) continue;
    stars.push({
      x,
      y,
      phase: rand() * Math.PI * 2,
      speed: 1 + rand() * 2.5,
      big: stars.length < 4,
    });
  }
  return stars;
}

export function buildSeasonArt(season: Season, width: number): SeasonArt {
  const rand = rng(width * 7919 + (season === "autumn" ? 11 : 23));
  const cabinX = Math.round(width * 0.56);

  if (season === "autumn") {
    const layers = autumnLayers(width, rand);
    const p = PALETTE.autumn;
    const trees = [
      deciduousTree(rand, Math.round(width * 0.14), 1, {
        base: p.leaves[0],
        shade: p.leaves[1],
        light: p.leaves[2],
      }),
      deciduousTree(rand, Math.round(width * 0.87), 0.66, {
        base: p.leaves[2],
        shade: p.leaves[0],
        light: "#f6d27e",
      }),
    ];
    return {
      ...layers,
      trees,
      cabin: cabin("autumn", cabinX),
      celestial: sun(),
      stars: makeStars(rand, width, -100),
    };
  }

  const layers = winterLayers(width, rand);
  const trees = [
    pineTree(rand, Math.round(width * 0.12), PINE_BIG),
    pineTree(rand, Math.round(width * 0.2), PINE_SMALL),
    pineTree(rand, Math.round(width * 0.84), PINE_BIG),
    pineTree(rand, Math.round(width * 0.93), PINE_SMALL),
  ];
  return {
    ...layers,
    trees,
    cabin: cabin("winter", cabinX),
    celestial: moon(),
    stars: makeStars(rand, width, Math.round(width * 0.76)),
  };
}
