import type { Dictionary } from "@/i18n/dictionaries";
import type { CitizenProfile, ProfileField } from "@/lib/engine/types";
import { optionLabel } from "@/lib/profile/questions";

/** Short, readable summary of extracted answers, e.g. "What do you do? — Farmer". */
export function ProfileChips({ profile, dict }: { profile: CitizenProfile; dict: Dictionary }) {
  const fields = Object.keys(profile) as ProfileField[];
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {fields.map((field) => {
        const value = profile[field];
        if (value === undefined) return null;
        return (
          <div key={field} className="rounded-xl border border-border bg-background px-3 py-2">
            <dt className="text-xs text-muted-foreground">{dict.wizard.q[field].title}</dt>
            <dd className="font-semibold">{optionLabel(dict, field, value)}</dd>
          </div>
        );
      })}
    </dl>
  );
}
