export type ApiKeyCategory = "free" | "paid";

export interface SelectableApiKey {
  id: string;
  category: ApiKeyCategory;
  priority: number;
  quotaGroup: string;
  createdAt: Date;
}

export interface SelectionState {
  blockedUntilByQuotaGroup: Map<string, Date | null>;
  excludedQuotaGroups?: Set<string>;
  now?: Date;
}

export interface SelectionResult<T extends SelectableApiKey> {
  key: T | null;
  nextAvailableAt: Date | null;
}

const CATEGORY_ORDER: Record<ApiKeyCategory, number> = {
  free: 0,
  paid: 1,
};

export function sortSelectableApiKeys<T extends SelectableApiKey>(keys: T[]) {
  return [...keys].sort((left, right) => {
    const categoryDelta =
      CATEGORY_ORDER[left.category] - CATEGORY_ORDER[right.category];
    if (categoryDelta !== 0) return categoryDelta;

    const priorityDelta = left.priority - right.priority;
    if (priorityDelta !== 0) return priorityDelta;

    return left.createdAt.getTime() - right.createdAt.getTime();
  });
}

export function selectAvailableApiKey<T extends SelectableApiKey>(
  keys: T[],
  state: SelectionState,
): SelectionResult<T> {
  const now = state.now ?? new Date();
  const excludedQuotaGroups = state.excludedQuotaGroups ?? new Set<string>();
  let nextAvailableAt: Date | null = null;

  for (const key of sortSelectableApiKeys(keys)) {
    if (excludedQuotaGroups.has(key.quotaGroup)) {
      continue;
    }

    const blockedUntil = state.blockedUntilByQuotaGroup.get(key.quotaGroup);
    if (blockedUntil && blockedUntil.getTime() > now.getTime()) {
      if (
        !nextAvailableAt ||
        blockedUntil.getTime() < nextAvailableAt.getTime()
      ) {
        nextAvailableAt = blockedUntil;
      }
      continue;
    }

    return { key, nextAvailableAt };
  }

  return { key: null, nextAvailableAt };
}
