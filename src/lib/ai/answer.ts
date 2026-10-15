import { documents } from "@/data/documents";
import type { Scheme } from "@/data/schemes";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { evaluateScheme } from "@/lib/engine/evaluate";
import { documentSteps, isActionable, matchSchemes, type DocumentStatuses } from "@/lib/engine/roadmap";
import type { CitizenProfile, Outcome } from "@/lib/engine/types";
import { format, formatDate } from "@/lib/format";

/**
 * Rule-based assistant used when no AI key is configured (and as a fallback).
 * Every answer is built from verified scheme data and the eligibility engine.
 */

export type Intent = "safety" | "deadline" | "docs" | "how" | "next" | "why" | "which" | "unknown";

const INTENTS: readonly [Intent, RegExp][] = [
  ["safety", /\b(pay|paid|money|fees?|charges?|agent|bribe|otp|commission|cost)\b|ಹಣ|ಶುಲ್ಕ|ಏಜೆಂಟ್|ಲಂಚ|पैसे|फ़?ीस|शुल्क|एजेंट|रिश्वत|ओटीपी/],
  ["deadline", /\b(deadline|last\s*date|due\s*date|closing\s*date|when\s*(does|will).*close)\b|ಕೊನೆಯ\s*ದಿನಾಂಕ|आख़?िरी\s*तारीख़?|अंतिम\s*तिथि/],
  ["docs", /\b(documents?|certificates?|papers?|proofs?)\b|ದಾಖಲೆ|ಪ್ರಮಾಣಪತ್ರ|दस्तावेज़?|कागज़?|प्रमाणपत्र/],
  ["how", /\b(how\s*(to|do\s*i|can\s*i)\s*apply|apply|application|process|procedure|register)\b|ಅರ್ಜಿ|ನೋಂದಣಿ|आवेदन|पंजीकरण/],
  ["next", /\b(next|what\s*(should|do)\s*i\s*do|first\s*step|start)\b|ಮುಂದೆ|ಮುಂದಿನ|ಮೊದಲು|आगे|अगला|पहले\s*क्या/],
  ["why", /\b(why|eligible|eligibility|qualify|qualified)\b|ಏಕೆ|ಅರ್ಹ|क्यों|पात्र/],
  ["which", /\b(which|what)\s*(schemes?|benefits?)|\b(schemes?|benefits?)\s*(for\s*me|can\s*i\s*get)|\blist\b|ಯಾವ\s*ಯೋಜನೆ|ಯೋಜನೆಗಳು|कौन\s*-?\s*सी\s*योजना|योजनाएँ|योजनाएं/],
];

export function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  for (const [intent, pattern] of INTENTS) if (pattern.test(t)) return intent;
  return "unknown";
}

/** Finds the scheme a question is about, by matching distinctive words from its name in any language. */
export function findScheme(text: string, schemes: readonly Scheme[]): Scheme | undefined {
  const t = text.toLowerCase();
  let best: { scheme: Scheme; score: number } | undefined;
  const common = new Set(["scheme", "yojana", "scholarship", "students", "student", "for", "and", "the", "pradhan", "mantri", "post-matric"]);

  for (const scheme of schemes) {
    const words = new Set(
      [scheme.slug.replace(/-/g, " "), scheme.name.en, scheme.name.kn, scheme.name.hi]
        .join(" ")
        .toLowerCase()
        .split(/[\s()—–\-/,.:]+/)
        .filter((w) => w.length >= 3 && !common.has(w)),
    );
    let score = 0;
    for (const word of words) if (t.includes(word)) score += word.length >= 5 ? 2 : 1;
    if (score > 0 && (!best || score > best.score)) best = { scheme, score };
  }
  return best && best.score >= 2 ? best.scheme : undefined;
}

const mark: Record<Outcome, string> = { satisfied: "✓", not_satisfied: "✗", unknown: "?", not_applicable: "–" };

export function answerWithoutAi({
  question,
  profile,
  schemes,
  statuses,
  locale,
  dict,
}: {
  question: string;
  profile: CitizenProfile | null;
  schemes: readonly Scheme[];
  statuses: DocumentStatuses;
  locale: Locale;
  dict: Dictionary;
}): string {
  const t = dict.assistant;
  const intent = detectIntent(question);
  const scheme = findScheme(question, schemes);
  const hasProfile = !!profile && Object.keys(profile).length > 0;
  const matches = hasProfile ? matchSchemes(schemes, profile) : [];
  const bullet = (s: string) => `• ${s}`;

  if (intent === "safety") return t.safety;

  if (intent === "deadline" && scheme) {
    return scheme.deadline
      ? `${scheme.name[locale]}: ${formatDate(scheme.deadline, locale)}`
      : format(t.deadline, { scheme: scheme.name[locale], portal: scheme.portalName[locale] });
  }

  if (intent === "docs" && scheme) {
    return [format(t.docsFor, { scheme: scheme.name[locale] }), ...scheme.documents.map((id) => bullet(documents[id].name[locale]))].join("\n");
  }

  if (intent === "how" && scheme) {
    return [
      format(t.howFor, { scheme: scheme.name[locale] }),
      ...scheme.howToApply.map((step, i) => `${i + 1}. ${step[locale]}`),
      `🔗 ${scheme.portalName[locale]}: ${scheme.applyUrl}`,
    ].join("\n");
  }

  // Everything below is personal, so it needs the citizen's answers.
  if (!hasProfile) {
    if (scheme) {
      return [format(t.whyIntro, { scheme: scheme.name[locale] }), ...scheme.criteria.map((c) => bullet(c.label[locale]))].join("\n");
    }
    return intent === "unknown" ? t.fallback : t.noProfile;
  }

  if ((intent === "why" || intent === "unknown") && scheme) {
    const evaluation = evaluateScheme(scheme.criteria, profile);
    return [
      format(t.whyIntro, { scheme: scheme.name[locale] }),
      `${dict.results[evaluation.status]}`,
      ...evaluation.results
        .filter((r) => r.outcome !== "not_applicable")
        .map((r) => `${mark[r.outcome]} ${r.criterion.label[locale]}`),
    ].join("\n");
  }

  if (intent === "docs") {
    const steps = documentSteps(matches, statuses).filter((s) => s.status !== "have").slice(0, 4);
    if (steps.length === 0) return t.noneMatch;
    return [t.docsFirst, ...steps.map((s) => bullet(documents[s.documentId].name[locale]))].join("\n");
  }

  if (intent === "next") {
    const step = documentSteps(matches, statuses).find((s) => s.status !== "have");
    if (step) {
      const doc = documents[step.documentId];
      return format(t.nextStep, { doc: doc.name[locale], where: doc.where[locale] });
    }
    const first = matches.find(isActionable);
    return first
      ? format(t.nextAllDone, { scheme: first.scheme.name[locale], portal: first.scheme.portalName[locale] })
      : t.noneMatch;
  }

  if (intent === "which" || intent === "why" || intent === "how") {
    const eligible = matches.filter((m) => m.evaluation.status === "eligible");
    const likely = matches.filter((m) => m.evaluation.status === "likely_eligible");
    if (eligible.length + likely.length === 0) return t.noneMatch;
    const lines: string[] = [];
    if (eligible.length > 0) {
      lines.push(format(t.listIntro, { count: eligible.length }), ...eligible.map((m) => bullet(m.scheme.name[locale])));
    }
    if (likely.length > 0) {
      if (lines.length > 0) lines.push("");
      lines.push(t.likelyIntro, ...likely.map((m) => bullet(m.scheme.name[locale])));
    }
    return lines.join("\n");
  }

  return t.fallback;
}
