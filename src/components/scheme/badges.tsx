import { BadgeCheck, CircleCheck, CircleHelp, CircleX, ShieldAlert, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TrustStatus } from "@/data/schemes";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { EligibilityStatus } from "@/lib/engine/types";
import { format, formatDate } from "@/lib/format";

export function StatusBadge({ status, dict }: { status: EligibilityStatus; dict: Dictionary }) {
  if (status === "eligible") {
    return (
      <Badge tone="success">
        <CircleCheck aria-hidden="true" />
        {dict.results.eligible}
      </Badge>
    );
  }
  if (status === "likely_eligible") {
    return (
      <Badge tone="warning">
        <CircleHelp aria-hidden="true" />
        {dict.results.likely_eligible}
      </Badge>
    );
  }
  return (
    <Badge tone="neutral">
      <CircleX aria-hidden="true" />
      {dict.results.not_eligible}
    </Badge>
  );
}

const trustTone = { verified: "success", partially_verified: "primary", needs_review: "warning" } as const;
const trustIcon = { verified: BadgeCheck, partially_verified: ShieldQuestion, needs_review: ShieldAlert };

export function TrustBadge({
  trust,
  lastReviewed,
  locale,
  dict,
  showDate = false,
}: {
  trust: TrustStatus;
  lastReviewed: string;
  locale: Locale;
  dict: Dictionary;
  showDate?: boolean;
}) {
  const Icon = trustIcon[trust];
  const date = format(dict.trust.lastReviewed, { date: formatDate(lastReviewed, locale) });
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Badge tone={trustTone[trust]} title={dict.trust.explain}>
        <Icon aria-hidden="true" />
        {dict.trust[trust]}
      </Badge>
      {showDate ? <span className="text-sm text-muted-foreground">{date}</span> : null}
    </span>
  );
}
