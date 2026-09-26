import { cn } from "@/lib/utils";

/**
 * Deterministic 5×5 identicon from a visitor/IP hash, so the same person is
 * recognisable at a glance across lists — no personal data involved.
 */
export default function VisitorAvatar({ seed, className }: { seed: string; className?: string }) {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const hue = hash % 360;
  const cells: boolean[] = [];
  for (let i = 0; i < 15; i++) cells.push(((hash >>> (i % 30)) + i * 7) % 3 !== 0);

  return (
    <svg
      viewBox="0 0 5 5"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={cn("h-8 w-8 shrink-0 rounded-md border border-border", className)}
      style={{ background: `hsl(${hue} 60% 94%)` }}
    >
      {Array.from({ length: 5 }, (_, y) =>
        Array.from({ length: 5 }, (_, x) => {
          const col = x < 3 ? x : 4 - x;
          return cells[y * 3 + col] ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={`hsl(${hue} 55% 45%)`} />
          ) : null;
        }),
      )}
    </svg>
  );
}
