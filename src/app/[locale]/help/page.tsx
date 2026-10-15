import { Building2, ExternalLink, Landmark, MapPin, Store, Wallet, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[locale]/help">): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).help.title };
}

/** Google Maps search link (documented "Maps URLs" format) — no API key, nothing is invented. */
const mapSearch = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export default async function HelpPage({ params }: PageProps<"/[locale]/help">) {
  const locale = resolveLocale((await params).locale);
  const t = getDictionary(locale).help;

  const centres: { icon: LucideIcon; title: string; body: string; map: string; official?: string }[] = [
    { icon: Store, title: t.csc, body: t.cscBody, map: "Common Service Centre CSC near me", official: "https://csc.gov.in/" },
    { icon: Landmark, title: t.revenueOffice, body: t.revenueOfficeBody, map: "tehsil office near me" },
    { icon: Wallet, title: t.bank, body: t.bankBody, map: "bank branch near me" },
    { icon: Building2, title: t.kaCentres, body: t.kaCentresBody, map: "Grama One Karnataka One centre near me", official: "https://sevasindhu.karnataka.gov.in/" },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-muted-foreground">{t.body}</p>

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {centres.map(({ icon: Icon, title, body, map, official }) => (
          <li key={title}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon aria-hidden="true" className="size-6" />
                </div>
                <CardTitle>{title}</CardTitle>
                <p className="text-muted-foreground">{body}</p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <a href={mapSearch(map)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "sm" })}>
                  <MapPin aria-hidden="true" />
                  {t.mapSearch}
                </a>
                {official ? (
                  <a href={official} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "sm", variant: "secondary" })}>
                    <ExternalLink aria-hidden="true" />
                    {t.official}
                  </a>
                ) : null}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">{t.mapNote}</p>
    </div>
  );
}
