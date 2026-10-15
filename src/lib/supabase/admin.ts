import "server-only";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { requireFeature } from "@/lib/env";

let adminClient: SupabaseClient | undefined;

/** Service-role client. Bypasses RLS — use only in server code after authorising the caller. */
export function getAdminSupabase(): SupabaseClient {
  if (adminClient) return adminClient;
  const env = requireFeature("supabaseAdmin");
  adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

/** Reads `Authorization: Bearer <access token>` and returns the verified user, or null. */
export async function getUserFromRequest(request: Request): Promise<User | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;
  const { data, error } = await getAdminSupabase().auth.getUser(match[1]);
  return error || !data.user ? null : data.user;
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const { data } = await getAdminSupabase().from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}
