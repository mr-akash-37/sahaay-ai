import type { Dictionary } from "@/i18n/dictionaries";
import {
  areaTypes,
  businessStages,
  categories,
  educationLevels,
  genders,
  incomeBands,
  indianStates,
  kaBackwardClasses,
  occupations,
  type CitizenProfile,
  type ProfileField,
} from "@/lib/engine/types";

export type OptionValue = string | boolean;

export type Question =
  | {
      field: ProfileField;
      type: "choice";
      options: readonly OptionValue[];
      /** Hidden questions are skipped and their old answers dropped. */
      showIf?: (profile: CitizenProfile) => boolean;
    }
  | { field: "age"; type: "number"; min: number; max: number; showIf?: (profile: CitizenProfile) => boolean };

const yesNo = [true, false] as const;
const POST_MATRIC: readonly string[] = ["puc", "diploma_iti", "ug", "pg"];
const WORKERS: readonly string[] = ["unorganised_worker", "farm_labourer", "artisan"];

const is = (p: CitizenProfile, field: ProfileField, ...values: OptionValue[]) =>
  values.includes(p[field] as OptionValue);
const ageBetween = (p: CitizenProfile, min: number, max: number) =>
  typeof p.age !== "number" || (p.age >= min && p.age <= max);

/** Ordered questions. Each group only appears for the people it applies to. */
export const questions: readonly Question[] = [
  { field: "occupation", type: "choice", options: occupations },
  { field: "age", type: "number", min: 0, max: 120 },
  { field: "gender", type: "choice", options: genders },
  { field: "state", type: "choice", options: indianStates },
  { field: "areaType", type: "choice", options: areaTypes },
  { field: "category", type: "choice", options: categories },
  {
    field: "kaBackwardClass",
    type: "choice",
    options: kaBackwardClasses,
    showIf: (p) => is(p, "state", "ka") && is(p, "category", "obc"),
  },
  { field: "incomeBand", type: "choice", options: incomeBands },

  // Students
  { field: "educationLevel", type: "choice", options: educationLevels, showIf: (p) => is(p, "occupation", "student") },
  { field: "parentFarmer", type: "choice", options: yesNo, showIf: (p) => is(p, "occupation", "student") },
  { field: "class12Above80Percentile", type: "choice", options: yesNo, showIf: (p) => is(p, "educationLevel", "ug") },
  {
    field: "inGovernmentHostel",
    type: "choice",
    options: yesNo,
    showIf: (p) => is(p, "occupation", "student") && POST_MATRIC.includes(String(p.educationLevel)),
  },

  // Farmers
  { field: "ownsFarmland", type: "choice", options: yesNo, showIf: (p) => is(p, "occupation", "farmer") },

  // Business
  { field: "businessStage", type: "choice", options: businessStages, showIf: (p) => is(p, "occupation", "business_owner") },

  // Workers (pension for unorganised workers)
  {
    field: "ownIncomeUpTo15kMonth",
    type: "choice",
    options: yesNo,
    showIf: (p) => WORKERS.includes(String(p.occupation)) && ageBetween(p, 18, 40),
  },
  {
    field: "coveredByEpfEsiNps",
    type: "choice",
    options: yesNo,
    // e-Shram covers ages 16–59; the pension scheme 18–40.
    showIf: (p) => WORKERS.includes(String(p.occupation)) && ageBetween(p, 16, 59),
  },

  // Job seekers
  { field: "unemployedGraduate", type: "choice", options: yesNo, showIf: (p) => is(p, "occupation", "job_seeker") },

  // Women
  { field: "womanHeadOfFamily", type: "choice", options: yesNo, showIf: (p) => is(p, "gender", "female") && ageBetween(p, 18, 120) },
  { field: "familyFilesGst", type: "choice", options: yesNo, showIf: (p) => is(p, "womanHeadOfFamily", true) },

  // Household
  { field: "familyPaysIncomeTax", type: "choice", options: yesNo, showIf: (p) => ageBetween(p, 18, 120) },
  {
    field: "selfPaysIncomeTax",
    type: "choice",
    options: yesNo,
    showIf: (p) =>
      is(p, "familyPaysIncomeTax", true, "unknown") &&
      (ageBetween(p, 18, 40) || (WORKERS.includes(String(p.occupation)) && ageBetween(p, 18, 59))),
  },
  {
    field: "familyGovtEmployee",
    type: "choice",
    options: yesNo,
    showIf: (p) => is(p, "occupation", "farmer", "artisan"),
  },
  { field: "ownsPuccaHouse", type: "choice", options: yesNo, showIf: (p) => is(p, "areaType", "urban") },
  // Old-age pension is for BPL families.
  { field: "bplHousehold", type: "choice", options: yesNo, showIf: (p) => typeof p.age === "number" && p.age >= 60 },

  // Parents or legal guardians, of any adult age (savings account for a daughter under 10)
  { field: "hasDaughterUnder10", type: "choice", options: yesNo, showIf: (p) => ageBetween(p, 18, 120) },
];

export function visibleQuestions(profile: CitizenProfile): Question[] {
  return questions.filter((q) => !q.showIf || q.showIf(profile));
}

/** Removes answers to questions that no longer apply (e.g. after changing occupation). */
export function cleanProfile(profile: CitizenProfile): CitizenProfile {
  const visible = new Set(visibleQuestions(profile).map((q) => q.field));
  const cleaned: CitizenProfile = {};
  for (const field of Object.keys(profile) as ProfileField[]) {
    if (visible.has(field)) Object.assign(cleaned, { [field]: profile[field] });
  }
  return cleaned;
}

export function optionLabel(dict: Dictionary, field: ProfileField, value: OptionValue | number | "unknown"): string {
  const w = dict.wizard;
  if (value === "unknown") return w.dontKnow;
  if (typeof value === "boolean") return value ? w.yes : w.no;
  if (typeof value === "number") return String(value);
  const groups: Partial<Record<ProfileField, Record<string, string>>> = {
    occupation: w.occupation,
    gender: w.gender,
    areaType: w.area,
    educationLevel: w.education,
    category: w.category,
    kaBackwardClass: w.kaBackwardClass,
    state: w.states,
    incomeBand: w.income,
    businessStage: w.businessStage,
  };
  return groups[field]?.[value] ?? value;
}

/** Radio inputs carry strings; convert back to the typed answer. */
export function encodeOption(value: OptionValue | number | "unknown"): string {
  return String(value);
}

export function decodeOption(raw: string): OptionValue | "unknown" {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return raw;
}
