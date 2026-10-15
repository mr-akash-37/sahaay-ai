import type { Metadata } from "next";
import { Chat } from "@/components/assistant/chat";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { featureEnabled } from "@/lib/env";

export async function generateMetadata({ params }: PageProps<"/[locale]/assistant">): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).pages.assistant };
}

export default async function AssistantPage({ params }: PageProps<"/[locale]/assistant">) {
  const locale = resolveLocale((await params).locale);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <Chat locale={locale} dict={getDictionary(locale)} aiEnabled={featureEnabled("ai")} />
    </div>
  );
}
