import Link from "next/link";
import { NotificationBell } from "@/components/account/notification-bell";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { LanguageSwitcher } from "./language-switcher";
import { LogoMark } from "./logo";
import { DesktopNav } from "./main-nav";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href={`/${locale}`} aria-label={dict.common.appName} className="flex items-center gap-2 rounded-lg">
          <LogoMark />
          <span className="hidden text-lg font-bold tracking-tight whitespace-nowrap min-[400px]:inline">
            {dict.common.appName}
          </span>
        </Link>
        <DesktopNav locale={locale} labels={dict.nav} />
        <div className="flex items-center gap-1">
          <NotificationBell locale={locale} dict={dict} />
          <LanguageSwitcher current={locale} label={dict.common.language} />
        </div>
      </div>
    </header>
  );
}
