import { describe, expect, it } from "vitest";
import { schemes } from "@/data/schemes";
import { extractProfileFromText } from "@/lib/ai/extract-rules";
import { evaluateScheme } from "@/lib/engine/evaluate";
import { nextBestQuestion, ruleFields } from "@/lib/engine/next-question";
import type { CitizenProfile } from "@/lib/engine/types";

/** Simulates a conversation: keep answering the suggested question until none is left. */
function converse(start: CitizenProfile, answers: CitizenProfile): { asked: string[]; profile: CitizenProfile } {
  let profile = { ...start };
  const asked: string[] = [];
  for (let i = 0; i < 30; i++) {
    const q = nextBestQuestion(profile, schemes);
    if (!q) break;
    asked.push(q.field);
    profile = { ...profile, [q.field]: answers[q.field] ?? "unknown" };
  }
  return { asked, profile };
}

describe("ruleFields", () => {
  it("collects fields from nested rules", () => {
    const fields = ruleFields({
      kind: "anyOf",
      rules: [
        { kind: "equals", field: "gender", value: "female" },
        { kind: "allOf", rules: [{ kind: "incomeAtMost", max: 1 }, { kind: "between", field: "age", min: 18 }] },
      ],
    });
    expect([...fields].sort()).toEqual(["age", "gender", "incomeBand"]);
  });
});

describe("nextBestQuestion", () => {
  it("asks what someone does first when we know nothing", () => {
    expect(nextBestQuestion({}, schemes)?.field).toBe("occupation");
  });

  it("'I need financial support for my crops' → farmer → asks only farmer-relevant questions", () => {
    const start = extractProfileFromText("I need financial support for my crops").profile;
    expect(start.occupation).toBe("farmer");

    const truth: CitizenProfile = {
      age: 50,
      gender: "male",
      state: "ka",
      areaType: "rural",
      category: "general",
      incomeBand: "1l_2_5l",
      ownsFarmland: true,
      familyPaysIncomeTax: false,
      familyGovtEmployee: false,
    };
    const { asked, profile } = converse(start, truth);

    // Never asks student, business or job-seeker questions to a farmer.
    for (const field of ["educationLevel", "parentFarmer", "businessStage", "unemployedGraduate", "class12Above80Percentile"]) {
      expect(asked).not.toContain(field);
    }
    // Far fewer questions than the full form.
    expect(asked.length).toBeLessThanOrEqual(10);
    expect(evaluateScheme(schemes.find((s) => s.slug === "pm-kisan")!.criteria, profile).status).toBe("eligible");
  });

  // Guards against schemes that depend on a question that is never asked to
  // that kind of person (which would leave them stuck on "maybe" forever).
  it.each(
    ["student", "farmer", "farm_labourer", "business_owner", "artisan", "unorganised_worker", "salaried_private", "govt_employee", "job_seeker", "homemaker", "retired"].flatMap(
      (occupation) =>
        (["female", "male"] as const).flatMap((gender) => [19, 35, 55, 75].map((age) => ({ occupation, gender, age }))),
    ),
  )("every 'maybe' scheme for %o is only waiting on answers the person actually gave as 'I don't know'", (start) => {
    const answerEverything = (field: string): CitizenProfile[keyof CitizenProfile] =>
      field === "incomeBand" ? "1l_2_5l" : field === "educationLevel" ? "ug" : field === "category" ? "sc" : field === "businessStage" ? "new" : field === "areaType" ? "urban" : true;

    let profile: CitizenProfile = { ...(start as CitizenProfile) };
    for (let i = 0; i < 40; i++) {
      const q = nextBestQuestion(profile, schemes);
      if (!q) break;
      profile = { ...profile, [q.field]: q.type === "number" ? 30 : answerEverything(q.field) };
    }

    for (const scheme of schemes) {
      const evaluation = evaluateScheme(scheme.criteria, profile);
      if (evaluation.status !== "likely_eligible") continue;
      for (const { criterion, outcome } of evaluation.results) {
        if (outcome !== "unknown") continue;
        for (const field of ruleFields(criterion.rule)) {
          expect(profile[field], `${scheme.slug} waits on unasked "${field}"`).not.toBeUndefined();
        }
      }
    }
  });

  it("stops asking once nothing can change", () => {
    const done: CitizenProfile = {
      occupation: "govt_employee",
      age: 35,
      gender: "male",
      state: "ka",
      areaType: "rural",
      category: "general",
      incomeBand: "above_9l",
      familyPaysIncomeTax: true,
      selfPaysIncomeTax: true,
      // Sukanya Samriddhi has no income limit, so even this person is asked about a young daughter.
      hasDaughterUnder10: false,
    };
    expect(nextBestQuestion(done, schemes)).toBeNull();
  });
});
