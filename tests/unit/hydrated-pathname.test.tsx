import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/en/results" }));

const { useHydratedPathname } = await import("@/lib/use-hydrated-pathname");

function Probe() {
  return createElement("span", null, useHydratedPathname("fallback"));
}

describe("useHydratedPathname", () => {
  it("renders the fallback on the server, so the shared layout HTML matches the first client render", () => {
    // The layout HTML is shared by every page; reading the real path here caused hydration mismatches.
    expect(renderToString(createElement(Probe))).toBe("<span>fallback</span>");
  });
});
