import { connection } from "next/server";
import { featureEnabled, type Feature } from "@/lib/env";

/**
 * Shows which integrations are switched on, as yes/no only — never a value.
 * Used to check a deployment: open /api/health after setting the variables.
 */
export async function GET() {
  // Answer from the live settings on every request, not from a copy saved at build time.
  await connection();
  const features: Feature[] = ["supabase", "supabaseAdmin", "email", "cron", "ai", "n8nWebhook"];
  return Response.json(
    { ok: true, features: Object.fromEntries(features.map((f) => [f, featureEnabled(f)])) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
