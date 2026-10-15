"use client";

import { z } from "zod";
import type { Locale } from "@/i18n/config";
import { getBrowserSupabase } from "./browser";

export type SendLinkResult = "sent" | "unavailable" | "rateLimited" | "error";

const emailSchema = z.email();

/**
 * Cleans what people commonly type by accident (spaces, a stray \ / , ; . at
 * the end, capitals) and validates it. Returns the clean address or null.
 */
export function cleanEmail(input: string): string | null {
  const cleaned = input.trim().replace(/[\\/,;.\s]+$/, "").toLowerCase();
  const result = emailSchema.safeParse(cleaned);
  return result.success ? result.data : null;
}

type AuthErrorLike = { name?: string; status?: number; message?: string };

/** Classifies a Supabase auth error so the citizen gets a message they can act on. */
export function classifySendLinkError(error: AuthErrorLike | null | undefined): SendLinkResult {
  if (!error) return "sent";
  if (error.status === 429 || /rate limit/i.test(error.message ?? "")) return "rateLimited";
  // No answer from the account service (offline, or the local database isn't running).
  if (error.name === "AuthRetryableFetchError" || error.status === 0 || /fetch|network/i.test(error.message ?? "")) {
    return "unavailable";
  }
  return "error";
}

/** Emails a one-time sign-in link. Never throws. */
export async function sendSignInLink(email: string, locale: Locale): Promise<SendLinkResult> {
  const supabase = getBrowserSupabase();
  if (!supabase) return "unavailable";
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/${locale}/auth/callback` },
    });
    return classifySendLinkError(error);
  } catch {
    return "unavailable";
  }
}
