import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// NEXT_PUBLIC_* values are inlined at build time, so they must be read with
// literal property access.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const supabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null | undefined;

const isLocalHost = (host: string) =>
  host === "localhost" || host === "[::1]" || host.endsWith(".localhost") || /^127\./.test(host);

/**
 * A database on "localhost" only exists on the developer's own computer. When
 * the app is opened from anywhere else (a phone through ngrok, a deployment
 * that was built with local settings), calling it would fail — and phones ask
 * for "local network" permission — so it's treated as not configured.
 */
export function reachableFrom(supabaseUrl: string, pageHost: string): boolean {
  try {
    return !isLocalHost(new URL(supabaseUrl).hostname) || isLocalHost(pageHost);
  } catch {
    return false;
  }
}

/**
 * Browser Supabase client, or null when Supabase is not configured (or not
 * reachable from this page) — callers then fall back to guest mode. The
 * session is kept in the browser and sent to our API routes as a bearer
 * token when needed.
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (typeof window === "undefined" || !url || !anonKey) return null;
  if (!reachableFrom(url, window.location.hostname)) return (client = null);
  client = createClient(url, anonKey, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}
