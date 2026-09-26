/**
 * Reciprocal Rank Fusion (Cormack, Clarke & Büttcher, 2009).
 *
 * score(d) = Σ_r  w_r / (k + rank_r(d))
 *
 * Rank-based, so it needs no score calibration between retrievers — which
 * is exactly why it's used both to merge lexical + vector results and to
 * fold the Jev relevance ranking back in (the configuration that benchmarks
 * show beats either signal alone).
 */
export function reciprocalRankFusion(
  rankings: readonly (readonly string[])[],
  { k = 60, weights }: { k?: number; weights?: readonly number[] } = {},
): Map<string, number> {
  const scores = new Map<string, number>();
  rankings.forEach((ranking, r) => {
    const weight = weights?.[r] ?? 1;
    ranking.forEach((id, index) => {
      scores.set(id, (scores.get(id) ?? 0) + weight / (k + index + 1));
    });
  });
  return scores;
}

export function sortByScore(scores: Map<string, number>): string[] {
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => id);
}

/**
 * Keeps at most `perGroup` items per group, preserving order.
 * Used to stop one long document from filling every slot.
 */
export function capPerGroup<T>(
  items: readonly T[],
  groupOf: (item: T) => string,
  perGroup: number,
): T[] {
  const counts = new Map<string, number>();
  return items.filter((item) => {
    const group = groupOf(item);
    const count = counts.get(group) ?? 0;
    if (count >= perGroup) return false;
    counts.set(group, count + 1);
    return true;
  });
}
