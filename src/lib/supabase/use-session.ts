"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getBrowserSupabase, supabaseConfigured } from "./browser";

export type SessionState =
  | { status: "disabled" } // Supabase not configured: guest mode only
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "signed_in"; user: User; accessToken: string };

const noop = () => () => {};

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>(() =>
    supabaseConfigured ? { status: "loading" } : { status: "disabled" },
  );
  // Configured but unreachable from this page (e.g. a local database opened through ngrok) → guest mode.
  const available = useSyncExternalStore(noop, () => getBrowserSupabase() !== null, () => supabaseConfigured);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState(
        data.session
          ? { status: "signed_in", user: data.session.user, accessToken: data.session.access_token }
          : { status: "signed_out" },
      );
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(
        session
          ? { status: "signed_in", user: session.user, accessToken: session.access_token }
          : { status: "signed_out" },
      );
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return available ? state : { status: "disabled" };
}

/** Role from the citizen's own profile row (RLS limits it to themselves). */
export function useIsAdmin(session: SessionState): boolean | undefined {
  const userId = session.status === "signed_in" ? session.user.id : null;
  const [result, setResult] = useState<{ userId: string; admin: boolean } | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase || !userId) return;
    let active = true;
    supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setResult({ userId, admin: data?.role === "admin" });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  if (session.status !== "signed_in") return session.status === "loading" ? undefined : false;
  return result?.userId === userId ? result.admin : undefined;
}
