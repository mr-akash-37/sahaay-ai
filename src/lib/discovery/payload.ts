import { z } from "zod";
import { parseScheme } from "@/lib/schemes/schema";

export const discoveryEventTypes = [
  "new_scheme",
  "deadline_change",
  "benefit_change",
  "eligibility_change",
  "link_broken",
  "page_changed",
] as const;

const payloadSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(200),
  source: z.string().trim().min(1).max(200),
  sourceUrl: z.url({ protocol: /^https$/ }).max(2000),
  eventType: z.enum(discoveryEventTypes),
  title: z.string().trim().min(1).max(300),
  details: z.string().trim().max(5000).optional(),
  schemeSlug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(100)
    .optional(),
  proposed: z.unknown().optional(),
});

export type DiscoveryPayload = Omit<z.infer<typeof payloadSchema>, "proposed"> & { proposed?: object };

export type PayloadResult = { ok: true; payload: DiscoveryPayload } | { ok: false; errors: string[] };

/**
 * Validates what n8n sends. A proposed scheme, if included, must be a fully
 * valid scheme record — it still only becomes a draft for admin review.
 */
export function parseDiscoveryPayload(value: unknown): PayloadResult {
  const result = payloadSchema.safeParse(value);
  if (!result.success) {
    return { ok: false, errors: result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
  }
  const { proposed, ...rest } = result.data;
  if (proposed === undefined || proposed === null) return { ok: true, payload: rest };

  const scheme = parseScheme(proposed);
  if (!scheme.ok) return { ok: false, errors: scheme.errors.map((e) => `proposed.${e}`) };
  return { ok: true, payload: { ...rest, proposed: scheme.scheme } };
}
