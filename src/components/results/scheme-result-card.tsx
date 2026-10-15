import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { StatusBadge, TrustBadge } from "@/components/scheme/badges";
import { CriteriaList } from "@/components/scheme/criteria-list";
import { DeadlineBadge } from "@/components/scheme/deadline-badge";
import { MatchMeter } from "@/components/scheme/match-meter";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { SchemeMatch } from "@/lib/engine/roadmap";
import { cn } from "@/lib/utils";

export function SchemeResultCard({
  match: { scheme, evaluation },
  locale,
  dict,
}: {
  match: SchemeMatch;
  locale: Locale;
  dict: Dictionary;
}) {
  const notEligible = evaluation.status === "not_eligible";
  const failed = evaluation.results.filter((r) => r.outcome === "not_satisfied");

  return (
    <Card className={cn("flex h-full flex-col", notEligible && "opacity-90")}>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={evaluation.status} dict={dict} />
          <TrustBadge trust={scheme.trust} lastReviewed={scheme.lastReviewed} locale={locale} dict={dict} />
        </div>
        <CardTitle className="text-xl">{scheme.name[locale]}</CardTitle>
        <p className="text-sm text-muted-foreground">{scheme.department[locale]}</p>
        {!notEligible ? <MatchMeter evaluation={evaluation} dict={dict} /> : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {notEligible ? (
          <div>
            <p className="mb-2 font-semibold">{dict.results.whyNot}</p>
            <CriteriaList results={failed} locale={locale} dict={dict} />
          </div>
        ) : (
          <CriteriaList results={evaluation.results} locale={locale} dict={dict} hideNotApplicable />
        )}
        <div className="mt-auto flex flex-col gap-3 pt-2">
          <DeadlineBadge deadline={scheme.deadline} dict={dict} />
          <Link
            href={`/${locale}/schemes/${scheme.slug}`}
            className={buttonVariants({ variant: notEligible ? "secondary" : "primary" })}
          >
            {dict.results.details}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
