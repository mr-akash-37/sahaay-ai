"use client";

import Link from "next/link";
import { useHydratedPathname } from "@/lib/use-hydrated-pathname";
import { Suspense } from "react";
import { LOCALE_COOKIE, localeNames, locales, switchLocalePath, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

type Props = { current: Locale; label: string; className?: string };

/**
 * Links to the same page in each language. Before the pathname is known
 * (prerender), links point to each language's home page.
 */
export function LanguageSwitcher(props: Props) {
  return (
    <Suspense fallback={<LanguageSwitcherView {...props} pathname={`/${props.current}`} />}>
      <LanguageSwitcherLive {...props} />
    </Suspense>
  );
}

function LanguageSwitcherLive(props: Props) {
  const pathname = useHydratedPathname(`/${props.current}`);
  return <LanguageSwitcherView {...props} pathname={pathname} />;
}

function LanguageSwitcherView({ current, label, className, pathname }: Props & { pathname: string }) {
  return (
    <nav aria-label={label} className={cn("flex items-center rounded-xl bg-muted p-1", className)}>
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={switchLocalePath(pathname, locale)}
            hrefLang={locale}
            lang={locale}
            aria-current={active ? "true" : undefined}
            onClick={() => rememberLocale(locale)}
            className={cn(
              "min-h-9 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {localeNames[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
