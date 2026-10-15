import { z } from "zod";
import { documentIds } from "@/data/documents";
import type { DocumentStatuses } from "@/lib/engine/roadmap";
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

const answer = <T extends z.ZodType>(schema: T) => z.union([schema, z.literal("unknown")]);
const yesNo = answer(z.boolean());

/** One validator per field. Kept as a map so each field is checked on its own. */
const fieldSchemas = {
  occupation: answer(z.enum(occupations)),
  age: answer(z.number().int().min(0).max(120)),
  gender: answer(z.enum(genders)),
  state: answer(z.enum(indianStates)),
  areaType: answer(z.enum(areaTypes)),
  category: answer(z.enum(categories)),
  kaBackwardClass: answer(z.enum(kaBackwardClasses)),
  incomeBand: answer(z.enum(incomeBands)),
  educationLevel: answer(z.enum(educationLevels)),
  parentFarmer: yesNo,
  class12Above80Percentile: yesNo,
  inGovernmentHostel: yesNo,
  ownsFarmland: yesNo,
  businessStage: answer(z.enum(businessStages)),
  ownIncomeUpTo15kMonth: yesNo,
  coveredByEpfEsiNps: yesNo,
  unemployedGraduate: yesNo,
  womanHeadOfFamily: yesNo,
  familyFilesGst: yesNo,
  familyPaysIncomeTax: yesNo,
  selfPaysIncomeTax: yesNo,
  familyGovtEmployee: yesNo,
  ownsPuccaHouse: yesNo,
  bplHousehold: yesNo,
  hasDaughterUnder10: yesNo,
} satisfies Record<ProfileField, z.ZodType>;

export const profileFields = Object.keys(fieldSchemas) as [ProfileField, ...ProfileField[]];

/**
 * Lenient parser for saved or AI-extracted answers: every field is validated
 * on its own and invalid ones are dropped (never the whole profile). Returns
 * null only when the input is not an object at all.
 */
export function parseProfile(value: unknown): CitizenProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = migrateLegacy(value as Record<string, unknown>);
  const profile: CitizenProfile = {};

  for (const field of profileFields) {
    if (!(field in input)) continue;
    const result = fieldSchemas[field].safeParse(input[field]);
    if (result.success) Object.assign(profile, { [field]: result.data });
  }

  // Profiles saved before the occupation question existed were all students.
  if (profile.occupation === undefined && typeof profile.educationLevel === "string" && profile.educationLevel !== "not_studying") {
    profile.occupation = "student";
  }
  return profile;
}

const LEGACY_KA_CLASSES: Record<string, string> = { obc_1: "cat_1", obc_2a: "cat_2a", obc_3a: "cat_3a", obc_3b: "cat_3b" };

/** Profiles saved when Sahaay covered only Karnataka used a yes/no residence answer and Karnataka-only categories. */
function migrateLegacy(input: Record<string, unknown>): Record<string, unknown> {
  const out = { ...input };
  if (!("state" in out) && "karnatakaResident" in out) {
    // "No" only said "not Karnataka", so the state is still unknown.
    out.state = out.karnatakaResident === true ? "ka" : "unknown";
  }
  delete out.karnatakaResident;
  const legacyClass = typeof out.category === "string" ? LEGACY_KA_CLASSES[out.category] : undefined;
  if (legacyClass) {
    out.category = "obc";
    out.kaBackwardClass ??= legacyClass;
  }
  return out;
}

export const documentStatusesSchema = z.partialRecord(
  z.enum(documentIds),
  z.enum(["have", "applying", "missing"]),
) satisfies z.ZodType<DocumentStatuses>;

export function parseDocumentStatuses(value: unknown): DocumentStatuses | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  // Drop unknown documents (e.g. removed in a later version) instead of failing.
  const known = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([key]) => (documentIds as readonly string[]).includes(key)),
  );
  const result = documentStatusesSchema.safeParse(known);
  return result.success ? result.data : null;
}
