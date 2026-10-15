import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[locale]/settings">): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).pages.settings };
}

export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const locale = resolveLocale((await params).locale);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <SettingsView locale={locale} dict={getDictionary(locale)} />
    </div>
  );
}
