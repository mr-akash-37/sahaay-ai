"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { evaluateScheme } from "@/lib/engine/evaluate";
import { profileStore } from "@/lib/profile/local-store";
import { useSchemes } from "@/lib/schemes/use-schemes";
import { StatusBadge } from "./badges";
import { CriteriaList } from "./criteria-list";
import { MatchMeter } from "./match-meter";

/** The citizen's own result for this scheme, from answers saved on this device. */
export function PersonalResult({ slug, locale, dict }: { slug: string; locale: Locale; dict: Dictionary }) {
  const profile = profileStore.useValue();
  const scheme = useSchemes().find((s) => s.slug === slug);
  const evaluation = useMemo(
    () => (scheme && profile ? evaluateScheme(scheme.criteria, profile) : null),
    [scheme, profile],
  );

  if (!scheme) return null;

  if (profile === undefined) {
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" aria-hidden="true" />;
  }

  if (!evaluation) {
    return (
      <div className="space-y-4">
        <ul className="list-disc space-y-2 pl-5">
          {scheme.criteria.map((criterion) => (
            <li key={criterion.id}>{criterion.label[locale]}</li>
          ))}
        </ul>
        <Link href={`/${locale}/check`} className={buttonVariants()}>
          {dict.scheme.checkMine}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatusBadge status={evaluation.status} dict={dict} />
      {evaluation.status !== "not_eligible" ? <MatchMeter evaluation={evaluation} dict={dict} /> : null}
      <CriteriaList results={evaluation.results} locale={locale} dict={dict} />
      <Link href={`/${locale}/check`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
        <Pencil aria-hidden="true" />
        {dict.results.editAnswers}
      </Link>
    </div>
  );
}
