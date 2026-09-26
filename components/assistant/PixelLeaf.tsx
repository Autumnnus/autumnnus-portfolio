import { cn } from "@/lib/utils";

/**
 * Autumn's mark: a 12×12 pixel-art leaf with a spark, drawn from a string
 * grid so it stays crisp at any size and inherits `currentColor`.
 *   # leaf   + vein (darker)   * spark
 */
const GRID = [
  "..........*.",
  "......##.***",
  ".....####.*.",
  "....#####+..",
  "...#####+#..",
  "..#####+##..",
  "..####+###..",
  ".####+###...",
  ".###+###....",
  ".##+##......",
  ".+.#........",
  "+...........",
];

export default function PixelLeaf({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  const cells: { x: number; y: number; kind: string }[] = [];
  GRID.forEach((row, y) =>
    [...row].forEach((kind, x) => {
      if (kind !== ".") cells.push({ x, y, kind });
    }),
  );

  return (
    <svg
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      {cells.map(({ x, y, kind }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill="currentColor"
          opacity={kind === "+" ? 0.55 : 1}
          className={
            kind === "*"
              ? cn("fill-amber-400 dark:fill-sky-200", animated && "animate-pulse")
              : undefined
          }
        />
      ))}
    </svg>
  );
}
