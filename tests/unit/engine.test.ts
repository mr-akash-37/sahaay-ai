import { describe, expect, it } from "vitest";
import { getScheme, schemes } from "@/data/schemes";
import { confidenceFor, evaluateRule, evaluateScheme } from "@/lib/engine/evaluate";
import { indianStates, type CitizenProfile, type Criterion, type Rule } from "@/lib/engine/types";

const label = { en: "x", kn: "x", hi: "x" };
const crit = (id: string, rule: Rule, extra: Partial<Criterion> = {}): Criterion => ({ id, rule, label, ...extra });

describe("evaluateRule", () => {
  it("equals: satisfied, not satisfied, unknown", () => {
    const rule: Rule = { kind: "equals", field: "state", value: "ka" };
    expect(evaluateRule(rule, { state: "ka" })).toBe("satisfied");
    expect(evaluateRule(rule, { state: "mh" })).toBe("not_satisfied");
    expect(evaluateRule(rule, { state: "unknown" })).toBe("unknown");
    expect(evaluateRule(rule, {})).toBe("unknown");
  });

  it("in", () => {
    const rule: Rule = { kind: "in", field: "category", values: ["sc", "st"] };
    expect(evaluateRule(rule, { category: "st" })).toBe("satisfied");
    expect(evaluateRule(rule, { category: "general" })).toBe("not_satisfied");
    expect(evaluateRule(rule, { category: "unknown" })).toBe("unknown");
  });

  describe("incomeAtMost uses band edges", () => {
    const rule: Rule = { kind: "incomeAtMost", max: 250_000 };
    it.each([
      ["upto_1l", "satisfied"],
      ["1l_2_5l", "satisfied"],
      ["2_5l_3l", "not_satisfied"],
      ["above_9l", "not_satisfied"],
      ["unknown", "unknown"],
    ] as const)("%s → %s", (incomeBand, expected) => {
      expect(evaluateRule(rule, { incomeBand })).toBe(expected);
    });

    it("returns unknown when a band straddles the limit", () => {
      expect(evaluateRule({ kind: "incomeAtMost", max: 200_000 }, { incomeBand: "1l_2_5l" })).toBe("unknown");
    });
  });

  it("allOf: any failure fails, otherwise unknown beats satisfied", () => {
    const rule: Rule = {
      kind: "allOf",
      rules: [
        { kind: "equals", field: "state", value: "ka" },
        { kind: "equals", field: "parentFarmer", value: true },
      ],
    };
    expect(evaluateRule(rule, { state: "ka", parentFarmer: true })).toBe("satisfied");
    expect(evaluateRule(rule, { state: "ka" })).toBe("unknown");
    expect(evaluateRule(rule, { state: "mh" })).toBe("not_satisfied");
  });

  it("anyOf: any success passes, otherwise unknown beats failure", () => {
    const rule: Rule = {
      kind: "anyOf",
      rules: [
        { kind: "equals", field: "category", value: "sc" },
        { kind: "equals", field: "parentFarmer", value: true },
      ],
    };
    expect(evaluateRule(rule, { category: "general", parentFarmer: true })).toBe("satisfied");
    expect(evaluateRule(rule, { category: "general" })).toBe("unknown");
    expect(evaluateRule(rule, { category: "general", parentFarmer: false })).toBe("not_satisfied");
  });
});

describe("evaluateScheme", () => {
  const criteria = [
    crit("a", { kind: "equals", field: "state", value: "ka" }),
    crit("b", { kind: "equals", field: "parentFarmer", value: true }),
    crit("c", { kind: "incomeAtMost", max: 250_000 }, { appliesWhen: { kind: "equals", field: "category", value: "sc" } }),
  ];

  it("eligible with 100% only when every applicable criterion is satisfied", () => {
    const result = evaluateScheme(criteria, { state: "ka", parentFarmer: true, category: "general" });
    expect(result.status).toBe("eligible");
    expect(result.score).toBe(100);
    expect(result.confidence).toBe("high");
    expect(result.results[2].outcome).toBe("not_applicable");
  });

  it("likely eligible when something is unknown — never 100%", () => {
    const result = evaluateScheme(criteria, { state: "ka", category: "general" });
    expect(result.status).toBe("likely_eligible");
    expect(result.score).toBe(50);
    expect(result.confidence).toBe("low");
  });

  it("not eligible when any criterion fails", () => {
    const result = evaluateScheme(criteria, { state: "mh", parentFarmer: true });
    expect(result.status).toBe("not_eligible");
  });

  it("respects weights", () => {
    const weighted = [crit("a", criteria[0].rule, { weight: 3 }), crit("b", criteria[1].rule)];
    expect(evaluateScheme(weighted, { state: "ka" }).score).toBe(75);
  });

  it("confidence bands", () => {
    expect(confidenceFor(0, 4)).toBe("high");
    expect(confidenceFor(1, 4)).toBe("medium");
    expect(confidenceFor(2, 4)).toBe("low");
  });
});

// ---- Personas against real scheme data -------------------------------------

const status = (slug: string, profile: CitizenProfile) => {
  const scheme = getScheme(slug);
  if (!scheme) throw new Error(`Missing scheme ${slug}`);
  return evaluateScheme(scheme.criteria, profile).status;
};

describe("personas", () => {
  const ruralScUndergrad: CitizenProfile = {
    occupation: "student",
    state: "ka",
    educationLevel: "ug",
    category: "sc",
    incomeBand: "1l_2_5l",
    parentFarmer: true,
    class12Above80Percentile: "unknown",
    inGovernmentHostel: false,
  };

  it("rural SC undergraduate, farmer parent", () => {
    expect(status("post-matric-scholarship-sc", ruralScUndergrad)).toBe("eligible");
    expect(status("post-matric-scholarship-st", ruralScUndergrad)).toBe("not_eligible");
    expect(status("post-matric-scholarship-obc", ruralScUndergrad)).toBe("not_eligible");
    expect(status("raitha-vidya-nidhi", ruralScUndergrad)).toBe("eligible");
    expect(status("central-sector-scholarship", ruralScUndergrad)).toBe("likely_eligible");
  });

  it("OBC 2A income limit is ₹1 lakh, Category 1 is ₹2.5 lakh", () => {
    const base: CitizenProfile = {
      occupation: "student",
      state: "ka",
      educationLevel: "puc",
      inGovernmentHostel: false,
    };
    expect(status("post-matric-scholarship-obc", { ...base, category: "obc", kaBackwardClass: "cat_2a", incomeBand: "1l_2_5l" })).toBe(
      "not_eligible",
    );
    expect(status("post-matric-scholarship-obc", { ...base, category: "obc", kaBackwardClass: "cat_2a", incomeBand: "upto_1l" })).toBe(
      "eligible",
    );
    expect(status("post-matric-scholarship-obc", { ...base, category: "obc", kaBackwardClass: "cat_1", incomeBand: "1l_2_5l" })).toBe(
      "eligible",
    );
    expect(status("vidyasiri-food-and-accommodation", { ...base, category: "obc", kaBackwardClass: "cat_1", incomeBand: "1l_2_5l" })).toBe(
      "eligible",
    );
    expect(
      status("vidyasiri-food-and-accommodation", {
        ...base,
        category: "obc", kaBackwardClass: "cat_1",
        incomeBand: "1l_2_5l",
        inGovernmentHostel: true,
      }),
    ).toBe("not_eligible");
  });

  it("Class 9 student is not eligible for post-matric schemes", () => {
    const profile: CitizenProfile = { state: "ka", educationLevel: "class_8_10", category: "sc" };
    expect(status("post-matric-scholarship-sc", profile)).toBe("not_eligible");
  });

  it("people outside Karnataka get every central scheme and no Karnataka scheme", () => {
    for (const state of indianStates.filter((s) => s !== "ka")) {
      for (const scheme of schemes) {
        const result = evaluateScheme(scheme.criteria, { state }).status;
        if (scheme.state === "ka") expect(result, `${scheme.slug} in ${state}`).toBe("not_eligible");
        else expect(result, `${scheme.slug} in ${state}`).toBe("likely_eligible");
      }
    }
  });

  it("every state scheme names its state and checks residence", () => {
    for (const scheme of schemes) {
      if (scheme.level === "central") {
        expect(scheme.state).toBeUndefined();
        continue;
      }
      expect(scheme.state, scheme.slug).toBeDefined();
      expect(JSON.stringify(scheme.criteria), scheme.slug).toContain(`"field":"state","value":"${scheme.state}"`);
    }
  });

  it("an OBC student outside Karnataka is not matched to Karnataka OBC schemes", () => {
    const profile: CitizenProfile = { occupation: "student", state: "up", category: "obc", educationLevel: "ug", incomeBand: "upto_1l" };
    expect(status("post-matric-scholarship-obc", profile)).toBe("not_eligible");
  });

  it("a brand-new visitor (no answers) is never marked not eligible", () => {
    for (const scheme of schemes) {
      expect(evaluateScheme(scheme.criteria, {}).status).toBe("likely_eligible");
    }
  });

  it("Central Sector percentile rule does not apply to PG students", () => {
    const pg: CitizenProfile = { occupation: "student", educationLevel: "pg", incomeBand: "3l_4_5l" };
    expect(status("central-sector-scholarship", pg)).toBe("eligible");
  });
});

describe("scheme data integrity", () => {
  it("has unique slugs and never invents deadlines", () => {
    expect(new Set(schemes.map((s) => s.slug)).size).toBe(schemes.length);
    for (const s of schemes) {
      expect(s.deadline, s.slug).toBeNull();
      expect(s.sources.length, s.slug).toBeGreaterThan(0);
      // Official government domains, plus official scheme portals run by government bodies (SIDBI, MUDRA, Labour Ministry).
      const officialNonGov = ["www.mudra.org.in", "www.standupmitra.in", "maandhan.in"];
      for (const src of [...s.sources, { url: s.applyUrl }]) {
        const host = new URL(src.url).hostname;
        expect(src.url.startsWith("https://"), src.url).toBe(true);
        // .nic.in sites are run by the National Informatics Centre for government departments.
        expect(host.endsWith(".gov.in") || host.endsWith(".nic.in") || officialNonGov.includes(host), src.url).toBe(true);
      }
    }
  });

  it("every text has all three languages", () => {
    for (const s of schemes) {
      const texts = [s.name, s.summary, s.benefit, s.department, s.portalName, ...s.howToApply, ...s.criteria.map((c) => c.label)];
      if (s.notes) texts.push(s.notes);
      for (const t of texts) {
        for (const locale of ["en", "kn", "hi"] as const) expect(t[locale].trim(), `${s.slug}`).not.toBe("");
      }
    }
  });
});
