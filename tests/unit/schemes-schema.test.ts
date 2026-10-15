import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { schemes } from "@/data/schemes";
import { parseScheme, parseSchemes } from "@/lib/schemes/schema";
import { buildSeedSql } from "../../scripts/seed-sql";

describe("scheme validation", () => {
  it("accepts every built-in scheme", () => {
    for (const scheme of schemes) {
      const result = parseScheme(scheme);
      expect(result.ok, result.ok ? scheme.slug : result.errors.join("\n")).toBe(true);
    }
  });

  it("survives a JSON round trip (as stored in the database)", () => {
    const roundTripped = JSON.parse(JSON.stringify(schemes)) as unknown[];
    expect(parseSchemes(roundTripped)).toEqual(schemes);
  });

  it("rejects unsafe or broken records with readable errors", () => {
    const base = JSON.parse(JSON.stringify(schemes[0])) as Record<string, unknown>;

    const httpLink = parseScheme({ ...base, applyUrl: "http://example.com" });
    expect(httpLink.ok).toBe(false);

    const scriptLink = parseScheme({ ...base, applyUrl: "javascript:alert(1)" });
    expect(scriptLink.ok).toBe(false);

    const badRule = parseScheme({ ...base, criteria: [{ id: "x", label: base.name, rule: { kind: "eval", code: "1" } }] });
    expect(badRule.ok).toBe(false);

    const missingKannada = parseScheme({ ...base, name: { en: "A", hi: "B" } });
    expect(missingKannada.ok).toBe(false);
    if (!missingKannada.ok) expect(missingKannada.errors.join(" ")).toContain("name.kn");
  });

  it("skips invalid rows instead of failing the whole list", () => {
    expect(parseSchemes([schemes[0], { slug: "broken" }])).toHaveLength(1);
  });
});

describe("seed.sql", () => {
  it("is up to date with src/data/schemes.ts (run npm run db:seed:generate)", () => {
    const onDisk = readFileSync(new URL("../../supabase/seed.sql", import.meta.url), "utf8");
    expect(onDisk.replaceAll("\r\n", "\n")).toBe(buildSeedSql(schemes));
  });

  it("escapes quotes", () => {
    const tricky = { ...schemes[0], slug: "o-brien", notes: { en: "Rao's note", kn: "x", hi: "y" } };
    expect(buildSeedSql([tricky])).toContain("Rao''s note");
  });
});
