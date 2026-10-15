import { parseDiscoveryPayload } from "@/lib/discovery/payload";
import { featureEnabled, requireFeature } from "@/lib/env";
import { clientKey, createRateLimiter } from "@/lib/security/rate-limit";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verifySignature } from "@/lib/security/signature";
import { getAdminSupabase } from "@/lib/supabase/admin";

const MAX_BODY_BYTES = 256 * 1024;
const limit = createRateLimiter({ limit: 60, windowMs: 60_000 });

const json = (status: number, body: object, headers?: HeadersInit) =>
  Response.json(body, { status, headers });

/**
 * n8n → Sahaay AI. Signed with HMAC-SHA256 (see n8n/README.md).
 * Creates a *pending* discovery event for admin review. Never publishes.
 */
export async function POST(request: Request) {
  const rate = limit(clientKey(request));
  if (!rate.allowed) return json(429, { error: "Too many requests" }, { "Retry-After": String(rate.retryAfterSeconds) });

  if (!featureEnabled("n8nWebhook") || !featureEnabled("supabaseAdmin")) {
    return json(503, { error: "Webhook is not configured" });
  }
  const { N8N_WEBHOOK_SECRET } = requireFeature("n8nWebhook");

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return json(413, { error: "Payload too large" });

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return json(413, { error: "Payload too large" });

  const signature = verifySignature(
    N8N_WEBHOOK_SECRET!,
    body,
    request.headers.get(TIMESTAMP_HEADER),
    request.headers.get(SIGNATURE_HEADER),
  );
  if (!signature.ok) return json(401, { error: "Invalid signature", reason: signature.reason });

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    return json(400, { error: "Body must be JSON" });
  }

  const result = parseDiscoveryPayload(parsedBody);
  if (!result.ok) return json(422, { error: "Invalid payload", details: result.errors });

  const p = result.payload;
  const { data, error } = await getAdminSupabase()
    .from("discovery_events")
    .upsert(
      {
        idempotency_key: p.idempotencyKey,
        source: p.source,
        source_url: p.sourceUrl,
        event_type: p.eventType,
        title: p.title,
        details: p.details ?? null,
        scheme_slug: p.schemeSlug ?? null,
        proposed: p.proposed ?? null,
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    )
    .select("id");

  if (error) {
    console.error("discovery webhook insert failed", error.code);
    return json(500, { error: "Could not save event" });
  }

  const created = (data?.length ?? 0) > 0;
  return json(created ? 201 : 200, { ok: true, duplicate: !created });
}
