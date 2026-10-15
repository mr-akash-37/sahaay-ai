"use client";

import { KeyRound, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusMessage } from "@/components/state/status-message";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getBrowserSupabase } from "@/lib/supabase/browser";

/** Finishes magic-link sign-in: exchanges the one-time code for a session. */
export function AuthCallback({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    const code = new URLSearchParams(window.location.search).get("code");
    if (!supabase || !code) {
      queueMicrotask(() => setFailed(true));
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) setFailed(true);
      else router.replace(`/${locale}/settings`);
    });
  }, [locale, router]);

  if (failed) {
    return (
      <StatusMessage icon={<TriangleAlert />} title={dict.errors.title} body={dict.account.callbackFailed}>
        <Link href={`/${locale}/settings`} className={buttonVariants()}>
          {dict.account.sendLink}
        </Link>
      </StatusMessage>
    );
  }
  return <StatusMessage icon={<KeyRound />} title={dict.account.callbackWorking} body={dict.common.loading} />;
}
