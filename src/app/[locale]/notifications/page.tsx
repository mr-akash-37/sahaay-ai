import type { Metadata } from "next";
import { NotificationsView } from "@/components/account/notifications-view";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[locale]/notifications">): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).notifications.title };
}

export default async function NotificationsPage({ params }: PageProps<"/[locale]/notifications">) {
  const locale = resolveLocale((await params).locale);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <NotificationsView locale={locale} dict={getDictionary(locale)} />
    </div>
  );
}
