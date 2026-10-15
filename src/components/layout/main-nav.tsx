"use client";

import { Compass, Home, ListChecks, MessageCircle, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useHydratedPathname } from "@/lib/use-hydrated-pathname";
import { Suspense, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { isActivePath, navItems, type NavKey, type NavLabels } from "./nav-items";

const icons: Record<NavKey, LucideIcon> = {
  home: Home,
  schemes: ListChecks,
  roadmap: Compass,
  assistant: MessageCircle,
  profile: UserRound,
};

type Props = { locale: string; labels: NavLabels };
type ViewProps = Props & { pathname: string };

// The path is runtime data and the layout HTML is shared by every page, so the
// nav first renders with no active item (matching the server) and highlights
// the current page right after hydration.

/** Desktop navigation shown in the header (lg and up). */
export function DesktopNav(props: Props) {
  return (
    <Suspense fallback={<DesktopNavView {...props} pathname="" />}>
      <WithPathname {...props} View={DesktopNavView} />
    </Suspense>
  );
}

/** Thumb-friendly bottom navigation for phones and tablets (below lg). */
export function BottomNav(props: Props) {
  return (
    <Suspense fallback={<BottomNavView {...props} pathname="" />}>
      <WithPathname {...props} View={BottomNavView} />
    </Suspense>
  );
}

function WithPathname({ View, ...props }: Props & { View: (props: ViewProps) => ReactNode }) {
  const pathname = useHydratedPathname("");
  return <View {...props} pathname={pathname} />;
}

function DesktopNavView({ locale, labels, pathname }: ViewProps) {
  return (
    <nav aria-label={labels.label} className="hidden lg:block">
      <ul className="flex items-center gap-1 whitespace-nowrap">
        {navItems.map(({ key, path }) => {
          const active = isActivePath(pathname, locale, path);
          return (
            <li key={key}>
              <Link
                href={`/${locale}${path}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 font-medium transition-colors",
                  active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {labels[key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function BottomNavView({ locale, labels, pathname }: ViewProps) {
  return (
    <nav
      aria-label={labels.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {navItems.map(({ key, path }) => {
          const Icon = icons[key];
          const active = isActivePath(pathname, locale, path);
          return (
            <li key={key}>
              <Link
                href={`/${locale}${path}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon aria-hidden="true" className="size-6" strokeWidth={active ? 2.4 : 1.8} />
                <span className="line-clamp-1 text-center">{labels[key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
