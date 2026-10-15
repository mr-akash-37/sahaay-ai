"use client";

import { ClipboardList, Compass, ExternalLink, Info, Pencil, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { AlertsOptIn } from "@/components/account/alerts-opt-in";
import { PageSkeleton } from "@/components/state/page-skeleton";
import { StatusMessage } from "@/components/state/status-message";
import { buttonVariants } from "@/components/ui/button";
import { documents } from "@/data/documents";
import type { Scheme } from "@/data/schemes";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { documentSteps, isActionable, matchSchemes } from "@/lib/engine/roadmap";
import type { CitizenProfile } from "@/lib/engine/types";
import { format } from "@/lib/format";
import { documentStore, profileStore } from "@/lib/profile/local-store";
import { useSchemes } from "@/lib/schemes/use-schemes";
import { SchemeResultCard } from "./scheme-result-card";

type Props = { locale: Locale; dict: Dictionary };

const MYSCHEME_SEARCH = "https://www.myscheme.gov.in/search";

export function ResultsView({ locale, dict }: Props) {
  const profile = profileStore.useValue();
  if (profile === undefined) return <PageSkeleton label={dict.common.loading} />;
  if (profile === null || Object.keys(profile).length === 0) {
    return (
      <StatusMessage icon={<ClipboardList />} title={dict.results.emptyTitle} body={dict.results.emptyBody}>
        <Link href={`/${locale}/check`} className={buttonVariants({ size: "lg" })}>
          {dict.results.start}
        </Link>
      </StatusMessage>
    );
  }
  return <Results locale={locale} dict={dict} profile={profile} />;
}

function Results({ locale, dict, profile }: Props & { profile: CitizenProfile }) {
  const statuses = documentStore.useValue() ?? {};
  const schemes = useSchemes();
  const matches = useMemo(() => matchSchemes(schemes, profile), [schemes, profile]);
  const eligible = matches.filter((m) => m.evaluation.status === "eligible");
  const likely = matches.filter((m) => m.evaluation.status === "likely_eligible");
  const notEligible = matches.filter((m) => m.evaluation.status === "not_eligible");
  const nextDocument = documentSteps(matches, statuses).find((s) => s.status !== "have");
  const t = dict.results;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.subtitle}</p>
          <p className="mt-2 font-semibold" aria-live="polite">
            {format(t.summary, { eligible: eligible.length, likely: likely.length })}
          </p>
        </div>
        <Link href={`/${locale}/check`} className={buttonVariants({ variant: "secondary" })}>
          <Pencil aria-hidden="true" />
          {t.editAnswers}
        </Link>
      </header>

      {matches.some(isActionable) && nextDocument ? (
        <Link
          href={`/${locale}/roadmap`}
          className="flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
        >
          <Compass aria-hidden="true" className="size-8 shrink-0" />
          <span className="flex-1">
            <span className="block text-sm opacity-90">{t.nextStep}</span>
            <span className="block text-lg font-semibold">{documents[nextDocument.documentId].name[locale]}</span>
          </span>
          <span className="hidden text-sm font-medium underline sm:inline">{t.roadmapCta}</span>
        </Link>
      ) : null}

      <StateCoverageNote profile={profile} schemes={schemes} dict={dict} />

      {eligible.length + likely.length === 0 ? (
        <StatusMessage icon={<SearchX />} title={t.noneTitle} body={t.noneBody} className="py-8 sm:py-10" />
      ) : null}

      <ResultGroup title={t.groupEligible} matches={eligible} locale={locale} dict={dict} />
      <ResultGroup title={t.groupLikely} matches={likely} locale={locale} dict={dict} />

      <AlertsOptIn locale={locale} dict={dict} />

      {notEligible.length > 0 ? (
        <details className="group rounded-2xl border border-border bg-card p-5">
          <summary className="cursor-pointer text-lg font-semibold">
            {format(t.showNotEligible, { count: notEligible.length })}
          </summary>
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {notEligible.map((m) => (
              <li key={m.scheme.slug}>
                <SchemeResultCard match={m} locale={locale} dict={dict} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

/** Honest coverage note when Sahaay has no state schemes yet for the citizen's state. */
function StateCoverageNote({ profile, schemes, dict }: { profile: CitizenProfile; schemes: Scheme[]; dict: Dictionary }) {
  const state = profile.state;
  if (!state || state === "unknown" || schemes.some((s) => s.state === state)) return null;
  const name = dict.wizard.states[state];
  return (
    <aside className="flex gap-3 rounded-2xl border border-border bg-card p-5">
      <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
      <div>
        <p>{format(dict.results.stateNote, { state: name })}</p>
        <a
          href={MYSCHEME_SEARCH}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          {format(dict.results.stateNoteLink, { state: name })}
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      </div>
    </aside>
  );
}

function ResultGroup({
  title,
  matches,
  locale,
  dict,
}: {
  title: string;
  matches: ReturnType<typeof matchSchemes>;
  locale: Locale;
  dict: Dictionary;
}) {
  if (matches.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="mb-4 text-xl font-bold">
        {title} <span className="text-muted-foreground">({matches.length})</span>
      </h2>
      <ul className="grid gap-4 md:grid-cols-2">
        {matches.map((m) => (
          <li key={m.scheme.slug}>
            <SchemeResultCard match={m} locale={locale} dict={dict} />
          </li>
        ))}
      </ul>
    </section>
  );
}
