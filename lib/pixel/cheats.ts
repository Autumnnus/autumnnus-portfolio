/**
 * Secret codes for the hero scene, and a forgiving matcher for them: case
 * and Turkish letters don't matter, synonyms work in both languages, arrows
 * can be typed as symbols or words, and a one-letter slip still counts.
 */
export type CheatId = "konami" | "fireworks" | "ufo" | "weather" | "cycle";
export const CHEATS: CheatId[] = ["konami", "fireworks", "ufo", "weather", "cycle"];

/** The short form everyone can manage; the classic long one works too. */
export const KONAMI_SHORT = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "b", "a"];
export const KONAMI = [
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

/** Two or more arrows, then B A (normalised: u/d/l/r, then "ba"). */
const KONAMI_LIKE = /^[udlr]{2,}ba$/;

/** Words recognised when typed anywhere on the page (kept short and exact). */
export const TYPED_CODES: Record<string, CheatId> = {
  kadir: "fireworks",
  ufo: "ufo",
  yagis: "weather",
  yagmur: "weather",
  kar: "weather",
  storm: "weather",
  rain: "weather",
  snow: "weather",
  dongu: "cycle",
  cycle: "cycle",
  gece: "cycle",
  gunduz: "cycle",
};

/** Everything the code console accepts, already normalised. */
const ALIASES: Record<CheatId, string[]> = {
  konami: ["konami", "uuddba", "uuddlrlrba"],
  fireworks: ["kadir", "havaifisek", "fisek", "fireworks", "firework"],
  ufo: ["ufo", "uzayli", "alien", "ufolar"],
  weather: ["yagis", "yagmur", "saganak", "kar", "tipi", "firtina", "storm", "rain", "snow", "weather"],
  cycle: ["dongu", "gece", "gunduz", "aksam", "cycle", "night", "day", "dusk", "daynight"],
};

const ARROW_WORDS: Record<string, string> = {
  yukari: "u",
  up: "u",
  asagi: "d",
  down: "d",
  sol: "l",
  left: "l",
  sag: "r",
  right: "r",
  a: "a",
  b: "b",
};

/** Lowercase, Turkish-insensitive, letters and digits only; arrows → u/d/l/r. */
export function normalizeCode(input: string) {
  return input
    .toLocaleLowerCase("tr")
    .replace(/[↑⬆]/g, "u")
    .replace(/[↓⬇]/g, "d")
    .replace(/[←⬅]/g, "l")
    .replace(/[→➡]/g, "r")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** "yukarı yukarı aşağı …" / "up up down …" → "uudd…", or "" if not arrows. */
function arrowWords(input: string) {
  const tokens = input.split(/[\s,.;-]+/).map(normalizeCode).filter(Boolean);
  if (tokens.length < 4) return "";
  const letters = tokens.map((token) => ARROW_WORDS[token]);
  return letters.every(Boolean) ? letters.join("") : "";
}

/** Optimal string alignment distance (a swap of two letters costs 1). */
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

export type CodeResult =
  | { kind: "match"; id: CheatId }
  | { kind: "close"; id: CheatId }
  | { kind: "miss" };

export function matchCode(input: string): CodeResult {
  const candidates = [normalizeCode(input), arrowWords(input)].filter(Boolean);
  if (!candidates.length) return { kind: "miss" };

  // Any run of arrows followed by B A counts as the Konami code, so nobody
  // has to remember the exact order.
  if (candidates.some((text) => KONAMI_LIKE.test(text))) return { kind: "match", id: "konami" };

  let best: { id: CheatId; dist: number; alias: string } | null = null;
  for (const text of candidates) {
    for (const id of CHEATS) {
      for (const alias of ALIASES[id]) {
        if (text === alias) return { kind: "match", id };
        const dist = distance(text, alias);
        if (!best || dist < best.dist) best = { id, dist, alias };
      }
    }
  }
  if (!best) return { kind: "miss" };
  // Longer words forgive a slip; short ones (ufo, kar) must be exact.
  if (best.dist === 1 && best.alias.length >= 4) return { kind: "match", id: best.id };
  const close =
    (best.dist === 1 && best.alias.length >= 3) || (best.dist === 2 && best.alias.length >= 5);
  if (close) return { kind: "close", id: best.id };
  return { kind: "miss" };
}
