import { z } from "zod";
import { schemes as builtInSchemes } from "@/data/schemes";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { answerWithoutAi } from "@/lib/ai/answer";
import { buildChatContext, chatSystemPrompt } from "@/lib/ai/prompts";
import { complete } from "@/lib/ai/provider";
import { featureEnabled } from "@/lib/env";
import { parseDocumentStatuses, parseProfile } from "@/lib/profile/schema";
import { mergePublished } from "@/lib/schemes/schema";
import { clientKey, createRateLimiter } from "@/lib/security/rate-limit";
import { getAdminSupabase } from "@/lib/supabase/admin";

const limit = createRateLimiter({ limit: 30, windowMs: 60_000 });

const bodySchema = z.object({
  locale: z.string().max(5),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1500) }))
    .min(1)
    .max(12),
  profile: z.unknown().optional(),
  statuses: z.unknown().optional(),
});

async function loadSchemes() {
  if (!featureEnabled("supabaseAdmin")) return builtInSchemes;
  const { data, error } = await getAdminSupabase().from("schemes").select("data").eq("status", "published");
  if (error || !data?.length) return builtInSchemes;
  const parsed = mergePublished(data.map((row) => row.data), builtInSchemes);
  return parsed.length > 0 ? parsed : builtInSchemes;
}

/**
 * Sahaay Assistant. With AI configured, the model answers using ONLY the
 * verified scheme data and this citizen's rule-engine results. Without AI
 * (or if the AI fails), the rule-based assistant answers instead.
 */
export async function POST(request: Request) {
  const rate = limit(clientKey(request));
  if (!rate.allowed) return Response.json({ error: "Too many requests" }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 422 });

  const locale = resolveLocale(parsed.data.locale);
  const profile = parseProfile(parsed.data.profile);
  const statuses = parseDocumentStatuses(parsed.data.statuses) ?? {};
  const schemes = await loadSchemes();
  const messages = parsed.data.messages.slice(-8);
  const question = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";

  const fallback = () =>
    Response.json({
      reply: answerWithoutAi({ question, profile, schemes, statuses, locale, dict: getDictionary(locale) }),
      source: "rules",
    });

  if (!featureEnabled("ai")) return fallback();

  try {
    const reply = await complete({
      system: chatSystemPrompt(buildChatContext(schemes, profile, statuses, locale), locale),
      messages,
    });
    return Response.json({ reply: reply.trim().slice(0, 3000), source: "ai" });
  } catch (error) {
    console.error("ai chat failed, using rules", error instanceof Error ? error.message : "unknown");
    return fallback();
  }
}
