"use client";

import { useEffect, useState } from "react";
import { schemes as builtInSchemes, type Scheme } from "@/data/schemes";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { mergePublished } from "./schema";

let cache: Scheme[] | null = null;
let pending: Promise<Scheme[] | null> | null = null;
/** After a failed request, don't ask again for a while (the database may simply be offline). */
let failedAt = 0;
const RETRY_AFTER_MS = 60_000;

function loadPublished(): Promise<Scheme[] | null> {
  const supabase = getBrowserSupabase();
  if (!supabase) return Promise.resolve(null);
  if (cache) return Promise.resolve(cache);
  if (Date.now() - failedAt < RETRY_AFTER_MS) return Promise.resolve(null);
  pending ??= Promise.resolve(
    supabase
      .from("schemes")
      .select("data")
      .eq("status", "published")
      .order("slug"),
  )
    .then(({ data, error }) => {
      if (error || !data) return null;
      const merged = mergePublished(data.map((row) => row.data), builtInSchemes);
      return merged.length > 0 ? merged : null;
    })
    .catch(() => null)
    .then((result) => {
      if (result) cache = result;
      else failedAt = Date.now();
      pending = null;
      return result;
    });
  return pending;
}

/**
 * Published schemes from the database when Supabase is configured; otherwise
 * (or if the request fails) the built-in list. The page never breaks because
 * of the network.
 */
export function useSchemes(): Scheme[] {
  const [list, setList] = useState<Scheme[]>(() => cache ?? builtInSchemes);

  useEffect(() => {
    let active = true;
    loadPublished().then((result) => {
      if (active && result) setList(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return list;
}
