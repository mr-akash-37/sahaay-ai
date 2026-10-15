import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TrustBadge } from "@/components/scheme/badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { schemes } from "@/data/schemes";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { schemeLevelLabel } from "@/lib/schemes/labels";

export async function generateMetadata({ params }: PageProps<"/[locale]/schemes">): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).scheme.allSchemes };
}

export default async function SchemesPage({ params }: PageProps<"/[locale]/schemes">) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const t = dict.scheme;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight">{t.allSchemes}</h1>
      <p className="mt-1 text-muted-foreground">{t.allSchemesSubtitle}</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {schemes.map((scheme) => (
          <li key={scheme.slug}>
            <Link href={`/${locale}/schemes/${scheme.slug}`} className="group block h-full rounded-2xl">
              <Card className="h-full transition-colors group-hover:border-primary/50">
                <CardHeader>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="primary">{schemeLevelLabel(scheme, dict)}</Badge>
                    <TrustBadge trust={scheme.trust} lastReviewed={scheme.lastReviewed} locale={locale} dict={dict} />
                  </div>
                  <CardTitle className="mt-2 flex items-start justify-between gap-3 text-xl">
                    {scheme.name[locale]}
                    <ArrowRight aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
                  </CardTitle>
                  <CardDescription>{scheme.summary[locale]}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
