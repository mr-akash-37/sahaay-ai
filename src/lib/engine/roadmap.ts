import { documents, type DocumentId } from "@/data/documents";
import type { Scheme } from "@/data/schemes";
import type { CitizenProfile, Criterion, SchemeEvaluation } from "./types";
import { compareEvaluations, evaluateScheme } from "./evaluate";

export type DocumentStatus = "have" | "applying" | "missing";
export type DocumentStatuses = Partial<Record<DocumentId, DocumentStatus>>;

export type SchemeMatch = { scheme: Scheme; evaluation: SchemeEvaluation };

/** Evaluates every scheme and sorts: eligible → likely → not eligible. */
export function matchSchemes(schemes: readonly Scheme[], profile: CitizenProfile): SchemeMatch[] {
  return schemes
    .map((scheme) => ({ scheme, evaluation: evaluateScheme(scheme.criteria, profile) }))
    .sort((a, b) => compareEvaluations(a.evaluation, b.evaluation));
}

export function isActionable(match: SchemeMatch): boolean {
  return match.evaluation.status !== "not_eligible";
}

// Certificates from government offices take the longest, so they come first.
const SLOW_DOCUMENTS: ReadonlySet<DocumentId> = new Set([
  "caste_certificate",
  "income_certificate",
  "fruits_id",
  "ration_card",
]);

export type DocumentStep = {
  documentId: DocumentId;
  status: DocumentStatus;
  /** Slugs of the schemes that need this document. */
  neededFor: string[];
  slow: boolean;
};

/**
 * Documents needed across all schemes the citizen can apply for, deduplicated.
 * Order: not-yet-done before done, slow office certificates first, then the
 * documents needed by the most schemes.
 */
export function documentSteps(matches: readonly SchemeMatch[], statuses: DocumentStatuses): DocumentStep[] {
  const neededFor = new Map<DocumentId, string[]>();
  for (const { scheme } of matches.filter(isActionable)) {
    for (const id of scheme.documents) {
      neededFor.set(id, [...(neededFor.get(id) ?? []), scheme.slug]);
    }
  }

  const statusRank: Record<DocumentStatus, number> = { missing: 0, applying: 1, have: 2 };

  return [...neededFor.entries()]
    .map(([documentId, slugs]) => ({
      documentId,
      status: statuses[documentId] ?? "missing",
      neededFor: slugs,
      slow: SLOW_DOCUMENTS.has(documentId),
    }))
    .sort(
      (a, b) =>
        statusRank[a.status] - statusRank[b.status] ||
        Number(b.slow) - Number(a.slow) ||
        b.neededFor.length - a.neededFor.length ||
        documentOrder(a.documentId) - documentOrder(b.documentId),
    );
}

const documentKeys = Object.keys(documents);
function documentOrder(id: DocumentId): number {
  return documentKeys.indexOf(id);
}

export type RiskLevel = "high" | "medium" | "low";

export type Risk =
  | { level: RiskLevel; kind: "document"; documentId: DocumentId; neededFor: string[] }
  | { level: "medium"; kind: "unknown"; criterion: Criterion; schemeSlug: string };

/**
 * Blockers that could stop an application:
 * - high: a slow office certificate is still missing
 * - medium: a requirement is unanswered, or a slow certificate is in progress
 * - low: a quick document is still missing
 */
export function findRisks(matches: readonly SchemeMatch[], statuses: DocumentStatuses): Risk[] {
  const risks: Risk[] = [];

  for (const step of documentSteps(matches, statuses)) {
    if (step.status === "have") continue;
    const level: RiskLevel = step.slow ? (step.status === "missing" ? "high" : "medium") : "low";
    if (step.status === "applying" && !step.slow) continue;
    risks.push({ level, kind: "document", documentId: step.documentId, neededFor: step.neededFor });
  }

  const seen = new Set<string>();
  for (const { scheme, evaluation } of matches.filter(isActionable)) {
    for (const { criterion, outcome } of evaluation.results) {
      if (outcome !== "unknown" || seen.has(criterion.id)) continue;
      seen.add(criterion.id);
      risks.push({ level: "medium", kind: "unknown", criterion, schemeSlug: scheme.slug });
    }
  }

  const levelRank: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };
  return risks.sort((a, b) => levelRank[a.level] - levelRank[b.level]);
}
