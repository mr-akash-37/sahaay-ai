"use client";

import { extractProfileFromText, type Extraction } from "@/lib/ai/extract-rules";
import { parseProfile } from "@/lib/profile/schema";

/**
 * Reads a situation description. Uses the server (AI when configured) and
 * falls back to the in-browser reader if the network or server fails, so
 * this never throws.
 */
export async function extractSituation(text: string, aiEnabled: boolean): Promise<Extraction & { source: "ai" | "rules" }> {
  const local = extractProfileFromText(text);
  if (!aiEnabled) return { ...local, source: "rules" };

  try {
    const response = await fetch("/api/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) return { ...local, source: "rules" };
    const body = (await response.json()) as { profile?: unknown; source?: string };
    const profile = parseProfile(body.profile) ?? local.profile;
    return {
      profile,
      fields: Object.keys(profile) as Extraction["fields"],
      source: body.source === "ai" ? "ai" : "rules",
    };
  } catch {
    return { ...local, source: "rules" };
  }
}
