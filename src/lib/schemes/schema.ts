import { z } from "zod";
import { documentIds } from "@/data/documents";
import type { Scheme } from "@/data/schemes";
import { indianStates, type Rule } from "@/lib/engine/types";
import { profileFields } from "@/lib/profile/schema";

/**
 * Validates scheme records that come from outside the code (database, admin
 * edits, n8n proposals) so the eligibility engine only ever sees valid rules.
 */

const text = z.string().trim().min(1).max(2000);
export const localizedTextSchema = z.object({ en: text, kn: text, hi: text });

const profileField = z.enum(profileFields);

export const ruleSchema: z.ZodType<Rule> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("equals"), field: profileField, value: z.union([z.string(), z.boolean()]) }),
    z.object({ kind: z.literal("in"), field: profileField, values: z.array(z.string()).min(1) }),
    z.object({
      kind: z.literal("between"),
      field: z.literal("age"),
      min: z.number().int().min(0).max(150).optional(),
      max: z.number().int().min(0).max(150).optional(),
    }),
    z.object({ kind: z.literal("incomeAtMost"), max: z.number().int().positive() }),
    z.object({ kind: z.literal("allOf"), rules: z.array(ruleSchema).min(1) }),
    z.object({ kind: z.literal("anyOf"), rules: z.array(ruleSchema).min(1) }),
  ]),
);

const criterionSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  rule: ruleSchema,
  label: localizedTextSchema,
  appliesWhen: ruleSchema.optional(),
  weight: z.number().positive().max(10).optional(),
});

const httpsUrl = z.url({ protocol: /^https$/ });
const isoDate = z.iso.date();

export const schemeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(100),
  name: localizedTextSchema,
  department: localizedTextSchema,
  level: z.enum(["state", "central"]),
  state: z.enum(indianStates).optional(),
  summary: localizedTextSchema,
  benefit: localizedTextSchema,
  criteria: z.array(criterionSchema).min(1),
  documents: z.array(z.enum(documentIds)),
  howToApply: z.array(localizedTextSchema).min(1),
  applyUrl: httpsUrl,
  portalName: localizedTextSchema,
  sources: z.array(z.object({ label: text, url: httpsUrl })).min(1),
  trust: z.enum(["verified", "partially_verified", "needs_review"]),
  lastReviewed: isoDate,
  deadline: isoDate.nullable(),
  notes: localizedTextSchema.optional(),
}) satisfies z.ZodType<Scheme>;

export type SchemeParseResult = { ok: true; scheme: Scheme } | { ok: false; errors: string[] };

export function parseScheme(value: unknown): SchemeParseResult {
  const result = schemeSchema.safeParse(value);
  if (result.success) return { ok: true, scheme: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
  };
}

/**
 * Database rows win over built-in records. A row that doesn't pass validation
 * (for example one saved by an older version of the app) falls back to the
 * built-in record with the same slug, so a scheme never silently disappears.
 */
export function mergePublished(rows: unknown[], builtIn: readonly Scheme[]): Scheme[] {
  return rows.flatMap((row) => {
    const result = parseScheme(row);
    if (result.ok) return [result.scheme];
    const slug = row && typeof row === "object" ? (row as { slug?: unknown }).slug : undefined;
    const fallback = builtIn.find((s) => s.slug === slug);
    return fallback ? [fallback] : [];
  });
}

/** Parses a list, silently skipping invalid records so one bad row never breaks the page. */
export function parseSchemes(values: unknown[]): Scheme[] {
  return values.flatMap((value) => {
    const result = parseScheme(value);
    return result.ok ? [result.scheme] : [];
  });
}
