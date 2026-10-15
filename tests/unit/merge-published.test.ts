import { describe, expect, it } from "vitest";
import { getScheme, schemes } from "@/data/schemes";
import { mergePublished } from "@/lib/schemes/schema";

describe("mergePublished", () => {
  it("uses valid database records as they are", () => {
    const edited = { ...getScheme("pm-kisan")!, lastReviewed: "2026-10-20" };
    expect(mergePublished([edited], schemes)[0].lastReviewed).toBe("2026-10-20");
  });

  it("falls back to the built-in record when a stored one uses old fields", () => {
    const old = JSON.parse(JSON.stringify(getScheme("gruha-lakshmi")!));
    old.criteria[0].rule = { kind: "equals", field: "karnatakaResident", value: true };
    const [merged] = mergePublished([old], schemes);
    expect(merged).toBe(getScheme("gruha-lakshmi"));
  });

  it("drops invalid records that have no built-in version", () => {
    expect(mergePublished([{ slug: "made-up", criteria: "nope" }, null], schemes)).toEqual([]);
  });
});
