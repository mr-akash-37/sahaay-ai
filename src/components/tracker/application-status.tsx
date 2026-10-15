"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import { applicationStatuses, type ApplicationStatus } from "@/lib/profile/applications";
import { applicationStore } from "@/lib/profile/local-store";
import { cn } from "@/lib/utils";

const tone: Record<ApplicationStatus, string> = {
  not_started: "border-border",
  preparing: "border-warning bg-warning-soft",
  applied: "border-primary bg-primary-soft",
  under_review: "border-primary bg-primary-soft",
  approved: "border-success bg-success-soft",
  rejected: "border-danger bg-danger-soft",
};

/** "Where is my application?" — saved on this device. */
export function ApplicationStatusPicker({ slug, dict, className }: { slug: string; dict: Dictionary; className?: string }) {
  const statuses = applicationStore.useValue();
  const current: ApplicationStatus = statuses?.[slug] ?? "not_started";
  const id = `status-${slug}`;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {dict.tracker.label}
      </label>
      <select
        id={id}
        value={current}
        disabled={statuses === undefined}
        onChange={(e) =>
          applicationStore.set({ ...(applicationStore.get() ?? {}), [slug]: e.target.value as ApplicationStatus })
        }
        className={cn("min-h-10 rounded-xl border-2 bg-card px-3 text-sm font-semibold outline-none focus-visible:border-primary", tone[current])}
      >
        {applicationStatuses.map((status) => (
          <option key={status} value={status}>
            {dict.tracker[status]}
          </option>
        ))}
      </select>
    </div>
  );
}
