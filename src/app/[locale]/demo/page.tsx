import { Info } from "lucide-react";
import type { Metadata } from "next";
import { PersonaPicker } from "@/components/demo/persona-picker";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[locale]/demo">): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).demo.title };
}

export default async function DemoPage({ params }: PageProps<"/[locale]/demo">) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight">{dict.demo.title}</h1>
      <p className="mt-2 text-muted-foreground">{dict.demo.body}</p>
      <p className="mt-3 flex items-center gap-2 text-sm font-medium text-warning-strong">
        <Info aria-hidden="true" className="size-4 shrink-0" />
        {dict.demo.fictional}
      </p>
      <div className="mt-8">
        <PersonaPicker locale={locale} dict={dict} />
      </div>
    </div>
  );
}
