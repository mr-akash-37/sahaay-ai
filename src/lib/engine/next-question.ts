import type { Scheme } from "@/data/schemes";
import { visibleQuestions, type Question } from "@/lib/profile/questions";
import { evaluateRule, evaluateScheme } from "./evaluate";
import type { CitizenProfile, ProfileField, Rule } from "./types";

/** Every profile field a rule looks at. */
export function ruleFields(rule: Rule): Set<ProfileField> {
  switch (rule.kind) {
    case "equals":
    case "in":
      return new Set([rule.field]);
    case "between":
      return new Set([rule.field]);
    case "incomeAtMost":
      return new Set(["incomeBand"]);
    case "allOf":
    case "anyOf":
      return new Set(rule.rules.flatMap((r) => [...ruleFields(r)]));
  }
}

/**
 * Picks the ONE question whose answer would settle the most still-possible
 * schemes — so the assistant asks only what is needed. Returns null when no
 * unanswered question can change any result.
 */
export function nextBestQuestion(profile: CitizenProfile, schemes: readonly Scheme[]): Question | null {
  const unanswered = visibleQuestions(profile).filter((q) => profile[q.field] === undefined);
  if (unanswered.length === 0) return null;

  // For each field: how many still-possible schemes have an undecided rule that depends on it.
  const impact = new Map<ProfileField, number>();
  for (const scheme of schemes) {
    const evaluation = evaluateScheme(scheme.criteria, profile);
    if (evaluation.status === "not_eligible") continue;
    const fields = new Set<ProfileField>();
    for (const { criterion, outcome } of evaluation.results) {
      if (outcome === "unknown") for (const f of ruleFields(criterion.rule)) fields.add(f);
      if (criterion.appliesWhen && evaluateRule(criterion.appliesWhen, profile) === "unknown") {
        for (const f of ruleFields(criterion.appliesWhen)) fields.add(f);
      }
    }
    for (const f of fields) impact.set(f, (impact.get(f) ?? 0) + 1);
  }

  let best: { question: Question; score: number } | null = null;
  for (const question of unanswered) {
    const score = impact.get(question.field) ?? 0;
    // Strictly greater keeps the natural question order on ties.
    if (score > 0 && (!best || score > best.score)) best = { question, score };
  }
  return best?.question ?? null;
}
