import { CircleCheck, CircleHelp, CircleMinus, CircleX } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CriterionResult, Outcome } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

const icon: Record<Outcome, typeof CircleCheck> = {
  satisfied: CircleCheck,
  not_satisfied: CircleX,
  unknown: CircleHelp,
  not_applicable: CircleMinus,
};

const color: Record<Outcome, string> = {
  satisfied: "text-success",
  not_satisfied: "text-danger",
  unknown: "text-warning",
  not_applicable: "text-muted-foreground",
};

/** Explains every rule's outcome with an icon AND text (never colour alone). */
export function CriteriaList({
  results,
  locale,
  dict,
  hideNotApplicable = false,
}: {
  results: CriterionResult[];
  locale: Locale;
  dict: Dictionary;
  hideNotApplicable?: boolean;
}) {
  const shown = hideNotApplicable ? results.filter((r) => r.outcome !== "not_applicable") : results;
  return (
    <ul className="space-y-2">
      {shown.map(({ criterion, outcome }) => {
        const Icon = icon[outcome];
        return (
          <li key={criterion.id} className="flex items-start gap-2">
            <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", color[outcome])} />
            <span className={cn(outcome === "not_applicable" && "text-muted-foreground")}>
              <span className="sr-only">{dict.results[outcome]}: </span>
              {criterion.label[locale]}
              {outcome !== "satisfied" ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "ml-2 text-sm font-medium",
                    outcome === "unknown" ? "text-warning-strong" : color[outcome],
                  )}
                >
                  · {dict.results[outcome]}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
