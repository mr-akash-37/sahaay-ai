import type { Locale } from "@/i18n/config";

/** Text in every supported language. */
export type LocalizedText = Record<Locale, string>;

export const occupations = [
  "student",
  "farmer",
  "farm_labourer",
  "business_owner",
  "artisan",
  "unorganised_worker",
  "salaried_private",
  "govt_employee",
  "job_seeker",
  "homemaker",
  "retired",
] as const;
export const genders = ["female", "male", "other"] as const;
export const areaTypes = ["rural", "urban"] as const;
export const educationLevels = ["class_8_10", "puc", "diploma_iti", "ug", "pg", "not_studying"] as const;
export const categories = ["sc", "st", "obc", "general"] as const;
/** Karnataka's own Backward Class list. Asked only of OBC residents of Karnataka. */
export const kaBackwardClasses = ["cat_1", "cat_2a", "cat_3a", "cat_3b"] as const;
/** All 28 states, then the 8 union territories (lower-case codes). */
export const indianStates = [
  "ap", "ar", "as", "br", "cg", "ga", "gj", "hr", "hp", "jh", "ka", "kl", "mp", "mh",
  "mn", "ml", "mz", "nl", "od", "pb", "rj", "sk", "tn", "ts", "tr", "up", "uk", "wb",
  "an", "ch", "dh", "dl", "jk", "la", "ld", "py",
] as const;
export const businessStages = ["new", "existing"] as const;
/** Band edges line up with scheme income limits: ₹1L, 2.5L, 3L, 4.5L, 6L, 9L. */
export const incomeBands = ["upto_1l", "1l_2_5l", "2_5l_3l", "3l_4_5l", "4_5l_6l", "6l_9l", "above_9l"] as const;

export type Occupation = (typeof occupations)[number];
export type Gender = (typeof genders)[number];
export type AreaType = (typeof areaTypes)[number];
export type EducationLevel = (typeof educationLevels)[number];
export type Category = (typeof categories)[number];
export type KaBackwardClass = (typeof kaBackwardClasses)[number];
export type IndianState = (typeof indianStates)[number];
export type BusinessStage = (typeof businessStages)[number];
export type IncomeBand = (typeof incomeBands)[number];

/** "unknown" means the citizen chose "I don't know". It is never treated as "no". */
export type Answer<T> = T | "unknown";

export type CitizenProfile = {
  occupation?: Answer<Occupation>;
  age?: Answer<number>;
  gender?: Answer<Gender>;
  state?: Answer<IndianState>;
  areaType?: Answer<AreaType>;
  category?: Answer<Category>;
  kaBackwardClass?: Answer<KaBackwardClass>;
  incomeBand?: Answer<IncomeBand>;
  // Students
  educationLevel?: Answer<EducationLevel>;
  parentFarmer?: Answer<boolean>;
  class12Above80Percentile?: Answer<boolean>;
  inGovernmentHostel?: Answer<boolean>;
  // Farmers
  ownsFarmland?: Answer<boolean>;
  // Business
  businessStage?: Answer<BusinessStage>;
  // Workers
  ownIncomeUpTo15kMonth?: Answer<boolean>;
  coveredByEpfEsiNps?: Answer<boolean>;
  // Job seekers
  unemployedGraduate?: Answer<boolean>;
  // Women
  womanHeadOfFamily?: Answer<boolean>;
  familyFilesGst?: Answer<boolean>;
  // Household
  familyPaysIncomeTax?: Answer<boolean>;
  selfPaysIncomeTax?: Answer<boolean>;
  familyGovtEmployee?: Answer<boolean>;
  ownsPuccaHouse?: Answer<boolean>;
  bplHousehold?: Answer<boolean>;
  // Parents
  hasDaughterUnder10?: Answer<boolean>;
};

export type ProfileField = keyof CitizenProfile;
export type NumericField = "age";

/** Inclusive rupee range for each income band. */
export const incomeBandRange: Record<IncomeBand, { min: number; max: number }> = {
  upto_1l: { min: 0, max: 100_000 },
  "1l_2_5l": { min: 100_001, max: 250_000 },
  "2_5l_3l": { min: 250_001, max: 300_000 },
  "3l_4_5l": { min: 300_001, max: 450_000 },
  "4_5l_6l": { min: 450_001, max: 600_000 },
  "6l_9l": { min: 600_001, max: 900_000 },
  above_9l: { min: 900_001, max: Number.POSITIVE_INFINITY },
};

/** Maps an exact yearly income (e.g. from free text) to its band. */
export function incomeToBand(rupees: number): IncomeBand {
  for (const band of incomeBands) {
    if (rupees <= incomeBandRange[band].max) return band;
  }
  return "above_9l";
}

/** Eligibility rules are data, so schemes can be added without code changes. */
export type Rule =
  | { kind: "equals"; field: ProfileField; value: string | boolean }
  | { kind: "in"; field: ProfileField; values: readonly string[] }
  | { kind: "between"; field: NumericField; min?: number; max?: number }
  | { kind: "incomeAtMost"; max: number }
  | { kind: "allOf"; rules: readonly Rule[] }
  | { kind: "anyOf"; rules: readonly Rule[] };

export type Criterion = {
  id: string;
  rule: Rule;
  /** Plain-language description of the requirement. */
  label: LocalizedText;
  /** The criterion only counts when this rule holds (otherwise "not applicable"). */
  appliesWhen?: Rule;
  /** Relative importance in the match score. Defaults to 1. */
  weight?: number;
};

export type Outcome = "satisfied" | "not_satisfied" | "unknown" | "not_applicable";

export type CriterionResult = {
  criterion: Criterion;
  outcome: Outcome;
};

export type EligibilityStatus = "eligible" | "likely_eligible" | "not_eligible";

export type Confidence = "high" | "medium" | "low";

export type SchemeEvaluation = {
  status: EligibilityStatus;
  /** 0–100: share of applicable criteria (by weight) that are satisfied. */
  score: number;
  confidence: Confidence;
  results: CriterionResult[];
};
