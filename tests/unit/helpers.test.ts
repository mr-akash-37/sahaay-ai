import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n/dictionaries";
import { deadlineState } from "@/lib/engine/deadline";
import { indianStates } from "@/lib/engine/types";
import { format, formatDate } from "@/lib/format";
import { cleanProfile, decodeOption, optionLabel, visibleQuestions } from "@/lib/profile/questions";
import { parseDocumentStatuses, parseProfile } from "@/lib/profile/schema";

describe("deadlineState", () => {
  const today = new Date(2026, 9, 13); // 13 Oct 2026, local time

  it("never guesses a missing deadline", () => {
    expect(deadlineState(null, today)).toEqual({ kind: "unknown" });
    expect(deadlineState("not-a-date", today)).toEqual({ kind: "unknown" });
  });

  it.each([
    ["2026-10-12", { kind: "closed" }],
    ["2026-10-13", { kind: "critical", days: 0 }],
    ["2026-10-16", { kind: "critical", days: 3 }],
    ["2026-10-17", { kind: "upcoming", days: 4 }],
    ["2026-10-23", { kind: "upcoming", days: 10 }],
    ["2026-10-24", { kind: "open", days: 11 }],
  ])("%s", (deadline, expected) => {
    expect(deadlineState(deadline, today)).toEqual(expected);
  });
});

describe("format", () => {
  it("fills placeholders and leaves unknown ones", () => {
    expect(format("{a} of {b}", { a: 1, b: 7 })).toBe("1 of 7");
    expect(format("{a} {missing}", { a: "x" })).toBe("x {missing}");
  });

  it("formats dates the same way regardless of time zone", () => {
    expect(formatDate("2026-10-13", "en")).toBe("13 Oct 2026");
    expect(formatDate("bad", "en")).toBe("bad");
  });
});

describe("questions", () => {
  it("asks the percentile question only for degree students", () => {
    const fields = (p: Parameters<typeof visibleQuestions>[0]) => visibleQuestions(p).map((q) => q.field);
    expect(fields({ educationLevel: "ug" })).toContain("class12Above80Percentile");
    expect(fields({ educationLevel: "puc" })).not.toContain("class12Above80Percentile");
    expect(fields({ educationLevel: "not_studying" })).not.toContain("inGovernmentHostel");
  });

  it("drops answers to questions that no longer apply", () => {
    const cleaned = cleanProfile({ occupation: "student", educationLevel: "puc", class12Above80Percentile: true, category: "sc" });
    expect(cleaned).toEqual({ occupation: "student", educationLevel: "puc", category: "sc" });
    // Changing occupation drops the student-only answers.
    expect(cleanProfile({ occupation: "farmer", educationLevel: "puc", ownsFarmland: true })).toEqual({
      occupation: "farmer",
      ownsFarmland: true,
    });
  });

  it("labels options in every language", () => {
    for (const locale of ["en", "kn", "hi"]) {
      const dict = getDictionary(locale);
      expect(optionLabel(dict, "category", "obc")).not.toBe("obc");
      expect(optionLabel(dict, "kaBackwardClass", "cat_2a")).not.toBe("cat_2a");
      expect(optionLabel(dict, "incomeBand", "upto_1l")).not.toBe("upto_1l");
      expect(optionLabel(dict, "state", "unknown")).toBe(dict.wizard.dontKnow);
      for (const state of indianStates) expect(optionLabel(dict, "state", state)).not.toBe(state);
    }
  });

  it("decodes radio values", () => {
    expect(decodeOption("true")).toBe(true);
    expect(decodeOption("false")).toBe(false);
    expect(decodeOption("ug")).toBe("ug");
  });
});

describe("profiles saved by the Karnataka-only version", () => {
  it("move to the state answer and the new category list", () => {
    expect(parseProfile({ karnatakaResident: true, category: "obc_2a" })).toEqual({
      state: "ka",
      category: "obc",
      kaBackwardClass: "cat_2a",
    });
    // "Not Karnataka" never said which state, so we ask again.
    expect(parseProfile({ karnatakaResident: false })).toEqual({ state: "unknown" });
    expect(parseProfile({ state: "br", karnatakaResident: true })).toEqual({ state: "br" });
  });

  it("asks the Karnataka category question only to OBC residents of Karnataka", () => {
    const asks = (p: Parameters<typeof visibleQuestions>[0]) => visibleQuestions(p).some((q) => q.field === "kaBackwardClass");
    expect(asks({ state: "ka", category: "obc" })).toBe(true);
    expect(asks({ state: "up", category: "obc" })).toBe(false);
    expect(asks({ state: "ka", category: "sc" })).toBe(false);
  });
});

describe("saved data validation", () => {
  it("accepts valid profiles and rejects tampered ones", () => {
    expect(parseProfile({ category: "sc", incomeBand: "unknown" })).toEqual({ category: "sc", incomeBand: "unknown" });
    // Each field is checked on its own: bad values are dropped, good ones kept.
    expect(parseProfile({ category: "<script>", age: 30 })).toEqual({ age: 30 });
    expect(parseProfile({ age: 999, hacker: true })).toEqual({});
    expect(parseProfile("nope")).toBeNull();
    expect(parseProfile([1, 2])).toBeNull();
  });

  it("upgrades old saved profiles", () => {
    // Saved before the occupation question existed → treated as a student.
    expect(parseProfile({ educationLevel: "ug" })).toEqual({ educationLevel: "ug", occupation: "student" });
    // Old income ranges that no longer exist are dropped, not misread.
    expect(parseProfile({ incomeBand: "4_5l_8l" })).toEqual({});
  });

  it("validates document statuses", () => {
    expect(parseDocumentStatuses({ aadhaar: "have" })).toEqual({ aadhaar: "have" });
    expect(parseDocumentStatuses({ aadhaar: "stolen" })).toBeNull();
  });
});
