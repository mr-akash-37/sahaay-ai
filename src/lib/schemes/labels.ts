import type { Scheme } from "@/data/schemes";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/lib/format";

/** "Central government scheme", "Karnataka government scheme", or a generic state label. */
export function schemeLevelLabel(scheme: Pick<Scheme, "level" | "state">, dict: Dictionary): string {
  if (scheme.level === "central") return dict.scheme.central;
  return scheme.state ? format(dict.scheme.state, { state: dict.wizard.states[scheme.state] }) : dict.scheme.stateGeneric;
}
