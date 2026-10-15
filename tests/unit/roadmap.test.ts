import { describe, expect, it } from "vitest";
import { schemes } from "@/data/schemes";
import { documentSteps, findRisks, matchSchemes } from "@/lib/engine/roadmap";
import type { CitizenProfile } from "@/lib/engine/types";

const farmerScStudent: CitizenProfile = {
  occupation: "student",
  state: "ka",
  educationLevel: "ug",
  category: "sc",
  incomeBand: "upto_1l",
  parentFarmer: true,
  class12Above80Percentile: false,
  inGovernmentHostel: false,
};

describe("matchSchemes", () => {
  it("sorts eligible schemes first", () => {
    const statuses = matchSchemes(schemes, farmerScStudent).map((m) => m.evaluation.status);
    const firstNotEligible = statuses.indexOf("not_eligible");
    expect(statuses.slice(0, firstNotEligible).every((s) => s !== "not_eligible")).toBe(true);
    expect(statuses.slice(firstNotEligible).every((s) => s === "not_eligible")).toBe(true);
  });
});

describe("documentSteps", () => {
  const matches = matchSchemes(schemes, farmerScStudent);

  it("deduplicates documents across schemes and puts slow certificates first", () => {
    const steps = documentSteps(matches, {});
    const ids = steps.map((s) => s.documentId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(steps[0].slow).toBe(true);
    const aadhaar = steps.find((s) => s.documentId === "aadhaar");
    expect(aadhaar?.neededFor).toEqual(
      expect.arrayContaining(["post-matric-scholarship-sc", "raitha-vidya-nidhi"]),
    );
  });

  it("moves documents the user already has to the end", () => {
    const steps = documentSteps(matches, { caste_certificate: "have" });
    expect(steps.at(-1)?.documentId).toBe("caste_certificate");
  });

  it("ignores schemes the user is not eligible for", () => {
    const steps = documentSteps(matches, {});
    expect(steps.some((s) => s.documentId === "nsp_otr")).toBe(false);
  });
});

describe("findRisks", () => {
  it("flags missing office certificates as high risk", () => {
    const risks = findRisks(matchSchemes(schemes, farmerScStudent), {});
    expect(risks[0].level).toBe("high");
  });

  it("drops a document risk once the user has it", () => {
    const all: Parameters<typeof findRisks>[1] = {
      caste_certificate: "have",
      income_certificate: "have",
      fruits_id: "have",
      aadhaar: "have",
      bank_account: "have",
      marks_card: "have",
      admission_proof: "have",
    };
    const matches = matchSchemes(schemes, farmerScStudent);
    const docsNeeded = new Set(matches.filter((m) => m.evaluation.status !== "not_eligible").flatMap((m) => m.scheme.documents));
    const statuses = Object.fromEntries([...docsNeeded].map((id) => [id, "have"]));
    expect(Object.keys(all).length).toBeGreaterThan(0);
    expect(findRisks(matches, statuses).filter((r) => r.kind === "document")).toEqual([]);
  });

  it("reports unanswered questions as medium risk", () => {
    const risks = findRisks(matchSchemes(schemes, { state: "ka" }), {});
    expect(risks.some((r) => r.kind === "unknown" && r.level === "medium")).toBe(true);
  });
});
