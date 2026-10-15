import { Info, ShieldAlert } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/** Trust & safety notice and useful links, shown on every page. */
export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = [
    { href: `/${locale}/schemes`, label: dict.scheme.allSchemes },
    { href: `/${locale}/demo`, label: dict.demo.nav },
    { href: `/${locale}/help`, label: dict.help.nav },
    { href: `/${locale}/assistant`, label: dict.pages.assistant },
    { href: `/${locale}/settings`, label: dict.pages.settings },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-2">
        <h2 className="sr-only">{dict.safety.title}</h2>
        <p className="flex gap-3 text-sm text-muted-foreground">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          {dict.safety.disclaimer}
        </p>
        <p className="flex gap-3 text-sm font-medium text-foreground">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
          {dict.safety.noPayment}
        </p>
      </div>
      <nav aria-label={dict.common.appName} className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="font-medium text-primary underline-offset-4 hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="pt-4 pb-24 text-center text-xs text-muted-foreground lg:pb-6">
        {dict.common.appName} · {dict.common.tagline}
      </p>
    </footer>
  );
}
