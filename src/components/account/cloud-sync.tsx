"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { documentStore, profileStore } from "@/lib/profile/local-store";
import { parseDocumentStatuses, parseProfile } from "@/lib/profile/schema";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useSession } from "@/lib/supabase/use-session";

const isEmpty = (value: object | null | undefined) => !value || Object.keys(value).length === 0;

/**
 * Keeps this device's answers and the signed-in account in step.
 * On sign-in: if this device has nothing saved, pull from the account;
 * otherwise this device's answers win and are pushed. After that, every
 * change is saved to the account (debounced). Renders nothing.
 */
export function CloudSync({ locale }: { locale: Locale }) {
  const session = useSession();
  const userId = session.status === "signed_in" ? session.user.id : null;
  const profile = profileStore.useValue();
  const documents = documentStore.useValue();
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const started = useRef<string | null>(null);

  // 1. Initial pull when a user signs in.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase || !userId || started.current === userId) return;
    started.current = userId;

    Promise.all([
      supabase.from("citizen_profiles").select("answers").eq("user_id", userId).maybeSingle(),
      supabase.from("user_documents").select("statuses").eq("user_id", userId).maybeSingle(),
    ])
      .then(([remoteProfile, remoteDocs]) => {
        const remoteAnswers = parseProfile(remoteProfile.data?.answers);
        if (isEmpty(profileStore.get()) && remoteAnswers && !isEmpty(remoteAnswers)) profileStore.set(remoteAnswers);

        const remoteStatuses = parseDocumentStatuses(remoteDocs.data?.statuses);
        if (isEmpty(documentStore.get()) && remoteStatuses && !isEmpty(remoteStatuses)) {
          documentStore.set(remoteStatuses);
        }
      })
      .catch(() => {
        // Offline or blocked: keep working locally; we'll push on the next change.
      })
      .finally(() => setReadyFor(userId));
  }, [userId]);

  // 2. Remember the preferred language for alert emails.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase || !userId) return;
    void supabase.from("profiles").update({ locale }).eq("id", userId).then(() => undefined);
  }, [userId, locale]);

  // 3. Push changes.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase || !userId || readyFor !== userId || profile === undefined) return;
    const timer = setTimeout(() => {
      void supabase
        .from("citizen_profiles")
        .upsert({ user_id: userId, answers: profile ?? {} })
        .then(() => undefined);
    }, 800);
    return () => clearTimeout(timer);
  }, [profile, userId, readyFor]);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase || !userId || readyFor !== userId || documents === undefined) return;
    const timer = setTimeout(() => {
      void supabase
        .from("user_documents")
        .upsert({ user_id: userId, statuses: documents ?? {} })
        .then(() => undefined);
    }, 800);
    return () => clearTimeout(timer);
  }, [documents, userId, readyFor]);

  return null;
}
