"use client";

import { useCallback, useEffect, useState } from "react";
import type { AlertKind } from "@/lib/alerts/plan";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export type AppNotification = {
  id: string;
  kind: AlertKind;
  scheme_slug: string;
  read_at: string | null;
  created_at: string;
};

/** The signed-in citizen's notifications (RLS returns only their own). */
export function useNotifications(userId: string | null) {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase || !userId) return;
    let active = true;
    supabase
      .from("notifications")
      .select("id, kind, scheme_slug, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (active) setItems(error ? [] : ((data ?? []) as AppNotification[]));
      });
    return () => {
      active = false;
    };
  }, [userId, version]);

  const markAllRead = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase || !userId) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    setVersion((v) => v + 1);
  }, [userId]);

  const unread = (items ?? []).filter((n) => !n.read_at).length;
  return { items, unread, markAllRead };
}
