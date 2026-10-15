"use client";

import { BellRing, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/lib/format";
import { cleanEmail, sendSignInLink } from "@/lib/supabase/send-link";
import { useSession } from "@/lib/supabase/use-session";

/**
 * Optional email alerts, offered after the citizen sees their schemes.
 * Nothing is sent unless they enter an email AND tick the consent box.
 * Signing in uses a one-time email link — no password.
 */
export function AlertsOptIn({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.alerts;
  const session = useSession();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [problem, setProblem] = useState<string | null>(null);

  // Accounts not set up (guest-only deployment) → nothing to offer.
  if (session.status === "disabled" || session.status === "loading") return null;

  if (session.status === "signed_in") {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-success-soft p-4 font-medium text-success-strong">
        <BellRing aria-hidden="true" className="size-5 shrink-0" />
        {format(t.on, { email: session.user.email ?? "" })}
      </p>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const address = cleanEmail(email);
    if (!address) return setProblem(dict.account.invalidEmail);
    setEmail(address);
    if (!consent) return setProblem(t.consentRequired);
    setProblem(null);
    setState("sending");
    const result = await sendSignInLink(address, locale);
    if (result === "sent") return setState("sent");
    setState("error");
    setProblem(result === "unavailable" ? dict.account.unavailable : result === "rateLimited" ? dict.account.rateLimited : dict.account.error);
  }

  return (
    <section aria-labelledby="alerts-title" className="rounded-2xl border-2 border-primary/30 bg-primary-soft p-5">
      <h2 id="alerts-title" className="flex items-center gap-2 text-lg font-bold text-primary">
        <BellRing aria-hidden="true" className="size-5" />
        {t.title}
      </h2>
      <p className="mt-1 text-sm">{t.body}</p>

      {state === "sent" ? (
        <p role="status" className="mt-4 flex items-start gap-2 font-medium text-success-strong">
          <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {t.sent}
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="mt-4 space-y-3">
          <label htmlFor="alerts-email" className="sr-only">
            {dict.account.emailLabel}
          </label>
          <input
            id="alerts-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={dict.account.emailLabel}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block min-h-12 w-full rounded-xl border-2 border-border bg-card px-4 outline-none focus-visible:border-primary"
          />
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
            />
            <span>{t.consent}</span>
          </label>
          {problem || state === "error" ? (
            <p role="alert" className="font-medium text-danger">
              {problem ?? dict.account.error}
            </p>
          ) : null}
          <Button type="submit" disabled={state === "sending"}>
            <Mail aria-hidden="true" />
            {t.button}
          </Button>
          <p className="text-xs text-muted-foreground">{t.privacy}</p>
        </form>
      )}
    </section>
  );
}
