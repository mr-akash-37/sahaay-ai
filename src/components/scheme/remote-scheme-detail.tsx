"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { StatusMessage } from "@/components/state/status-message";
import { buttonVariants } from "@/components/ui/button";
import type { Scheme } from "@/data/schemes";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { parseScheme } from "@/lib/schemes/schema";
import { getBrowserSupabase, supabaseConfigured } from "@/lib/supabase/browser";
import { SchemeDetail } from "./scheme-detail";

const noop = () => () => {};

/** Scheme published by an admin after the app was built — loaded from the database. */
export function RemoteSchemeDetail({ slug, locale, dict }: { slug: string; locale: Locale; dict: Dictionary }) {
  const [state, setState] = useState<{ status: "loading" } | { status: "missing" } | { status: "ready"; scheme: Scheme }>(
    // Same value on server and client (build-time constant) — avoids a hydration mismatch.
    () => (supabaseConfigured ? { status: "loading" } : { status: "missing" }),
  );
  // Configured but unreachable from this page (e.g. a local database opened through ngrok).
  const available = useSyncExternalStore(noop, () => getBrowserSupabase() !== null, () => supabaseConfigured);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let active = true;
    supabase
      .from("schemes")
      .select("data")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const parsed = data ? parseScheme(data.data) : null;
        setState(parsed?.ok ? { status: "ready", scheme: parsed.scheme } : { status: "missing" });
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (state.status === "loading" && available) {
    return <div className="mt-6 h-96 animate-pulse rounded-2xl bg-muted" role="status" aria-label={dict.common.loading} />;
  }
  if (state.status !== "ready") {
    return (
      <StatusMessage icon={<SearchX />} title={dict.errors.notFoundTitle} body={dict.errors.notFoundBody}>
        <Link href={`/${locale}/schemes`} className={buttonVariants()}>
          {dict.scheme.allSchemes}
        </Link>
      </StatusMessage>
    );
  }
  return <SchemeDetail scheme={state.scheme} locale={locale} dict={dict} />;
}
