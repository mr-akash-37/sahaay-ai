import { describe, expect, it } from "vitest";
import { EnvError, isFeatureEnabled, missingForFeature, parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("boots with no configuration at all (No-AI, no database)", () => {
    const env = parseEnv({});
    expect(env.AI_PROVIDER).toBe("none");
    expect(isFeatureEnabled(env, "supabase")).toBe(false);
    expect(isFeatureEnabled(env, "ai")).toBe(false);
  });

  it("treats blank values as unset", () => {
    const env = parseEnv({ NEXT_PUBLIC_SUPABASE_URL: "  ", AI_PROVIDER: "" });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(env.AI_PROVIDER).toBe("none");
  });

  it("rejects malformed values with a readable error that names the variable", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SUPABASE_URL: "not a url" })).toThrow(EnvError);
    expect(() => parseEnv({ NEXT_PUBLIC_SUPABASE_URL: "not a url" })).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() => parseEnv({ AI_PROVIDER: "claude-unknown" })).toThrow(/AI_PROVIDER/);
  });

  it("requires a long webhook secret", () => {
    expect(() => parseEnv({ N8N_WEBHOOK_SECRET: "short" })).toThrow(/N8N_WEBHOOK_SECRET/);
    expect(parseEnv({ N8N_WEBHOOK_SECRET: "x".repeat(32) }).N8N_WEBHOOK_SECRET).toHaveLength(32);
  });

  it("never includes secret values in error messages", () => {
    try {
      parseEnv({ N8N_WEBHOOK_SECRET: "super-secret" });
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain("super-secret");
    }
  });
});

describe("feature detection", () => {
  it("enables Supabase when URL and anon key are set", () => {
    const env = parseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://demo.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    });
    expect(isFeatureEnabled(env, "supabase")).toBe(true);
    expect(missingForFeature(env, "supabaseAdmin")).toEqual(["SUPABASE_SERVICE_ROLE_KEY"]);
  });

  it("asks for the key that matches the chosen AI provider", () => {
    const gemini = parseEnv({ AI_PROVIDER: "gemini", AI_MODEL: "some-model" });
    expect(missingForFeature(gemini, "ai")).toEqual(["GEMINI_API_KEY"]);

    const openai = parseEnv({ AI_PROVIDER: "OpenAI", AI_MODEL: "some-model", OPENAI_API_KEY: "k" });
    expect(isFeatureEnabled(openai, "ai")).toBe(true);
  });

  it("reports AI_PROVIDER when AI is switched off", () => {
    expect(missingForFeature(parseEnv({}), "ai")).toEqual(["AI_PROVIDER"]);
  });
});
