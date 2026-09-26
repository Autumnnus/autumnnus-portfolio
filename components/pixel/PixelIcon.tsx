import { cn } from "@/lib/utils";

/**
 * Pixel icons drawn from string grids, like PixelLeaf. `#` paints with
 * currentColor; any other letter paints with `palette[letter]` (falling back
 * to currentColor). Horizontal runs merge into one rect to keep the DOM small.
 */
const GRIDS = {
  leaf: [
    "....##..",
    "...####.",
    "..###v##",
    ".###v###",
    ".##v###.",
    ".#v###..",
    ".s##....",
    "s.......",
  ],
  snowflake: [
    "...#...",
    ".#.#.#.",
    "..###..",
    "#######",
    "..###..",
    ".#.#.#.",
    "...#...",
  ],
  speaker: [
    "...#.....",
    "..##...#.",
    "####.#..#",
    "####.#..#",
    "####.#..#",
    "..##...#.",
    "...#.....",
  ],
  speakerOff: [
    "...#.....",
    "..##.....",
    "####.#.#.",
    "####..#..",
    "####.#.#.",
    "..##.....",
    "...#.....",
  ],
  arrow: ["#...", "##..", "###.", "####", "###.", "##..", "#..."],
  arrowSmall: ["#..", "##.", "###", "##.", "#.."],
  arrowUp: [
    "...#...",
    "..###..",
    ".#####.",
    "#######",
    "..###..",
    "..###..",
    "..###..",
  ],
  caretDown: ["#######", ".#####.", "..###..", "...#..."],
  star: [
    "....#....",
    "....#....",
    "...###...",
    "#########",
    ".#######.",
    "..#####..",
    "..##.##..",
    ".##...##.",
    ".#.....#.",
  ],
  sparkle: [".#.", "###", ".#."],
  menu: ["#######", ".......", "#######", ".......", "#######"],
  close: [
    "#.....#",
    ".#...#.",
    "..#.#..",
    "...#...",
    "..#.#..",
    ".#...#.",
    "#.....#",
  ],
  check: [".......#", "......#.", "#....#..", ".#..#...", "..##...."],
  square: ["#####", "#####", "#####", "#####", "#####"],
  expand: [
    "###.###",
    "##...##",
    "#.....#",
    ".......",
    "#.....#",
    "##...##",
    "###.###",
  ],
  collapse: [
    "..#.#..",
    "..#.#..",
    "###.###",
    ".......",
    "###.###",
    "..#.#..",
    "..#.#..",
  ],
  refresh: [
    "..###.#",
    ".#...##",
    "#...###",
    "#......",
    "#.....#",
    ".#...#.",
    "..###..",
  ],
  trash: [
    ".#####.",
    "#######",
    ".......",
    ".#####.",
    ".#.#.#.",
    ".#.#.#.",
    ".#.#.#.",
    ".#####.",
  ],
  lock: [
    "..###..",
    ".#...#.",
    ".#...#.",
    "#######",
    "###.###",
    "###.###",
    "#######",
  ],
  trophy: [
    "#########",
    "#.#####.#",
    "#.#####.#",
    ".#######.",
    "...###...",
    "....#....",
    "...###...",
    "..#####..",
  ],
  heart: [
    ".##.##.",
    "#######",
    "#######",
    ".#####.",
    "..###..",
    "...#...",
  ],
  hand: [
    ".....##.........",
    "....#oo#........",
    "....#oo#........",
    "....#oo#........",
    "....#oo###......",
    "....#oo#oo###...",
    "....#oo#oo#oo##.",
    ".##.#oo#oo#oo#o#",
    "#oo##oooooooo#o#",
    "#ooo#oooooooooo#",
    ".#oo#ooooooooo#.",
    "..#ooooooooooo#.",
    "..#oooooooooo#..",
    "...#ooooooooo#..",
    "....#ooooooo#...",
    "....#########...",
  ],
  sun: [
    "....#....",
    ".#.....#.",
    "...###...",
    "..#####..",
    "#.#####.#",
    "..#####..",
    "...###...",
    ".#.....#.",
    "....#....",
  ],
  wind: [
    "......##.",
    ".......#.",
    "#######..",
    ".........",
    "#########",
    ".........",
    "#####....",
    ".....#...",
    "......##.",
  ],
  tree: [
    "..#####..",
    ".#######.",
    "#########",
    "#########",
    ".#######.",
    "...###...",
    "....#....",
    "....#....",
    "..#####..",
  ],
  trees: [
    "..#...#..",
    ".###.###.",
    "..#...#..",
    ".###.###.",
    "#########",
    "..#...#..",
    ".###.###.",
    "#########",
    "..#...#..",
  ],
  storm: [
    "..####...",
    ".######..",
    "#########",
    "#########",
    ".#######.",
    "...##....",
    "..##.....",
    ".####....",
    "...#.....",
  ],
  flame: [
    "....#....",
    "...##....",
    "...###...",
    "..####.#.",
    ".######..",
    ".##.###..",
    ".#...##..",
    ".##.###..",
    "..#####..",
  ],
  crown: [
    "#...#...#",
    "##.###.##",
    "#########",
    "#########",
    "#########",
    ".........",
    "#########",
  ],
  cloudSnow: [
    "..####...",
    ".######..",
    "#########",
    ".#######.",
    ".........",
    ".#..#..#.",
    "..#..#..#",
    ".#..#..#.",
  ],
  gem: [
    ".#######.",
    "#.#...#.#",
    "#########",
    ".#.....#.",
    "..#...#..",
    "...#.#...",
    "....#....",
  ],
  sparkles: [
    "...#.....",
    "...#.....",
    "..###....",
    "#######..",
    "..###..#.",
    "...#..###",
    "...#...#.",
  ],
  mountain: [
    "....#....",
    "...###...",
    "..#####..",
    "..##.##..",
    ".#######.",
    "####.####",
    "#########",
  ],
} satisfies Record<string, string[]>;

export type PixelIconName = keyof typeof GRIDS;

interface Run {
  x: number;
  y: number;
  width: number;
  kind: string;
}

function toRuns(grid: string[]): Run[] {
  const runs: Run[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const kind = row[x];
      if (kind === ".") {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === kind) end++;
      runs.push({ x, y, width: end - x, kind });
      x = end;
    }
  });
  return runs;
}

const RUNS = Object.fromEntries(
  Object.entries(GRIDS).map(([name, grid]) => [name, toRuns(grid)]),
) as Record<PixelIconName, Run[]>;

/** Renders any string grid; PixelIcon is this with a named built-in grid. */
export function PixelGrid({
  grid,
  runs = toRuns(grid),
  className,
  palette,
}: {
  grid: string[];
  runs?: Run[];
  className?: string;
  palette?: Record<string, string>;
}) {
  return (
    <svg
      viewBox={`0 0 ${grid[0].length} ${grid.length}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      {runs.map(({ x, y, width, kind }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={width}
          height={1}
          fill={(kind !== "#" && palette?.[kind]) || "currentColor"}
        />
      ))}
    </svg>
  );
}

export default function PixelIcon({
  name,
  className,
  palette,
}: {
  name: PixelIconName;
  className?: string;
  palette?: Record<string, string>;
}) {
  return (
    <PixelGrid
      grid={GRIDS[name]}
      runs={RUNS[name]}
      className={className}
      palette={palette}
    />
  );
}
