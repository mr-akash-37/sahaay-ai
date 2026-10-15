import { featureEnabled } from "@/lib/env";
import { clientKey, createRateLimiter } from "@/lib/security/rate-limit";
import { getAdminSupabase, getUserFromRequest } from "@/lib/supabase/admin";

const limit = createRateLimiter({ limit: 5, windowMs: 60_000 });

/**
 * Deletes the caller's own account. All their rows (answers, documents,
 * notifications, profile) are removed by ON DELETE CASCADE.
 */
export async function DELETE(request: Request) {
  const rate = limit(clientKey(request));
  if (!rate.allowed) return Response.json({ error: "Too many requests" }, { status: 429 });

  if (!featureEnabled("supabaseAdmin")) {
    return Response.json({ error: "Accounts are not configured" }, { status: 503 });
  }

  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { error } = await getAdminSupabase().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("account delete failed", error.status);
    return Response.json({ error: "Could not delete account" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
