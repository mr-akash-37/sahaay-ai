import type { Dictionary } from "@/i18n/dictionaries";
import type { SchemeEvaluation } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

/** Honest match score: percentage of rules met, plus how sure we are. */
export function MatchMeter({ evaluation, dict }: { evaluation: SchemeEvaluation; dict: Dictionary }) {
  const { score, confidence, status } = evaluation;
  const confidenceText = dict.results[`confidence_${confidence}`];
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p>
          <span className={cn("text-3xl font-bold", status === "eligible" ? "text-success" : "text-warning-strong")}>
            {score}%
          </span>{" "}
          <span className="text-sm text-muted-foreground">{dict.results.match}</span>
        </p>
        <p className="text-sm text-muted-foreground">{confidenceText}</p>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label={`${score}% ${dict.results.match}, ${confidenceText}`}
        className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full", status === "eligible" ? "bg-success" : "bg-warning")}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
