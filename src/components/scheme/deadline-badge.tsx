"use client";

import { CalendarClock } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/i18n/dictionaries";
import { deadlineState } from "@/lib/engine/deadline";
import { format } from "@/lib/format";

const noopSubscribe = () => () => {};
const todayKey = () => new Date().toDateString();

/** Today's date, only on the client — the server never renders a time-dependent value. */
function useToday(): Date | null {
  const key = useSyncExternalStore(noopSubscribe, todayKey, () => null);
  return key ? new Date(key) : null;
}

const tone = { critical: "danger", upcoming: "warning", open: "success", closed: "neutral", unknown: "neutral" } as const;

export function DeadlineBadge({ deadline, dict }: { deadline: string | null; dict: Dictionary }) {
  const today = useToday();

  if (!deadline || !today) {
    return (
      <Badge tone="neutral">
        <CalendarClock aria-hidden="true" />
        {deadline ?? dict.deadline.unknown}
      </Badge>
    );
  }

  const state = deadlineState(deadline, today);
  const text =
    state.kind === "unknown"
      ? dict.deadline.unknown
      : state.kind === "closed"
        ? dict.deadline.closed
        : format(dict.deadline[state.kind], { days: state.days });

  return (
    <Badge tone={tone[state.kind]}>
      <CalendarClock aria-hidden="true" />
      {text}
    </Badge>
  );
}
