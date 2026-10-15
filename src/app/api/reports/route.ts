import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getScheme } from "@/data/schemes";
import { featureEnabled } from "@/lib/env";
import { clientKey, createRateLimiter } from "@/lib/security/rate-limit";
import { getAdminSupabase } from "@/lib/supabase/admin";

const limit = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

const bodySchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(100),
  message: z.string().trim().min(10).max(1000),
});

// Strip things that look like phone, Aadhaar, account numbers or emails before saving.
function redact(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email removed]")
    .replace(/\d[\d\s-]{8,}\d/g, "[number removed]");
}

/** Citizen "report wrong information" → pending item in the admin review queue. */
export async function POST(request: Request) {
  const rate = limit(clientKey(request));
  if (!rate.allowed) return Response.json({ error: "Too many reports" }, { status: 429 });
  if (!featureEnabled("supabaseAdmin")) return Response.json({ error: "Reports are not configured" }, { status: 503 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid report" }, { status: 422 });

  const db = getAdminSupabase();
  let sourceUrl = getScheme(parsed.data.slug)?.applyUrl;
  if (!sourceUrl) {
    const { data } = await db.from("schemes").select("data").eq("slug", parsed.data.slug).maybeSingle();
    sourceUrl = (data?.data as { applyUrl?: string } | undefined)?.applyUrl;
  }
  if (!sourceUrl) return Response.json({ error: "Unknown scheme" }, { status: 404 });

  const { error } = await db.from("discovery_events").insert({
    idempotency_key: `report:${randomUUID()}`,
    source: "Citizen report",
    source_url: sourceUrl,
    event_type: "citizen_report",
    title: `Citizen report: ${parsed.data.slug}`,
    details: redact(parsed.data.message),
    scheme_slug: parsed.data.slug,
  });
  if (error) {
    console.error("report insert failed", error.code);
    return Response.json({ error: "Could not save report" }, { status: 500 });
  }
  return Response.json({ ok: true }, { status: 201 });
}
