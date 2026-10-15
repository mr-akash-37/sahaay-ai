import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { signPayload, verifySignature } from "@/lib/security/signature";

describe("webhook signature", () => {
  const secret = "s".repeat(40);
  const body = JSON.stringify({ hello: "world" });
  const now = 1_800_000_000;
  const ts = String(now);
  const good = signPayload(secret, ts, body);

  it("accepts a valid signature", () => {
    expect(verifySignature(secret, body, ts, good, now)).toEqual({ ok: true });
  });

  it("rejects missing headers", () => {
    expect(verifySignature(secret, body, null, good, now)).toEqual({ ok: false, reason: "missing" });
    expect(verifySignature(secret, body, ts, null, now)).toEqual({ ok: false, reason: "missing" });
  });

  it("rejects replayed (old) and future requests", () => {
    expect(verifySignature(secret, body, ts, good, now + 301)).toEqual({ ok: false, reason: "stale" });
    expect(verifySignature(secret, body, ts, good, now - 301)).toEqual({ ok: false, reason: "stale" });
    expect(verifySignature(secret, body, "abc", good, now)).toEqual({ ok: false, reason: "stale" });
  });

  it("rejects a tampered body, wrong secret or garbage signature", () => {
    expect(verifySignature(secret, body + " ", ts, good, now).ok).toBe(false);
    expect(verifySignature("x".repeat(40), body, ts, good, now).ok).toBe(false);
    expect(verifySignature(secret, body, ts, "not-hex!", now).ok).toBe(false);
    expect(verifySignature(secret, body, ts, good.slice(0, 10), now).ok).toBe(false);
  });
});

describe("rate limiter", () => {
  it("allows up to the limit, then blocks until the window resets", () => {
    const check = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(check("a", 0).allowed).toBe(true);
    expect(check("a", 10).allowed).toBe(true);
    const blocked = check("a", 20);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);
    expect(check("b", 20).allowed).toBe(true);
    expect(check("a", 1001).allowed).toBe(true);
  });
});
