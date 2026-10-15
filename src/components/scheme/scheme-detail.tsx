import { ExternalLink, Gift, Info, ListOrdered, UserCheck } from "lucide-react";
import type { ReactNode } from "react";
import { DocumentDetails } from "@/components/documents/document-info";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { documents } from "@/data/documents";
import type { Scheme } from "@/data/schemes";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/lib/format";
import { schemeLevelLabel } from "@/lib/schemes/labels";
import { TrustBadge } from "./badges";
import { DeadlineBadge } from "./deadline-badge";
import { ApplicationStatusPicker } from "@/components/tracker/application-status";
import { ReadAloud } from "@/components/voice/read-aloud";
import { PersonalResult } from "./personal-result";
import { ReportIssue } from "./report-issue";

/** Full scheme page body. Used for built-in schemes (server) and database-only schemes (client). */
export function SchemeDetail({ scheme, locale, dict }: { scheme: Scheme; locale: Locale; dict: Dictionary }) {
  const t = dict.scheme;
  const portal = scheme.portalName[locale];

  return (
    <>
      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{schemeLevelLabel(scheme, dict)}</Badge>
          <TrustBadge trust={scheme.trust} lastReviewed={scheme.lastReviewed} locale={locale} dict={dict} showDate />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{scheme.name[locale]}</h1>
        <p className="mt-2 text-muted-foreground">{scheme.department[locale]}</p>
        <p className="mt-4 text-lg">{scheme.summary[locale]}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <DeadlineBadge deadline={scheme.deadline} dict={dict} />
          <ReadAloud
            locale={locale}
            dict={dict}
            text={[
              scheme.name[locale],
              scheme.summary[locale],
              scheme.benefit[locale],
              `${t.eligibility}: ${scheme.criteria.map((c) => c.label[locale]).join(". ")}`,
              `${t.documents}: ${scheme.documents.map((id) => documents[id].name[locale]).join(", ")}`,
            ].join(". ")}
          />
        </div>
        <ApplicationStatusPicker slug={scheme.slug} dict={dict} className="mt-4" />
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Section icon={<Gift />} title={t.benefit}>
            <p>{scheme.benefit[locale]}</p>
          </Section>

          <Section icon={<UserCheck />} title={t.eligibility}>
            <PersonalResult slug={scheme.slug} locale={locale} dict={dict} />
          </Section>

          <section aria-labelledby="docs-title">
            <h2 id="docs-title" className="mb-3 text-xl font-bold">
              {t.documents}
            </h2>
            <div className="space-y-2">
              {scheme.documents.map((id) => (
                <DocumentDetails key={id} doc={documents[id]} locale={locale} dict={dict} />
              ))}
            </div>
          </section>

          <Section icon={<ListOrdered />} title={t.howToApply}>
            <ol className="space-y-3">
              {scheme.howToApply.map((step, i) => (
                <li key={step.en} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step[locale]}</span>
                </li>
              ))}
            </ol>
          </Section>

          {scheme.notes ? (
            <div className="flex gap-3 rounded-2xl bg-warning-soft p-4">
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning-strong" />
              <p>
                <span className="font-semibold">{t.note}: </span>
                {scheme.notes[locale]}
              </p>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="space-y-4 pt-5 sm:pt-6">
              <a
                href={scheme.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "lg", className: "h-auto w-full py-3 text-center whitespace-normal" })}
              >
                {format(t.applyOn, { portal })}
                <ExternalLink aria-hidden="true" />
                <span className="sr-only">{t.opensNewTab}</span>
              </a>
              <p className="text-sm text-muted-foreground">{dict.trust.explain}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.sources}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {scheme.sources.map((src) => (
                  <li key={src.url}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 break-all text-primary underline-offset-4 hover:underline"
                    >
                      {src.label}
                      <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
                      <span className="sr-only">{t.opensNewTab}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <ReportIssue slug={scheme.slug} dict={dict} />
        </aside>
      </div>
    </>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span aria-hidden="true" className="text-primary [&_svg]:size-5">
            {icon}
          </span>
          {title}
        </h2>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
