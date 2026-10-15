"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/lib/format";
import { useNotifications } from "@/lib/notify/use-notifications";
import { useSession } from "@/lib/supabase/use-session";

/** Header bell — only shown to signed-in citizens. */
export function NotificationBell({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const session = useSession();
  const userId = session.status === "signed_in" ? session.user.id : null;
  const { unread } = useNotifications(userId);
  if (!userId) return null;

  const t = dict.notifications;
  const label = unread > 0 ? `${t.bell}, ${format(t.unread, { count: unread })}` : t.bell;

  return (
    <Link
      href={`/${locale}/notifications`}
      aria-label={label}
      className="relative flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Bell aria-hidden="true" className="size-6" />
      {unread > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1.5 flex min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
