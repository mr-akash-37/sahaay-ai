import { describe, expect, it } from "vitest";
import { schemes } from "@/data/schemes";
import { getDictionary } from "@/i18n/dictionaries";
import { documentSteps, matchSchemes } from "@/lib/engine/roadmap";
import { parseApplications } from "@/lib/profile/applications";
import { checklistText } from "@/components/roadmap/share-checklist";

describe("application tracker data", () => {
  it("keeps valid statuses and drops tampered entries", () => {
    expect(parseApplications({ "pm-kisan": "applied", "bad slug!": "applied", "pmegp": "hacked" })).toEqual({
      "pm-kisan": "applied",
    });
    expect(parseApplications(null)).toBeNull();
    expect(parseApplications(["x"])).toBeNull();
  });
});

describe("shareable checklist", () => {
  it("lists documents and schemes, with no personal details", () => {
    const profile = { occupation: "farmer", ownsFarmland: true, familyPaysIncomeTax: false, familyGovtEmployee: false } as const;
    const matches = matchSchemes(schemes, profile).filter((m) => m.evaluation.status !== "not_eligible");
    const steps = documentSteps(matches, { aadhaar: "have" });
    const text = checklistText(steps, matches, "kn", getDictionary("kn"));
    expect(text).toContain("ನನ್ನ ಸಹಾಯ್ AI ಪಟ್ಟಿ");
    expect(text).toContain("✅ ಆಧಾರ್ ಕಾರ್ಡ್");
    expect(text).toContain("https://pmkisan.gov.in/");
    expect(text).not.toMatch(/farmer|45|income/i);
  });
});
