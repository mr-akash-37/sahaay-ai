import type { Locale } from "@/i18n/config";

/** Replaces {name} placeholders. Unknown placeholders are left as-is. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

const intlLocale: Record<Locale, string> = { en: "en-IN", kn: "kn-IN", hi: "hi-IN" };

/** Formats an ISO date (YYYY-MM-DD) as a readable date. Uses UTC so server and browser agree. */
export function formatDate(isoDate: string, locale: Locale): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
