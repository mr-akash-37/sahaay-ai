import type { Scheme } from "../src/data/schemes.ts";

/** Escapes a value for a single-quoted SQL string literal. */
function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

/**
 * Builds supabase/seed.sql from the scheme data in src/data/schemes.ts, so
 * the database and the app always start from the same verified records.
 * Seeded versions are marked as already notified (no alerts for seed data).
 */
export function buildSeedSql(schemes: readonly Scheme[]): string {
  const lines = [
    "-- GENERATED FILE — do not edit by hand.",
    "-- Source: src/data/schemes.ts. Regenerate with: npm run db:seed:generate",
    "",
  ];

  for (const scheme of schemes) {
    const json = sqlString(JSON.stringify(scheme));
    const deadline = scheme.deadline ? sqlString(scheme.deadline) : "null";
    lines.push(
      `with s as (`,
      `  insert into public.schemes (slug, status, trust, deadline, last_reviewed, data, published_at)`,
      `  values (${sqlString(scheme.slug)}, 'published', ${sqlString(scheme.trust)}, ${deadline}, ${sqlString(scheme.lastReviewed)}, ${json}::jsonb, now())`,
      `  on conflict (slug) do update set data = excluded.data, trust = excluded.trust, deadline = excluded.deadline, last_reviewed = excluded.last_reviewed`,
      `  returning id`,
      `)`,
      `insert into public.scheme_versions (scheme_id, data, change_summary, notified_at)`,
      `select id, ${json}::jsonb, 'Initial seed', now() from s;`,
      "",
    );
  }

  return lines.join("\n");
}
