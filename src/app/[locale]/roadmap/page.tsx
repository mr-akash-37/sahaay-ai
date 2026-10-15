import type { Metadata } from "next";
import { RoadmapView } from "@/components/roadmap/roadmap-view";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[locale]/roadmap">): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).pages.roadmap };
}

export default async function RoadmapPage({ params }: PageProps<"/[locale]/roadmap">) {
  const locale = resolveLocale((await params).locale);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <RoadmapView locale={locale} dict={getDictionary(locale)} />
    </div>
  );
}
