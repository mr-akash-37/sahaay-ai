import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { format } from "@/lib/format";
import type { AlertKind } from "./plan";

export type EmailAlert = { kind: AlertKind; schemeSlug: string; schemeName: string };

/** One plain-text email per citizen, in their language, listing all their new alerts. */
export function composeAlertEmail(locale: string, appUrl: string, alerts: readonly EmailAlert[]) {
  const lang = resolveLocale(locale);
  const t = getDictionary(lang).notifications;
  const base = appUrl.replace(/\/+$/, "");

  const lines = alerts.map(
    (a) => `• ${format(t[a.kind], { scheme: a.schemeName })}\n  ${base}/${lang}/schemes/${a.schemeSlug}`,
  );

  return {
    subject: format(t.emailSubject, { count: alerts.length }),
    text: [t.emailIntro, "", ...lines, "", "—", t.emailFooter, `${base}/${lang}/settings`].join("\n"),
  };
}
