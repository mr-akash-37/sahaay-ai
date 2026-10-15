import "server-only";
import { featureEnabled, requireFeature } from "@/lib/env";

export type EmailMessage = { to: string; subject: string; text: string };

/** Sends via Resend's HTTP API. Returns false (never throws) so one failure doesn't stop a batch. */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  if (!featureEnabled("email")) return false;
  const env = requireFeature("email");
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [message.to], subject: message.subject, text: message.text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) console.error("email send failed", response.status);
    return response.ok;
  } catch {
    console.error("email send failed (network)");
    return false;
  }
}
