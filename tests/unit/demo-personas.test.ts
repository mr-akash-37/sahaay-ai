import { describe, expect, it } from "vitest";
import { demoPersonas } from "@/data/demo-personas";
import { schemes } from "@/data/schemes";
import { evaluateScheme } from "@/lib/engine/evaluate";
import { nextBestQuestion } from "@/lib/engine/next-question";
import { parseProfile } from "@/lib/profile/schema";
import { cleanProfile } from "@/lib/profile/questions";

describe("demo personas (used on the 'Try an example' page)", () => {
  it.each(demoPersonas.map((p) => [p.id, p] as const))("%s gets exactly the schemes the demo promises", (_, persona) => {
    // The profile must survive validation and cleaning unchanged.
    expect(parseProfile(persona.profile)).toEqual(persona.profile);
    expect(cleanProfile(persona.profile)).toEqual(persona.profile);

    const eligible = schemes.filter((s) => evaluateScheme(s.criteria, persona.profile).status === "eligible").map((s) => s.slug);
    for (const slug of persona.expectEligible) expect(eligible, `${persona.id} → ${slug}`).toContain(slug);
  });

  it("personas are complete enough that the assistant has nothing left to ask", () => {
    for (const persona of demoPersonas) {
      expect(nextBestQuestion(persona.profile, schemes)?.field, persona.id).toBeUndefined();
    }
  });

  it("every persona has text in all three languages", () => {
    for (const p of demoPersonas) {
      for (const locale of ["en", "kn", "hi"] as const) {
        expect(p.name[locale].trim()).not.toBe("");
        expect(p.story[locale].trim()).not.toBe("");
      }
    }
  });
});
