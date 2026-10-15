# Sahaay AI

**The right scheme. The right guidance. For you.**

An AI welfare copilot that helps citizens find the government schemes they qualify for, explains why, and shows exactly what to do next. It works for people in every Indian state and union territory: all central schemes are checked for everyone, and state schemes (Karnataka first) are checked only for residents of that state. Available in English, ಕನ್ನಡ and हिन्दी.

To add another state's schemes, give each record `level: "state"`, `state: "<code>"` (codes in `src/lib/engine/types.ts`) and a criterion `{ kind: "equals", field: "state", value: "<code>" }`. The unit tests check that every state scheme does this.

> Sahaay AI is a guidance tool, not a government service. The final decision on eligibility is made by the department that runs each scheme.

## Quick start (guest mode, no setup)

Requirements: Node.js 22.18 or newer (tested on Node 24).

```bash
npm install
npm run dev
```

Open http://localhost:3000. **No configuration is needed.** Answers are saved in the browser, and the built-in scheme list is used.

## Turn on accounts, the scheme database and alerts (Supabase)

### Option A: local database (needs Docker Desktop running)

```bash
npm run db:start
```

This starts Supabase in Docker, creates all tables and loads the six schemes from `supabase/seed.sql`. Copy the printed **API URL**, **anon key** and **service_role key** into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

Restart `npm run dev`. Sign-in emails are not really sent locally. Open **Mailpit** at http://127.0.0.1:54324 to click the magic link.

### Option B: Supabase cloud (free tier)

1. Create a project at https://supabase.com.
2. Link it and push the schema and seed data:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push --include-seed
   ```
3. In the dashboard, go to **Authentication → URL Configuration**. Set the Site URL to your app URL and add `https://<your-domain>/**` to the redirect URLs.
4. Copy the URL, anon key and service_role key (Project Settings → API) into `.env.local` and into Vercel's environment variables.

### Make yourself an admin

Sign in once through the app (Profile → "Send me a sign-in link"). Then run this in the Supabase SQL editor, or locally with `npx supabase db query` / Studio at http://127.0.0.1:54323:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

An "Admin portal" button then appears on your Profile page (`/en/admin`).

## How new schemes and alerts flow

```
Official pages ──(n8n, daily)──▶ signed webhook ──▶ Review queue (pending)
                                                        │  admin checks the official source,
                                                        ▼  edits the record, publishes
                     schemes + version history ──▶ alert job (daily cron or "Send alerts now")
                                                        │  same eligibility engine as the app
                                                        ▼
                         🔔 in-app notification + 📧 email (citizens who can now apply)
```

- **Nothing goes live automatically.** n8n only creates pending review items (`n8n/README.md`).
- **Alerts** go to signed-in citizens who can apply to a newly published or changed scheme, plus reminders 7, 3 and 1 days before a verified deadline. Each alert is sent once (deduplicated).
- **Email** needs `RESEND_API_KEY` and `EMAIL_FROM`. Without them, alerts still show in the bell.
- **Daily job:** `vercel.json` runs `/api/alerts/run` every day at 02:30 UTC (8:00 IST). Set `CRON_SECRET` in Vercel.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm run start` | Production build / run it |
| `npm run typecheck` | Generate route types and run the TypeScript compiler |
| `npm run lint` | ESLint (fails on any warning) |
| `npm run test` | Unit tests (Vitest) |
| `npm run check` | **Quality gate:** typecheck, lint, test and build |
| `npm run db:start` / `db:stop` | Start or stop local Supabase (Docker) |
| `npm run db:reset` | Recreate the local database from migrations and seed |
| `npm run db:seed:generate` | Rebuild `supabase/seed.sql` from `src/data/schemes.ts` (a test fails if you forget) |

## Tech stack

- **Next.js 16** (App Router, Cache Components, Turbopack), **React 19**, **TypeScript** (strict)
- **Tailwind CSS 4** with shadcn-style components
- **Supabase**: Postgres, Auth (email magic link), Row Level Security
- **zod**: validates every input, including saved answers, scheme records, webhook payloads and env vars
- **n8n** for discovery, **Resend** for email, **Vercel Cron** for the daily alert job
- Built-in Next.js dictionaries for i18n, with a locale redirect in `src/proxy.ts`

## Project structure

```
src/
├─ app/
│  ├─ [locale]/                 # every page lives under /en, /kn or /hi
│  │  ├─ page.tsx               # landing
│  │  ├─ check/                 # step-by-step eligibility questions
│  │  ├─ results/               # My Schemes
│  │  ├─ schemes/[slug]/        # scheme details (built-in or from the database)
│  │  ├─ roadmap/               # steps, document checklist, risks
│  │  ├─ notifications/         # alerts inbox
│  │  ├─ settings/              # language, account, saved data
│  │  ├─ admin/                 # review queue, scheme editor, alerts, audit log
│  │  └─ auth/callback/         # finishes magic-link sign-in
│  └─ api/
│     ├─ webhooks/discovery/    # n8n → review queue (HMAC signed)
│     ├─ alerts/run/            # alert job (cron or admin)
│     └─ account/               # delete my account
├─ data/                        # built-in schemes and documents (seed source)
├─ lib/
│  ├─ engine/                   # eligibility engine, roadmap, risks, deadlines
│  ├─ alerts/                   # who to alert (pure) + job runner
│  ├─ schemes/                  # scheme validation, useSchemes()
│  ├─ supabase/                 # browser + server clients, session hooks
│  ├─ security/                 # webhook signatures, rate limiting
│  └─ profile/                  # questions, local storage
└─ messages/                    # en.json, kn.json, hi.json
supabase/migrations/            # schema, RLS, admin functions
supabase/seed.sql               # generated from src/data/schemes.ts
n8n/                            # workflow templates + setup guide
tests/unit/                     # Vitest
```

## Key principles

1. **AI assists, rules decide.** Eligibility comes from a deterministic, unit-tested rule engine, and the same engine decides who gets alerts.
2. **Works without setup.** No database means guest mode; no email key means in-app alerts only.
3. **Never fabricate.** Unverified deadlines and amounts are not stored. Users are sent to the official portal.
4. **Humans approve changes.** Automation only proposes changes, and every publish is versioned and logged in the audit log.

## How eligibility works

- Each scheme's rules are **data**, e.g. `{ kind: "incomeAtMost", max: 250000 }`, combined with `allOf` / `anyOf`.
- Every rule evaluates to **Meets / Doesn't meet / Not sure yet / Doesn't apply**. "I don't know" is never treated as "no".
- **Status:** Eligible (all met) · Likely eligible (none failed, some unknown) · Not eligible (any failed).
- **Match score** = weight met ÷ applicable weight, rounded down, so it shows 100% only when everything is met. **Confidence** drops as more answers are unknown.

## Scheme data policy

Six schemes are included: Post-Matric (SC, ST, Backward Classes), Vidyasiri, CM Raitha Vidya Nidhi and the Central Sector Scholarship. Only rules confirmed across public sources are stored. **Benefit amounts and deadlines are not stored**, because sources disagree and they change yearly. Every scheme stays **Partially verified** until an admin checks the current official notification.

## Security and privacy

- **Row Level Security** on every table: citizens read and write only their own rows, and only admins can publish schemes (via `SECURITY DEFINER` functions that check `is_admin()`). Citizens cannot change their own role.
- **Signed webhooks** use HMAC-SHA256 with a 5-minute replay window and idempotency keys. Payloads are size-limited and zod-validated.
- **Rate limits** apply to the webhook, the alert job and account deletion.
- The **service role key** is used only in server routes, after checking the caller.
- **Privacy:** guests' data never leaves the browser. Signed-in users can turn email alerts off and **delete their account** (all rows cascade).
- **Security headers:** CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` and HSTS.

## Translations

All UI text is in `src/messages/*.json`, with English as the source of truth. A missing Kannada or Hindi key is a TypeScript error. Kannada and Hindi should be reviewed by native speakers before launch. The admin portal is English-only.

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Scaffold, design system, i18n, layout, env validation, security headers | ✅ |
| 1 | Supabase schema, RLS, migrations, seed | ✅ |
| 2 | Eligibility engine, match score, risk analysis | ✅ |
| 3 | Question form (guest mode), results, scheme and document pages | ✅ |
| 4 | Roadmap, document checklist, accounts and sync | ✅ (application tracker ⏳) |
| 5 | AI layer: "describe in my words", guided assistant (floating "Ask Sahaay" on every page) — works without a key, uses OpenAI/Gemini when `AI_PROVIDER` is set | ✅ |
| 6 | In-app and email alerts, deadline reminders, daily cron | ✅ |
| 7 | Admin portal: review queue, scheme editor, audit log | ✅ (visual rule builder ⏳) |
| 8 | n8n official-page monitor and signed webhook | ✅ |
| 9 | Voice input, read-aloud, simple mode, application tracker, report wrong info, share/print checklist, help centres, installable app (PWA) | ✅ (browser E2E tests ⏳) |

**Schemes:** 21 built-in (6 education + 15 for farmers, workers, business owners, women, youth, seniors and housing). After adding schemes to `src/data`, run `npm run db:seed:generate`; on an existing cloud database use **Admin → Schemes → Import new built-in schemes**.

**Database update:** run `npx supabase db push` to apply `supabase/migrations/20261014000000_citizen_reports.sql` (enables "Report wrong information").
