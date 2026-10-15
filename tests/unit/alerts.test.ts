import { describe, expect, it } from "vitest";
import { getScheme, type Scheme } from "@/data/schemes";
import { planDeadlineReminders, planVersionAlerts } from "@/lib/alerts/plan";

const sc = getScheme("post-matric-scholarship-sc") as Scheme;
const clone = (s: Scheme): Scheme => JSON.parse(JSON.stringify(s)) as Scheme;

const scStudent = {
  userId: "u-sc",
  answers: { occupation: "student", state: "ka", educationLevel: "ug", category: "sc", incomeBand: "upto_1l" },
};
const generalStudent = {
  userId: "u-gen",
  answers: { occupation: "student", state: "ka", educationLevel: "ug", category: "general", incomeBand: "upto_1l" },
};
const emptyProfile = { userId: "u-empty", answers: {} };
const corrupt = { userId: "u-bad", answers: { category: 42 } };

describe("planVersionAlerts", () => {
  it("alerts eligible citizens about a brand-new scheme, and only them", () => {
    const alerts = planVersionAlerts([{ versionId: "v1", data: sc, previousData: null }], [
      scStudent,
      generalStudent,
      emptyProfile,
      corrupt,
    ]);
    expect(alerts).toEqual([
      { userId: "u-sc", kind: "new_match", schemeSlug: sc.slug, schemeVersionId: "v1", dedupeKey: "new_match:u-sc:v1" },
    ]);
  });

  it("alerts newly eligible citizens when the rules are relaxed", () => {
    const before = clone(sc);
    const after = clone(sc);
    // Rule change: scheme opened to every category.
    after.criteria = after.criteria.filter((c) => c.id !== "sc_category");
    const alerts = planVersionAlerts([{ versionId: "v2", data: after, previousData: before }], [scStudent, generalStudent]);
    expect(alerts.map((a) => [a.userId, a.kind])).toEqual([
      ["u-sc", "scheme_updated"],
      ["u-gen", "new_match"],
    ]);
  });

  it("does not alert for cosmetic edits", () => {
    const after = clone(sc);
    after.notes = { en: "Typo fixed", kn: "x", hi: "y" };
    expect(planVersionAlerts([{ versionId: "v3", data: after, previousData: sc }], [scStudent])).toEqual([]);
  });

  it("alerts already-eligible citizens when the deadline changes", () => {
    const after = clone(sc);
    after.deadline = "2026-12-31";
    const alerts = planVersionAlerts([{ versionId: "v4", data: after, previousData: sc }], [scStudent]);
    expect(alerts[0].kind).toBe("scheme_updated");
  });

  it("ignores invalid scheme data", () => {
    expect(planVersionAlerts([{ versionId: "v5", data: { slug: "x" }, previousData: null }], [scStudent])).toEqual([]);
  });
});

describe("planDeadlineReminders", () => {
  const today = new Date(2026, 9, 13);
  const withDeadline = (deadline: string | null) => ({ ...clone(sc), deadline });

  it("reminds at 7, 3 and 1 days only", () => {
    expect(planDeadlineReminders([withDeadline("2026-10-20")], [scStudent], today)).toHaveLength(1);
    expect(planDeadlineReminders([withDeadline("2026-10-16")], [scStudent], today)).toHaveLength(1);
    expect(planDeadlineReminders([withDeadline("2026-10-14")], [scStudent], today)).toHaveLength(1);
    expect(planDeadlineReminders([withDeadline("2026-10-18")], [scStudent], today)).toHaveLength(0);
  });

  it("never reminds about unknown deadlines or ineligible citizens", () => {
    expect(planDeadlineReminders([withDeadline(null)], [scStudent], today)).toEqual([]);
    expect(planDeadlineReminders([withDeadline("2026-10-20")], [generalStudent], today)).toEqual([]);
  });

  it("uses a stable dedupe key so re-runs on the same day don't duplicate", () => {
    const [a] = planDeadlineReminders([withDeadline("2026-10-20")], [scStudent], today);
    const [b] = planDeadlineReminders([withDeadline("2026-10-20")], [scStudent], today);
    expect(a.dedupeKey).toBe(b.dedupeKey);
    expect(a.dedupeKey).toBe(`deadline:u-sc:${sc.slug}:2026-10-20:7`);
  });
});
