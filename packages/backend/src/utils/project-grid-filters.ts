export type ProjectGridReviewScope = "mine" | "team";

export type ProjectGridPhotoFilter =
  | "all"
  | "liked"
  | "rejected"
  | "unreviewed"
  | "conflicts"
  | "trashed";

export interface ProjectGridQueryFilters {
  readonly scope: ProjectGridReviewScope;
  readonly filter: ProjectGridPhotoFilter;
}

const CONFLICT_STATES = new Set(["pending_owner", "resolved_owner", "resolved_majority"]);

export interface ProjectGridFilterRow {
  readonly status: string;
  readonly my_decision: number | null;
  readonly final_decision: number | null;
  readonly conflict_state: string | null;
}

export function normalizeProjectGridScope(value: unknown): ProjectGridReviewScope {
  return value === "team" ? "team" : "mine";
}

export function normalizeProjectGridFilter(value: unknown): ProjectGridPhotoFilter {
  if (
    value === "liked" ||
    value === "rejected" ||
    value === "unreviewed" ||
    value === "conflicts" ||
    value === "trashed"
  ) {
    return value;
  }
  return "all";
}

function hasConflict(row: ProjectGridFilterRow): boolean {
  return typeof row.conflict_state === "string" && CONFLICT_STATES.has(row.conflict_state);
}

/**
 * Applies review scope + photo filter to grid rows (mirrors frontend projectReviewFilters).
 */
export function applyProjectGridFilters<T extends ProjectGridFilterRow>(
  rows: readonly T[],
  filters: ProjectGridQueryFilters,
): T[] {
  const { scope, filter } = filters;
  if (filter === "trashed") {
    return rows.filter((row) => row.status === "trashed");
  }
  const visible = rows.filter((row) => row.status !== "trashed");
  if (filter === "conflicts") {
    return visible.filter(hasConflict);
  }
  if (filter === "all") {
    return visible;
  }
  if (scope === "mine") {
    if (filter === "liked") {
      return visible.filter((row) => row.my_decision === 1);
    }
    if (filter === "rejected") {
      return visible.filter((row) => row.my_decision === -1);
    }
    if (filter === "unreviewed") {
      return visible.filter((row) => row.my_decision == null);
    }
  }
  if (scope === "team") {
    if (filter === "liked") {
      return visible.filter((row) => row.final_decision === 1);
    }
    if (filter === "rejected") {
      return visible.filter((row) => row.final_decision === -1);
    }
  }
  return visible;
}
