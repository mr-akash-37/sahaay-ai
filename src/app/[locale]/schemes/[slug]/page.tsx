import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RemoteSchemeDetail } from "@/components/scheme/remote-scheme-detail";
import { SchemeDetail } from "@/components/scheme/scheme-detail";
import { getScheme, schemes } from "@/data/schemes";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return schemes.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/schemes/[slug]">): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const scheme = getScheme(slug);
  if (!scheme) return {};
  const locale = resolveLocale(raw);
  return { title: scheme.name[locale], description: scheme.summary[locale] };
}

export default function SchemePage({ params }: PageProps<"/[locale]/schemes/[slug]">) {
  // The slug is URL data: keep it inside Suspense so navigation stays instant.
  return (
    <Suspense fallback={<div className="mx-auto mt-10 h-96 w-full max-w-4xl animate-pulse rounded-2xl bg-muted" />}>
      <SchemePageBody params={params} />
    </Suspense>
  );
}

async function SchemePageBody({ params }: Pick<PageProps<"/[locale]/schemes/[slug]">, "params">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const dict = getDictionary(locale);
  const scheme = getScheme(slug);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={`/${locale}/results`}
        className="inline-flex items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {dict.scheme.back}
      </Link>
      {scheme ? (
        <SchemeDetail scheme={scheme} locale={locale} dict={dict} />
      ) : (
        // Published later by an admin: load it from the database.
        <RemoteSchemeDetail slug={slug} locale={locale} dict={dict} />
      )}
    </div>
  );
}
