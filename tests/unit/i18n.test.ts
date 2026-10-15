import { describe, expect, it } from "vitest";
import { hasLocale, matchLocale, resolveLocale, switchLocalePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import kn from "@/messages/kn.json";

type Messages = Record<string, unknown>;

function flatten(messages: Messages, prefix = ""): Record<string, unknown> {
  return Object.entries(messages).reduce<Record<string, unknown>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") Object.assign(acc, flatten(value as Messages, path));
    else acc[path] = value;
    return acc;
  }, {});
}

describe("translations", () => {
  const english = flatten(en);

  it.each([
    ["kn", kn],
    ["hi", hi],
  ])("%s has exactly the same keys as English", (_, messages) => {
    expect(Object.keys(flatten(messages)).sort()).toEqual(Object.keys(english).sort());
  });

  it.each([
    ["en", en],
    ["kn", kn],
    ["hi", hi],
  ])("%s has no empty strings", (_, messages) => {
    for (const [key, value] of Object.entries(flatten(messages))) {
      expect(typeof value, key).toBe("string");
      expect((value as string).trim(), key).not.toBe("");
    }
  });

  it("falls back to English for unknown locales", () => {
    expect(getDictionary("fr")).toBe(getDictionary("en"));
  });
});

describe("hasLocale / resolveLocale", () => {
  it("accepts supported locales only", () => {
    expect(hasLocale("kn")).toBe(true);
    expect(hasLocale("KN")).toBe(false);
    expect(hasLocale("ta")).toBe(false);
    expect(hasLocale(undefined)).toBe(false);
  });

  it("resolves unsupported values to English", () => {
    expect(resolveLocale("hi")).toBe("hi");
    expect(resolveLocale("xx")).toBe("en");
    expect(resolveLocale(null)).toBe("en");
  });
});

describe("matchLocale", () => {
  it("returns English when no header is sent", () => {
    expect(matchLocale(null)).toBe("en");
    expect(matchLocale("")).toBe("en");
  });

  it("matches on the primary language subtag", () => {
    expect(matchLocale("kn-IN,kn;q=0.9,en;q=0.8")).toBe("kn");
    expect(matchLocale("hi-IN")).toBe("hi");
  });

  it("respects quality values", () => {
    expect(matchLocale("en;q=0.5,hi;q=0.9")).toBe("hi");
  });

  it("skips unsupported languages and q=0", () => {
    expect(matchLocale("ta-IN,kn;q=0.7")).toBe("kn");
    expect(matchLocale("kn;q=0,fr")).toBe("en");
  });
});

describe("switchLocalePath", () => {
  it("replaces an existing locale prefix", () => {
    expect(switchLocalePath("/en/results", "kn")).toBe("/kn/results");
    expect(switchLocalePath("/hi", "en")).toBe("/en");
  });

  it("adds a prefix when none exists", () => {
    expect(switchLocalePath("/", "hi")).toBe("/hi");
    expect(switchLocalePath("/results", "kn")).toBe("/kn/results");
  });
});
