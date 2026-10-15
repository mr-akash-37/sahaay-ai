import { createHmac, timingSafeEqual } from "node:crypto";

export const SIGNATURE_HEADER = "x-sahaay-signature";
export const TIMESTAMP_HEADER = "x-sahaay-timestamp";
const MAX_AGE_SECONDS = 5 * 60;

/** HMAC-SHA256 of `${timestamp}.${body}` as lowercase hex. */
export function signPayload(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export type SignatureCheck = { ok: true } | { ok: false; reason: "missing" | "stale" | "invalid" };

/**
 * Verifies a webhook signature. Rejects missing headers, timestamps older or
 * newer than 5 minutes (replay protection) and mismatched signatures, using a
 * constant-time comparison.
 */
export function verifySignature(
  secret: string,
  body: string,
  timestamp: string | null,
  signature: string | null,
  nowSeconds = Math.floor(Date.now() / 1000),
): SignatureCheck {
  if (!timestamp || !signature) return { ok: false, reason: "missing" };

  const ts = Number(timestamp);
  if (!Number.isInteger(ts) || Math.abs(nowSeconds - ts) > MAX_AGE_SECONDS) return { ok: false, reason: "stale" };

  const expected = Buffer.from(signPayload(secret, timestamp, body), "hex");
  const received = /^[0-9a-f]+$/i.test(signature) ? Buffer.from(signature, "hex") : Buffer.alloc(0);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true };
}
