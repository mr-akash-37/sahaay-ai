"use client";

import { Bell, BellOff, CalendarClock, RefreshCw, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { StatusMessage } from "@/components/state/status-message";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { AlertKind } from "@/lib/alerts/plan";
import { format, formatDate } from "@/lib/format";
import { useNotifications } from "@/lib/notify/use-notifications";
import { useSchemes } from "@/lib/schemes/use-schemes";
import { useSession } from "@/lib/supabase/use-session";
import { cn } from "@/lib/utils";

const kindIcon: Record<AlertKind, LucideIcon> = {
  new_match: Sparkles,
  scheme_updated: RefreshCw,
  deadline: CalendarClock,
};

export function NotificationsView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.notifications;
  const session = useSession();
  const userId = session.status === "signed_in" ? session.user.id : null;
  const { items, unread, markAllRead } = useNotifications(userId);
  const schemes = useSchemes();

  if (session.status === "loading" || (userId && items === null)) {
    return <div className="h-48 animate-pulse rounded-2xl bg-muted" role="status" aria-label={dict.common.loading} />;
  }

  if (!userId) {
    return (
      <StatusMessage icon={<BellOff />} title={t.title} body={session.status === "disabled" ? dict.account.notConfigured : t.signIn}>
        {session.status !== "disabled" ? (
          <Link href={`/${locale}/settings`} className={buttonVariants()}>
            {dict.account.sendLink}
          </Link>
        ) : null}
      </StatusMessage>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        {unread > 0 ? (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            {t.markAllRead}
          </Button>
        ) : null}
      </div>

      {items && items.length === 0 ? (
        <StatusMessage icon={<Bell />} title={t.title} body={t.empty} className="py-10" />
      ) : (
        <ul className="mt-6 space-y-3">
          {(items ?? []).map((n) => {
            const Icon = kindIcon[n.kind];
            const name = schemes.find((s) => s.slug === n.scheme_slug)?.name[locale] ?? n.scheme_slug;
            return (
              <li
                key={n.id}
                className={cn(
                  "flex gap-4 rounded-2xl border bg-card p-4",
                  n.read_at ? "border-border" : "border-primary/40 bg-primary-soft",
                )}
              >
                <Icon aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{format(t[n.kind], { scheme: name })}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDate(n.created_at.slice(0, 10), locale)}</p>
                  <Link
                    href={`/${locale}/schemes/${n.scheme_slug}`}
                    className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t.view}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
