import { describe, expect, it } from "vitest";
import { schemes } from "@/data/schemes";
import { composeAlertEmail } from "@/lib/alerts/compose";
import { parseDiscoveryPayload } from "@/lib/discovery/payload";

const base = {
  idempotencyKey: "ssp-2026-10-13-abcdef",
  source: "SSP portal monitor",
  sourceUrl: "https://ssp.postmatric.karnataka.gov.in/",
  eventType: "page_changed",
  title: "SSP home page changed",
};

describe("discovery payload", () => {
  it("accepts a minimal event", () => {
    expect(parseDiscoveryPayload(base).ok).toBe(true);
  });

  it("accepts a valid proposed scheme", () => {
    const result = parseDiscoveryPayload({ ...base, eventType: "new_scheme", proposed: schemes[0] });
    expect(result.ok).toBe(true);
  });

  it("rejects non-https sources, unknown event types and invalid proposals", () => {
    expect(parseDiscoveryPayload({ ...base, sourceUrl: "http://example.com" }).ok).toBe(false);
    expect(parseDiscoveryPayload({ ...base, eventType: "delete_everything" }).ok).toBe(false);
    const bad = parseDiscoveryPayload({ ...base, proposed: { slug: "x" } });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors[0]).toMatch(/^proposed\./);
  });

  it("rejects missing or tiny idempotency keys", () => {
    expect(parseDiscoveryPayload({ ...base, idempotencyKey: "x" }).ok).toBe(false);
  });
});

describe("alert email", () => {
  it("is written in the citizen's language with links back to the scheme", () => {
    const email = composeAlertEmail("kn", "https://sahaay.example/", [
      { kind: "new_match", schemeSlug: "raitha-vidya-nidhi", schemeName: "ಮುಖ್ಯಮಂತ್ರಿ ರೈತ ವಿದ್ಯಾ ನಿಧಿ" },
    ]);
    expect(email.subject).toContain("1");
    expect(email.text).toContain("ಮುಖ್ಯಮಂತ್ರಿ ರೈತ ವಿದ್ಯಾ ನಿಧಿ");
    expect(email.text).toContain("https://sahaay.example/kn/schemes/raitha-vidya-nidhi");
    expect(email.text).toContain("OTP");
  });

  it("falls back to English for unknown locales", () => {
    const email = composeAlertEmail("xx", "https://a.b", [{ kind: "deadline", schemeSlug: "s", schemeName: "S" }]);
    expect(email.text).toContain("Deadline coming soon: S");
  });
});
