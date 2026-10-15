import type { Metadata } from "next";
import { Wizard } from "@/components/onboarding/wizard";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { featureEnabled } from "@/lib/env";

export async function generateMetadata({ params }: PageProps<"/[locale]/check">): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).pages.check };
}

export default async function CheckPage({ params }: PageProps<"/[locale]/check">) {
  const locale = resolveLocale((await params).locale);
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <Wizard locale={locale} dict={getDictionary(locale)} aiEnabled={featureEnabled("ai")} />
    </div>
  );
}
