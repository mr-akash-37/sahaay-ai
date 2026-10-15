"use client";

import { LogOut, Mail, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/lib/format";
import { clearAllLocalData } from "@/lib/profile/local-store";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { cleanEmail, sendSignInLink, type SendLinkResult } from "@/lib/supabase/send-link";
import { useIsAdmin, useSession } from "@/lib/supabase/use-session";

export function AccountCard({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.account;
  const session = useSession();
  const isAdmin = useIsAdmin(session);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t.title}</CardTitle>
        {session.status !== "signed_in" ? <p className="text-sm text-muted-foreground">{t.body}</p> : null}
      </CardHeader>
      <CardContent>
        {session.status === "disabled" ? (
          <p className="text-muted-foreground">{t.notConfigured}</p>
        ) : session.status === "loading" ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
        ) : session.status === "signed_out" ? (
          <SignInForm locale={locale} dict={dict} />
        ) : (
          <SignedIn
            email={session.user.email ?? ""}
            userId={session.user.id}
            accessToken={session.accessToken}
            isAdmin={isAdmin === true}
            locale={locale}
            dict={dict}
          />
        )}
      </CardContent>
    </Card>
  );
}

function SignInForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.account;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "invalid" | SendLinkResult>("idle");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const address = cleanEmail(email);
    if (!address) {
      setState("invalid");
      return;
    }
    setEmail(address);
    setState("sending");
    setState(await sendSignInLink(address, locale));
  }

  const problem: Partial<Record<typeof state, string>> = {
    invalid: t.invalidEmail,
    unavailable: t.unavailable,
    rateLimited: t.rateLimited,
    error: t.error,
  };

  if (state === "sent") {
    return (
      <p role="status" className="flex items-start gap-2 font-medium text-success">
        <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        {t.sent}
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <label htmlFor="account-email" className="block font-medium">
        {t.emailLabel}
      </label>
      <input
        id="account-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={state === "invalid"}
        aria-describedby={problem[state] ? "account-email-error" : undefined}
        className="block min-h-12 w-full rounded-xl border-2 border-border bg-background px-4 text-base outline-none focus-visible:border-primary"
      />
      {problem[state] ? (
        <p id="account-email-error" role="alert" className="font-medium text-danger">
          {problem[state]}
        </p>
      ) : null}
      <Button type="submit" disabled={state === "sending"}>
        <Mail aria-hidden="true" />
        {t.sendLink}
      </Button>
    </form>
  );
}

function SignedIn({
  email,
  userId,
  accessToken,
  isAdmin,
  locale,
  dict,
}: {
  email: string;
  userId: string;
  accessToken: string;
  isAdmin: boolean;
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.account;
  const [alerts, setAlerts] = useState<boolean | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let active = true;
    supabase
      .from("profiles")
      .select("email_alerts")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setAlerts(data?.email_alerts ?? true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  async function toggleAlerts(next: boolean) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setAlerts(next);
    const { error } = await supabase.from("profiles").update({ email_alerts: next }).eq("id", userId);
    if (error) {
      setAlerts(!next);
      setMessage({ tone: "error", text: t.error });
    }
  }

  async function signOut() {
    await getBrowserSupabase()?.auth.signOut();
  }

  async function deleteAccount() {
    if (!window.confirm(t.deleteAccountConfirm)) return;
    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => null);
    if (!response?.ok) {
      setMessage({ tone: "error", text: t.error });
      return;
    }
    clearAllLocalData();
    await getBrowserSupabase()?.auth.signOut();
    setMessage({ tone: "ok", text: t.accountDeleted });
  }

  return (
    <div className="space-y-5">
      <p className="font-medium">{format(t.signedInAs, { email })}</p>
      <p className="text-sm text-success">{t.synced}</p>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3">
        <input
          type="checkbox"
          className="size-5 accent-[var(--primary)]"
          checked={alerts ?? true}
          disabled={alerts === null}
          onChange={(e) => toggleAlerts(e.target.checked)}
        />
        <span>{t.alertsLabel}</span>
      </label>

      <div className="flex flex-wrap gap-3">
        {isAdmin ? (
          <Link href={`/${locale}/admin`} className={buttonVariants({ variant: "secondary" })}>
            <ShieldCheck aria-hidden="true" />
            {t.admin}
          </Link>
        ) : null}
        <Button variant="secondary" onClick={signOut}>
          <LogOut aria-hidden="true" />
          {t.signOut}
        </Button>
        <Button variant="ghost" onClick={deleteAccount} className="text-danger">
          <Trash2 aria-hidden="true" />
          {t.deleteAccount}
        </Button>
      </div>

      <p role="status" className={message?.tone === "error" ? "font-medium text-danger" : "font-medium text-success"}>
        {message?.text}
      </p>
    </div>
  );
}
