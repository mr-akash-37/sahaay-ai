export const applicationStatuses = [
  "not_started",
  "preparing",
  "applied",
  "under_review",
  "approved",
  "rejected",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];
export type ApplicationStatuses = Record<string, ApplicationStatus>;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Keeps only valid "scheme slug → status" pairs (saved data may be old or tampered with). */
export function parseApplications(value: unknown): ApplicationStatuses | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result: ApplicationStatuses = {};
  for (const [slug, status] of Object.entries(value as Record<string, unknown>)) {
    if (SLUG.test(slug) && slug.length <= 100 && (applicationStatuses as readonly unknown[]).includes(status)) {
      result[slug] = status as ApplicationStatus;
    }
  }
  return result;
}
