"use client";

import { CircleCheck, Compass, ExternalLink, FileText, Flag, MapPin, SearchX, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { DocumentDetails } from "@/components/documents/document-info";
import { DocumentStatusPicker } from "@/components/documents/document-status-picker";
import { DeadlineBadge } from "@/components/scheme/deadline-badge";
import { PageSkeleton } from "@/components/state/page-skeleton";
import { StatusMessage } from "@/components/state/status-message";
import { ApplicationStatusPicker } from "@/components/tracker/application-status";
import { checklistText, ShareChecklist } from "./share-checklist";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { documents } from "@/data/documents";
import type { Scheme } from "@/data/schemes";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { documentSteps, findRisks, isActionable, matchSchemes, type Risk } from "@/lib/engine/roadmap";
import type { CitizenProfile } from "@/lib/engine/types";
import { format } from "@/lib/format";
import { documentStore, profileStore } from "@/lib/profile/local-store";
import { useSchemes } from "@/lib/schemes/use-schemes";
import { cn } from "@/lib/utils";

type Props = { locale: Locale; dict: Dictionary };

export function RoadmapView({ locale, dict }: Props) {
  const profile = profileStore.useValue();
  if (profile === undefined) return <PageSkeleton label={dict.common.loading} />;
  if (profile === null || Object.keys(profile).length === 0) {
    return (
      <StatusMessage icon={<Compass />} title={dict.roadmap.emptyTitle} body={dict.roadmap.emptyBody}>
        <Link href={`/${locale}/check`} className={buttonVariants({ size: "lg" })}>
          {dict.results.start}
        </Link>
      </StatusMessage>
    );
  }
  return <Roadmap locale={locale} dict={dict} profile={profile} />;
}

function Roadmap({ locale, dict, profile }: Props & { profile: CitizenProfile }) {
  const statuses = documentStore.useValue() ?? {};
  const schemes = useSchemes();
  const matches = useMemo(() => matchSchemes(schemes, profile).filter(isActionable), [schemes, profile]);
  const steps = documentSteps(matches, statuses);
  const risks = findRisks(matches, statuses);
  const t = dict.roadmap;

  if (matches.length === 0) {
    return (
      <StatusMessage icon={<SearchX />} title={t.noSchemesTitle} body={t.noSchemesBody}>
        <Link href={`/${locale}/check`} className={buttonVariants()}>
          {dict.results.editAnswers}
        </Link>
      </StatusMessage>
    );
  }

  const done = steps.filter((s) => s.status === "have").length;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ShareChecklist text={checklistText(steps, matches, locale, dict)} dict={dict} />
          <Link href={`/${locale}/help`} className={buttonVariants({ variant: "secondary", size: "sm", className: "no-print" })}>
            <MapPin aria-hidden="true" />
            {dict.help.nav}
          </Link>
        </div>

        <ol className="relative mt-8 space-y-8 border-l-2 border-border pl-6 sm:pl-8">
          <TimelineItem icon={<Flag />} active>
            <p className="text-lg font-bold">{t.today}</p>
          </TimelineItem>

          <TimelineItem icon={<FileText />} active={done < steps.length}>
            <h2 className="text-xl font-bold">{t.getDocs}</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground" aria-live="polite">
              {format(t.progress, { done, total: steps.length })}
            </p>
            <ul className="mt-4 space-y-3">
              {steps.map((step) => (
                <li key={step.documentId}>
                  <DocumentDetails doc={documents[step.documentId]} locale={locale} dict={dict}>
                    <p className="text-xs text-muted-foreground">
                      {format(dict.documents.neededFor, { count: step.neededFor.length })}
                    </p>
                  </DocumentDetails>
                  <div className="mt-2">
                    <DocumentStatusPicker documentId={step.documentId} statuses={statuses} dict={dict} />
                  </div>
                </li>
              ))}
            </ul>
          </TimelineItem>

          <TimelineItem icon={<CircleCheck />} active={done === steps.length}>
            <h2 className="text-xl font-bold">{t.apply}</h2>
            <ul className="mt-4 space-y-3">
              {matches.map(({ scheme }) => (
                <li key={scheme.slug} className="rounded-2xl border border-border bg-card p-4">
                  <Link
                    href={`/${locale}/schemes/${scheme.slug}`}
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {format(t.applyFor, { scheme: scheme.name[locale] })}
                  </Link>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <DeadlineBadge deadline={scheme.deadline} dict={dict} />
                    <a
                      href={scheme.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {scheme.portalName[locale]}
                      <ExternalLink aria-hidden="true" className="size-4" />
                      <span className="sr-only">{dict.scheme.opensNewTab}</span>
                    </a>
                  </div>
                  <ApplicationStatusPicker slug={scheme.slug} dict={dict} className="mt-3 no-print" />
                </li>
              ))}
            </ul>
          </TimelineItem>
        </ol>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start" aria-labelledby="risks-title">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 id="risks-title" className="flex items-center gap-2 text-lg font-bold">
            <ShieldAlert aria-hidden="true" className="size-5 text-warning" />
            {t.risksTitle}
          </h2>
          {risks.length === 0 ? (
            <p className="mt-3 font-medium text-success-strong">{t.noRisks}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {risks.map((risk) => (
                <RiskItem key={riskKey(risk)} risk={risk} schemes={schemes} locale={locale} dict={dict} />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function riskKey(risk: Risk) {
  return risk.kind === "document" ? `doc-${risk.documentId}` : `q-${risk.criterion.id}`;
}

const riskTone = { high: "danger", medium: "warning", low: "neutral" } as const;

function RiskItem({
  risk,
  schemes,
  locale,
  dict,
}: {
  risk: Risk;
  schemes: Scheme[];
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.roadmap;
  let title: string;
  let advice: string;

  if (risk.kind === "document") {
    title = documents[risk.documentId].name[locale];
    advice = risk.level === "high" ? t.riskDocMissingSlow : risk.level === "medium" ? t.riskDocApplyingSlow : t.riskDocMissing;
  } else {
    title = risk.criterion.label[locale];
    advice = t.riskUnknown;
  }

  return (
    <li className="rounded-xl bg-muted p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{title}</p>
        <Badge tone={riskTone[risk.level]} className="shrink-0">
          {t[`risk_${risk.level}`]}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{advice}</p>
      {risk.kind === "unknown" ? (
        <Link
          href={`/${locale}/check`}
          className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {dict.results.editAnswers}
        </Link>
      ) : null}
      {risk.kind === "document" && risk.neededFor.length > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {risk.neededFor
            .map((slug) => schemes.find((s) => s.slug === slug)?.name[locale])
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
    </li>
  );
}

function TimelineItem({
  icon,
  active,
  children,
}: {
  icon: ReactNode;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-0 -left-[2.4rem] flex size-8 items-center justify-center rounded-full border-2 bg-background sm:-left-[2.9rem] [&_svg]:size-4",
          active ? "border-primary text-primary" : "border-success bg-success-soft text-success",
        )}
      >
        {icon}
      </span>
      {children}
    </li>
  );
}
