import { timingSafeEqual } from "node:crypto";
import { runAlerts } from "@/lib/alerts/run";
import { featureEnabled, getServerEnv } from "@/lib/env";
import { clientKey, createRateLimiter } from "@/lib/security/rate-limit";
import { getUserFromRequest, isAdminUser } from "@/lib/supabase/admin";

const limit = createRateLimiter({ limit: 10, windowMs: 60_000 });

function matchesCronSecret(request: Request): boolean {
  const secret = getServerEnv().CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** Allowed callers: Vercel Cron (Bearer CRON_SECRET) or a signed-in admin (Bearer access token). */
async function authorise(request: Request): Promise<boolean> {
  if (matchesCronSecret(request)) return true;
  const user = await getUserFromRequest(request);
  return user ? isAdminUser(user.id) : false;
}

async function handle(request: Request) {
  const rate = limit(clientKey(request));
  if (!rate.allowed) return Response.json({ error: "Too many requests" }, { status: 429 });

  if (!featureEnabled("supabaseAdmin")) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }
  if (!(await authorise(request))) {
    return Response.json({ error: "Not allowed" }, { status: 401 });
  }

  try {
    return Response.json({ ok: true, ...(await runAlerts()) });
  } catch (error) {
    console.error("alert run failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Alert run failed" }, { status: 500 });
  }
}

// Vercel Cron sends GET; the admin portal sends POST.
export const GET = handle;
export const POST = handle;
