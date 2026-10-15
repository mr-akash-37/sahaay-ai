import {
  incomeBandRange,
  type CitizenProfile,
  type Confidence,
  type Criterion,
  type CriterionResult,
  type EligibilityStatus,
  type IncomeBand,
  type Outcome,
  type Rule,
  type SchemeEvaluation,
} from "./types";

/**
 * Deterministic eligibility engine. No AI is involved in any decision here.
 *
 * Three-valued logic: a rule is satisfied, not satisfied, or unknown (the
 * citizen has not answered or chose "I don't know"). Unknown never counts
 * as a failure.
 */
export function evaluateRule(rule: Rule, profile: CitizenProfile): Exclude<Outcome, "not_applicable"> {
  switch (rule.kind) {
    case "equals": {
      const value = profile[rule.field];
      if (value === undefined || value === "unknown") return "unknown";
      return value === rule.value ? "satisfied" : "not_satisfied";
    }
    case "in": {
      const value = profile[rule.field];
      if (value === undefined || value === "unknown") return "unknown";
      return rule.values.includes(String(value)) ? "satisfied" : "not_satisfied";
    }
    case "between": {
      const value = profile[rule.field];
      if (typeof value !== "number") return "unknown";
      if (rule.min !== undefined && value < rule.min) return "not_satisfied";
      if (rule.max !== undefined && value > rule.max) return "not_satisfied";
      return "satisfied";
    }
    case "incomeAtMost": {
      const band = profile.incomeBand;
      if (band === undefined || band === "unknown") return "unknown";
      const { min, max } = incomeBandRange[band as IncomeBand];
      if (max <= rule.max) return "satisfied";
      if (min > rule.max) return "not_satisfied";
      return "unknown"; // band straddles the limit
    }
    case "allOf": {
      const outcomes = rule.rules.map((r) => evaluateRule(r, profile));
      if (outcomes.includes("not_satisfied")) return "not_satisfied";
      if (outcomes.includes("unknown")) return "unknown";
      return "satisfied";
    }
    case "anyOf": {
      const outcomes = rule.rules.map((r) => evaluateRule(r, profile));
      if (outcomes.includes("satisfied")) return "satisfied";
      if (outcomes.includes("unknown")) return "unknown";
      return "not_satisfied";
    }
  }
}

export function evaluateCriterion(criterion: Criterion, profile: CitizenProfile): CriterionResult {
  if (criterion.appliesWhen && evaluateRule(criterion.appliesWhen, profile) === "not_satisfied") {
    return { criterion, outcome: "not_applicable" };
  }
  return { criterion, outcome: evaluateRule(criterion.rule, profile) };
}

export function confidenceFor(unknownWeight: number, applicableWeight: number): Confidence {
  if (applicableWeight === 0 || unknownWeight === 0) return "high";
  const share = unknownWeight / applicableWeight;
  return share <= 1 / 3 ? "medium" : "low";
}

/**
 * Match score = satisfied weight / applicable weight (0–100, rounded down so
 * 100 only appears when every applicable criterion is satisfied).
 */
export function evaluateScheme(criteria: readonly Criterion[], profile: CitizenProfile): SchemeEvaluation {
  const results = criteria.map((c) => evaluateCriterion(c, profile));

  let applicable = 0;
  let satisfied = 0;
  let unknown = 0;
  let failed = false;

  for (const { criterion, outcome } of results) {
    if (outcome === "not_applicable") continue;
    const weight = criterion.weight ?? 1;
    applicable += weight;
    if (outcome === "satisfied") satisfied += weight;
    else if (outcome === "unknown") unknown += weight;
    else failed = true;
  }

  const status: EligibilityStatus = failed ? "not_eligible" : unknown > 0 ? "likely_eligible" : "eligible";
  const score = applicable === 0 ? 0 : Math.floor((satisfied / applicable) * 100);

  return { status, score, confidence: confidenceFor(unknown, applicable), results };
}

const statusOrder: Record<EligibilityStatus, number> = { eligible: 0, likely_eligible: 1, not_eligible: 2 };

/** Eligible first, then likely, then not eligible; higher scores first within each group. */
export function compareEvaluations(a: SchemeEvaluation, b: SchemeEvaluation): number {
  return statusOrder[a.status] - statusOrder[b.status] || b.score - a.score;
}
