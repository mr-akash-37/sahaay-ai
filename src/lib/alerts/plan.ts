import type { Scheme } from "@/data/schemes";
import { deadlineState } from "@/lib/engine/deadline";
import { evaluateScheme } from "@/lib/engine/evaluate";
import type { CitizenProfile } from "@/lib/engine/types";
import { parseProfile } from "@/lib/profile/schema";
import { parseScheme } from "@/lib/schemes/schema";

export type AlertKind = "new_match" | "scheme_updated" | "deadline";

export type PlannedAlert = {
  userId: string;
  kind: AlertKind;
  schemeSlug: string;
  schemeVersionId: string | null;
  dedupeKey: string;
};

export type VersionInput = { versionId: string; data: unknown; previousData: unknown };
export type ProfileInput = { userId: string; answers: unknown };

const REMINDER_DAYS: ReadonlySet<number> = new Set([7, 3, 1]);

function canApply(scheme: Scheme, profile: CitizenProfile): boolean {
  return evaluateScheme(scheme.criteria, profile).status !== "not_eligible";
}

/** Changes a citizen would care about. Cosmetic edits (e.g. typo fixes in notes) don't alert. */
function importantChange(before: Scheme, after: Scheme): boolean {
  return (
    before.deadline !== after.deadline ||
    before.applyUrl !== after.applyUrl ||
    JSON.stringify(before.benefit) !== JSON.stringify(after.benefit) ||
    JSON.stringify(before.criteria) !== JSON.stringify(after.criteria)
  );
}

function validProfiles(profiles: readonly ProfileInput[]) {
  return profiles.flatMap(({ userId, answers }) => {
    const profile = parseProfile(answers);
    return profile && Object.keys(profile).length > 0 ? [{ userId, profile }] : [];
  });
}

/**
 * Decides who to alert about newly published scheme versions:
 * - new_match: the citizen can now apply, and could not before (or the scheme is new)
 * - scheme_updated: the citizen could already apply and something important changed
 * Uses the same deterministic engine as the app — no AI involved.
 */
export function planVersionAlerts(versions: readonly VersionInput[], profiles: readonly ProfileInput[]): PlannedAlert[] {
  const citizens = validProfiles(profiles);
  const alerts: PlannedAlert[] = [];

  for (const version of versions) {
    const current = parseScheme(version.data);
    if (!current.ok) continue;
    const previous = version.previousData ? parseScheme(version.previousData) : null;

    for (const { userId, profile } of citizens) {
      if (!canApply(current.scheme, profile)) continue;

      let kind: AlertKind | null;
      if (!previous?.ok || !canApply(previous.scheme, profile)) kind = "new_match";
      else kind = importantChange(previous.scheme, current.scheme) ? "scheme_updated" : null;

      if (kind) {
        alerts.push({
          userId,
          kind,
          schemeSlug: current.scheme.slug,
          schemeVersionId: version.versionId,
          dedupeKey: `${kind}:${userId}:${version.versionId}`,
        });
      }
    }
  }
  return alerts;
}

/** Reminders 7, 3 and 1 days before a verified deadline, for citizens who can apply. */
export function planDeadlineReminders(
  schemes: readonly Scheme[],
  profiles: readonly ProfileInput[],
  today: Date,
): PlannedAlert[] {
  const citizens = validProfiles(profiles);
  const alerts: PlannedAlert[] = [];

  for (const scheme of schemes) {
    const state = deadlineState(scheme.deadline, today);
    if (state.kind === "unknown" || state.kind === "closed" || !REMINDER_DAYS.has(state.days)) continue;

    for (const { userId, profile } of citizens) {
      if (!canApply(scheme, profile)) continue;
      alerts.push({
        userId,
        kind: "deadline",
        schemeSlug: scheme.slug,
        schemeVersionId: null,
        dedupeKey: `deadline:${userId}:${scheme.slug}:${scheme.deadline}:${state.days}`,
      });
    }
  }
  return alerts;
}
