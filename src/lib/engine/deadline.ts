export type DeadlineState =
  | { kind: "unknown" }
  | { kind: "closed" }
  | { kind: "critical" | "upcoming" | "open"; days: number };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Urgency of a deadline relative to `today` (both compared as calendar dates):
 * critical ≤ 3 days, upcoming ≤ 10 days, open beyond that, closed once passed.
 * A null deadline is "unknown" — it is never guessed.
 */
export function deadlineState(deadline: string | null, today: Date): DeadlineState {
  if (!deadline) return { kind: "unknown" };
  const due = Date.parse(`${deadline}T00:00:00Z`);
  if (Number.isNaN(due)) return { kind: "unknown" };

  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((due - start) / DAY_MS);

  if (days < 0) return { kind: "closed" };
  if (days <= 3) return { kind: "critical", days };
  if (days <= 10) return { kind: "upcoming", days };
  return { kind: "open", days };
}
