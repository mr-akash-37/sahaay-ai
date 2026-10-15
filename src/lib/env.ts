import { z } from "zod";

/**
 * Server-side environment validation.
 *
 * Every integration is optional so the app always boots. Code that needs an
 * integration calls `requireFeature()`, which fails with a clear message
 * naming the missing variables (never their values).
 */

// Treat blank values in .env files as "not set".
const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.url().optional(),
);

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: optionalUrl,

  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,

  AI_PROVIDER: z.preprocess(
    (value) => (typeof value === "string" && value.trim() !== "" ? value.trim().toLowerCase() : "none"),
    z.enum(["openai", "gemini", "none"]),
  ),
  AI_MODEL: optionalString,
  OPENAI_API_KEY: optionalString,
  GEMINI_API_KEY: optionalString,

  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalString,

  N8N_WEBHOOK_SECRET: optionalString.refine((value) => value === undefined || value.length >= 32, {
    message: "must be at least 32 characters",
  }),
  CRON_SECRET: optionalString,

  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalString,
});

export type ServerEnv = z.infer<typeof envSchema>;

export type Feature = "supabase" | "supabaseAdmin" | "ai" | "email" | "n8nWebhook" | "cron" | "redis";

export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

export function parseEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new EnvError(`Invalid environment variables:\n${problems}\nSee .env.example for the expected format.`);
  }
  return result.data;
}

/** Variables each feature needs. Used for both detection and error messages. */
export function missingForFeature(env: ServerEnv, feature: Feature): string[] {
  const required: Record<Feature, (keyof ServerEnv)[]> = {
    supabase: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    supabaseAdmin: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    ai: [
      "AI_MODEL",
      env.AI_PROVIDER === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY",
    ],
    email: ["RESEND_API_KEY", "EMAIL_FROM"],
    n8nWebhook: ["N8N_WEBHOOK_SECRET"],
    cron: ["CRON_SECRET"],
    redis: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  };

  if (feature === "ai" && env.AI_PROVIDER === "none") return ["AI_PROVIDER"];
  return required[feature].filter((key) => env[key] === undefined);
}

export function isFeatureEnabled(env: ServerEnv, feature: Feature): boolean {
  return missingForFeature(env, feature).length === 0;
}

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cached ??= parseEnv(process.env);
  return cached;
}

export function featureEnabled(feature: Feature): boolean {
  return isFeatureEnabled(getServerEnv(), feature);
}

/** Throws a readable error if a feature is used without its configuration. */
export function requireFeature(feature: Feature): ServerEnv {
  const env = getServerEnv();
  const missing = missingForFeature(env, feature);
  if (missing.length > 0) {
    throw new EnvError(
      `The "${feature}" feature is not configured. Set ${missing.join(", ")} in your .env.local file (see .env.example).`,
    );
  }
  return env;
}
