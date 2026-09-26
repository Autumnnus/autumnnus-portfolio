/**
 * Generates the pixel cursors in public/cursors from string grids.
 * Each grid cell becomes a 2×2 block, so 16×16 art ships as a 32×32 PNG.
 *
 *   npx tsx scripts/generate-cursors.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const SCALE = 2;

const ARROW = [
  "X...............",
  "XX..............",
  "XoX.............",
  "XooX............",
  "XoooX...........",
  "XooooX..........",
  "XoooooX.........",
  "XooooooX........",
  "XoooooooX.......",
  "XooooXXXXX......",
  "XooXoX..........",
  "XoX.XoX.........",
  "XX..XoX.........",
  "X....XoX........",
  ".....XoX........",
  "......XX........",
];

const HAND = [
  ".....XX.........",
  "....XooX........",
  "....XooX........",
  "....XooX........",
  "....XooXXX......",
  "....XooXooXXX...",
  "....XooXooXooXX.",
  ".XX.XooXooXooXoX",
  "XooXXooooooooXoX",
  "XoooXooooooooooX",
  ".XooXoooooooooX.",
  "..XoooooooooooX.",
  "..XooooooooooX..",
  "...XoooooooooX..",
  "....XoooooooX...",
  "....XXXXXXXXX...",
];

// Accessories stamped next to the arrow (at 9,9) and the hand (at 11,0).
const LEAF = [
  "....XXX",
  "..XXLLX",
  ".XLLLLX",
  "XLLvLLX",
  "XLvLLX.",
  "XvXXX..",
  "X......",
];
const LEAF_MINI = ["..LLL", ".LLvL", "LLvL.", "v...."];
const FLAKE = [
  "...s...",
  ".s.s.s.",
  "..sss..",
  "ssswsss",
  "..sss..",
  ".s.s.s.",
  "...s...",
];
const FLAKE_MINI = ["s.s.s", ".sss.", "sswss", ".sss.", "s.s.s"];

type Palette = Record<string, [number, number, number]>;

const AUTUMN: Palette = {
  X: [42, 26, 18],
  o: [255, 246, 229],
  L: [224, 105, 46],
  v: [232, 176, 64],
};

const WINTER: Palette = {
  X: [10, 15, 31],
  o: [238, 243, 255],
  s: [143, 216, 242],
  w: [255, 255, 255],
};

function compose(base: string[], accent: string[], ax: number, ay: number) {
  const rows = base.map((row) => row.split(""));
  accent.forEach((row, y) =>
    row.split("").forEach((cell, x) => {
      if (cell !== ".") rows[ay + y][ax + x] = cell;
    }),
  );
  return rows.map((row) => row.join(""));
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(grid: string[], palette: Palette) {
  const size = grid.length * SCALE;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const cell = grid[Math.floor(y / SCALE)][Math.floor(x / SCALE)];
      const color = palette[cell];
      const i = y * (size * 4 + 1) + 1 + x * 4;
      if (!color) continue;
      raw[i] = color[0];
      raw[i + 1] = color[1];
      raw[i + 2] = color[2];
      raw[i + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = join(process.cwd(), "public", "cursors");
mkdirSync(outDir, { recursive: true });

const cursors: Record<string, [string[], Palette]> = {
  "autumn-arrow.png": [compose(ARROW, LEAF, 9, 9), AUTUMN],
  "autumn-hand.png": [compose(HAND, LEAF_MINI, 11, 0), AUTUMN],
  "winter-arrow.png": [compose(ARROW, FLAKE, 9, 9), WINTER],
  "winter-hand.png": [compose(HAND, FLAKE_MINI, 11, 0), WINTER],
};

for (const [name, [grid, palette]] of Object.entries(cursors)) {
  writeFileSync(join(outDir, name), png(grid, palette));
  console.log(`${name}\n${grid.join("\n")}\n`);
}
