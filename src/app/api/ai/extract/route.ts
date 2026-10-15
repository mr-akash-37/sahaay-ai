import { z } from "zod";
import { extractProfileFromText } from "@/lib/ai/extract-rules";
import { EXTRACTION_SYSTEM_PROMPT, extractionUserMessage } from "@/lib/ai/prompts";
import { complete } from "@/lib/ai/provider";
import type { ProfileField } from "@/lib/engine/types";
import { featureEnabled } from "@/lib/env";
import { parseProfile } from "@/lib/profile/schema";
import { clientKey, createRateLimiter } from "@/lib/security/rate-limit";

const limit = createRateLimiter({ limit: 20, windowMs: 60_000 });
const bodySchema = z.object({ text: z.string().trim().min(1).max(1000) });

/**
 * "Describe your situation" → structured answers.
 * The rule-based reader always runs; if AI is configured its answers are
 * validated field-by-field and take priority. The citizen always confirms
 * the result before it is used — nothing is decided here.
 */
export async function POST(request: Request) {
  const rate = limit(clientKey(request));
  if (!rate.allowed) return Response.json({ error: "Too many requests" }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Text must be 1–1000 characters" }, { status: 422 });

  const rules = extractProfileFromText(parsed.data.text);

  if (!featureEnabled("ai")) {
    return Response.json({ profile: rules.profile, fields: rules.fields, source: "rules" });
  }

  try {
    const raw = await complete({
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: extractionUserMessage(parsed.data.text) }],
      json: true,
      maxTokens: 400,
    });
    const aiProfile = parseProfile(JSON.parse(raw)) ?? {};
    const profile = { ...rules.profile, ...aiProfile };
    return Response.json({ profile, fields: Object.keys(profile) as ProfileField[], source: "ai" });
  } catch (error) {
    console.error("ai extract failed, using rules", error instanceof Error ? error.message : "unknown");
    return Response.json({ profile: rules.profile, fields: rules.fields, source: "rules" });
  }
}
