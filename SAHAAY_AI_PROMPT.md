# SAHAAY AI — Master Build Prompt (v2)

> Copy everything below this line into your AI coding tool (Claude Code, Cursor, etc.).

---

You are a senior full-stack team (principal engineer, product designer, AI architect, data engineer, accessibility expert, security engineer). You are building a real product, not a demo. **Working software beats ambitious but broken software.** Build in phases, verify each phase compiles and passes tests before moving on, and never leave a phase with errors.

## 1. PRODUCT

**Name:** Sahaay AI
**Tagline:** "The right scheme. The right guidance. For you."
**One-line pitch:** An AI welfare copilot that understands a citizen in 2 minutes, tells them exactly which government schemes they qualify for, why, what's missing, and what to do next.

**Initial scope:** Karnataka education & scholarship schemes (state + central schemes available to Karnataka residents). The architecture must allow adding more states/categories later without code changes (data-driven).

**Users:** students, parents, rural citizens, elderly and low-tech users, first-time smartphone users.

**Feel:** as simple as WhatsApp, as guided as Duolingo, as clear as Google Maps. Never like a government portal.

### Golden UX rules (apply to every screen)
1. One main action per screen. Big, obvious primary button.
2. Plain language, max ~15 words per sentence. No jargon without a tooltip.
3. Every screen works on a 360px-wide phone, on slow 3G.
4. Every screen has a loading state, an empty state, and a friendly error state with a "Try again" button. No raw error messages, no blank screens, no stack traces shown to users.
5. A user must be able to get their eligibility results **without creating an account** (guest mode). Sign-in is only needed to save progress and get reminders.
6. Every number, deadline, and claim shown to users must link to its official source.

## 2. CORE PRINCIPLE — AI ASSISTS, RULES DECIDE

- **The eligibility decision is made only by a deterministic rule engine** (pure TypeScript, no LLM, 100% unit tested).
- **The LLM is used only to:** (a) extract a structured profile from free text/voice, (b) explain results in simple language / the user's language, (c) answer questions grounded in verified scheme records.
- The LLM must never invent schemes, amounts, deadlines, or eligibility. If the data isn't in the database, it says "I don't have verified information on that" and links to the official portal.
- **The app must fully work with no AI key configured** ("No-AI mode"): the onboarding form, eligibility engine, results, roadmap, and documents all work; only free-text extraction and chat are disabled with a friendly message.

## 3. FEATURES

Priority: **P0** = must ship for MVP, **P1** = ship if P0 is stable, **P2** = stretch (stub UI + clear TODO is acceptable).

### P0 — Core

**3.1 Smart onboarding (guided profile)**
- Step-by-step wizard, one question per screen, progress bar, Back button, auto-saved (localStorage for guests, DB for signed-in users).
- Questions only as needed: state, district, age, gender, category (SC/ST/OBC/General/Minority etc.), annual family income (range picker, not exact), education level & course, institution type, disability status, parent occupation (e.g. farmer), etc. Each question has "I don't know / Prefer not to say" — which maps to `unknown`, never to `false`.
- Alternative: **"Just tell me about yourself"** free-text box (English/Kannada/Hindi/mixed). The AI extracts fields, then shows them in an editable confirmation card: *"Is this correct?"* — the user always confirms before evaluation.

**3.2 Explainable eligibility engine**
- Criteria stored as data (JSON rules), e.g. `{ field: "annual_income", operator: "lte", value: 250000, unit: "INR" }`. Operators: `eq, neq, in, not_in, lt, lte, gt, gte, between, exists, bool`. Support `all_of` / `any_of` groups.
- Each criterion evaluates to exactly one of: **Satisfied · Not satisfied · Unknown · Not applicable**.
- Scheme status: **Eligible** (all satisfied) · **Likely eligible** (none failed, some unknown) · **Not eligible** (any required criterion failed).
- **"What would make me eligible?"** — for not-eligible schemes, show the failing criteria in plain language.

**3.3 Welfare Match Score (honest, explainable)**
- Deterministic formula, documented in code and README: e.g. `score = satisfied_weight / applicable_weight`, with a separate **confidence** level (High / Medium / Low) that drops as `unknown` criteria increase.
- Display: "93% profile match · Medium confidence" + checklist of ✓ satisfied, ⚠ unknown/missing, ✗ not satisfied.
- Label it "profile match", never "chance of approval". Never show 100% unless every criterion is satisfied.

**3.4 Results dashboard**
- Cards sorted: Eligible → Likely eligible → Not eligible (collapsed). Filters: category, deadline, benefit type.
- Each card: scheme name, benefit summary, match score, trust badge, deadline badge, "Next step" button.

**3.5 Scheme detail page**
- Benefits, eligibility breakdown, required documents, how to apply (steps), official links, last verified date, trust badge, "Report incorrect info" button.

**3.6 Welfare journey roadmap**
- Vertical timeline generated from missing documents + application steps + deadline: *Today → Get income certificate → Verify admission proof → Submit on SSP → Deadline in 18 days.*
- User can tick steps as done. "Your next step" is always highlighted at the top of the dashboard.

**3.7 Document assistant**
- For each required document: why it's needed, issuing authority (e.g. Nadakacheri / Tahsildar), where to apply (online link + offline office), typical processing time (labelled "typical, may vary"), fees if known, prerequisites (documents needed to get this document), official source link.
- **My Documents checklist:** user marks "I have it / Applying / Don't have". This feeds the eligibility "unknown" handling and the roadmap. (MVP stores status only — do **not** store document files/Aadhaar numbers.)

**3.8 Deadline protection**
- Badges: **Critical** (≤3 days, red) · **Upcoming** (≤10 days, amber) · **Open** (>10 days, green) · **Closed** · **Date not announced** (grey).
- If a deadline is not verified, store `NULL` and show "Check official portal" — **never guess a date**.

**3.9 Trust score per scheme**
- **Verified** / **Partially verified** / **Needs review**, computed from: last verification date (stale after 90 days), source quality (official .gov.in/.nic.in domain), data completeness, link health.
- Show "Last verified on <date> · Source: <domain>" on every scheme.

**3.10 Multi-language**
- English, ಕನ್ನಡ, हिन्दी via `next-intl`. Language picker on the very first screen and in header. All UI strings in translation files (no hardcoded text). Load Noto Sans Kannada / Noto Sans Devanagari fonts.
- Scheme content: store English as source of truth; AI translations are cached and labelled "Auto-translated".

**3.11 Trust & safety banner (always visible in footer / scheme pages)**
- "Sahaay AI is a guidance tool, not a government service. Final eligibility is decided by the issuing department."
- "Applying for government schemes is free. Never pay anyone or share your OTP."

### P1 — High-value additions

**3.12 Sahaay Assistant (chat)**
- Grounded Q&A (RAG over verified scheme records + the user's own assessment). Every answer cites the scheme/source it used.
- Suggested question chips: "Why am I eligible?", "What document is missing?", "Explain in Kannada", "Which certificate should I get first?", "What happens after applying?".
- Refuses off-topic requests politely. Streams responses.

**3.13 Voice input & read-aloud** (critical for low-literacy users)
- Mic button on onboarding free-text and chat (Web Speech API; hide gracefully if unsupported).
- 🔊 "Read aloud" button on results and scheme pages (SpeechSynthesis, matching selected language).

**3.14 Simple mode**
- Toggle: larger text (18px+ base), simplified explanations ("Explain simply"), fewer elements per screen, high contrast.

**3.15 Risk analysis (blockers)**
- Rule-based: High (required document unavailable + deadline < processing time), Medium (unverified/unknown criteria), Low (pending minor items). Each risk has a concrete recommended action.
- Example: "Income certificate takes ~7 days but deadline is in 5 days → apply today at Nadakacheri."

**3.16 Application tracker**
- Per scheme, user-set status: Not started → Preparing documents → Applied → Under review → Approved / Rejected. Optional application ID field (free text, user-owned).

**3.17 Nearby help centers**
- List + map (Leaflet + OpenStreetMap, no paid API key) of Nadakacheri, Bangalore One / Karnataka One, CSC centers for the user's district (seeded data, with source links). "Get directions" opens Google Maps link.

**3.18 Notifications**
- Email (Resend or Supabase SMTP): deadline reminders (7/3/1 days), new matching scheme found, scheme info changed. User controls in settings; one-click unsubscribe.
- In-app notification bell.

**3.19 Share & print**
- "Share my checklist" (WhatsApp share link / Web Share API) and print-friendly checklist page (users often take a printout to the office).

### P1 — Admin Intelligence Portal (role-protected)
- Overview: total schemes, verification queue, schemes expiring soon, broken links, stale (>90 days) records, untagged criteria, notification stats, "incorrect info" reports.
- **Scheme editor** with visual criteria rule builder (no raw JSON required) + live "test against sample profile".
- **Review workflow:** n8n-discovered changes land as *drafts*; admin sees a diff (old vs new) and Approves / Rejects. Nothing goes live without human approval.
- Version history + audit log for every scheme change.

### P2 — Stretch
- **AI Scheme Discovery via n8n:** scheduled workflows that check official portals/RSS/open data, detect new scheme / deadline change / benefit change / eligibility change, link-health checks, and POST to a signed webhook → creates draft + changelog entry.
- Family profiles (one account manages self + children/parents).
- PWA: installable, offline view of saved checklist & roadmap.
- WhatsApp/SMS reminders (provider-agnostic interface, stubbed).
- Analytics for admins (anonymous, aggregated: most-matched schemes, top missing documents per district).

## 4. TECH STACK (pin exact versions in package.json)
- **Frontend:** Next.js (App Router, latest stable), TypeScript (strict), Tailwind CSS, shadcn/ui, lucide-react, next-intl, react-hook-form + zod.
- **Backend:** Next.js Route Handlers + Server Actions. All inputs validated with zod.
- **DB/Auth:** Supabase (Postgres + Auth: email magic link / OTP; Google optional). Use `@supabase/ssr`.
- **AI:** provider abstraction `lib/ai/provider.ts` supporting OpenAI **or** Gemini via env `AI_PROVIDER` and `AI_MODEL` (no hardcoded model names). Use structured output / JSON schema for extraction, validate with zod, retry once, else fall back to the manual form.
- **Automation:** n8n (workflow JSON templates in `/n8n`).
- **Email:** Resend (or Supabase SMTP) behind `lib/notify/email.ts`.
- **Maps:** Leaflet + OpenStreetMap.
- **Testing:** Vitest (unit), Playwright (E2E + mobile viewport + axe accessibility checks).
- **Deploy:** Vercel + Supabase. Vercel Cron for daily reminder job.

## 5. DESIGN SYSTEM
- Primary `#0F4C81` · Success `#2E7D32` · Warning `#ED8B00` · Danger `#C62828` · Background `#FAFAF7` · Text `#1A1A1A` · Muted `#5F6368`.
- Fonts: Inter + Noto Sans Kannada + Noto Sans Devanagari. Base 16px (18px in Simple mode).
- Rounded-2xl cards, soft shadows, generous spacing, friendly illustrations/icons. Light mode first; dark mode supported via tokens.
- Mobile-first bottom navigation: **Home · My Schemes · Roadmap · Assistant · Profile**. Desktop: sidebar.
- Premium startup SaaS look — investable, calm, trustworthy. All colors meet WCAG AA contrast.

## 6. PAGES
Public: `/` (landing), `/check` (onboarding wizard), `/results`, `/schemes`, `/schemes/[slug]`, `/documents/[slug]`, `/help-centers`, `/about`, `/privacy`, `/terms`.
Authenticated: `/dashboard`, `/roadmap`, `/assistant`, `/my-documents`, `/applications`, `/notifications`, `/settings` (language, simple mode, notifications, export my data, delete my account).
Admin: `/admin`, `/admin/schemes`, `/admin/schemes/[id]`, `/admin/review-queue`, `/admin/reports`, `/admin/sources`, `/admin/audit-log`.
Also: custom `not-found.tsx`, `error.tsx`, `loading.tsx` per route segment.

## 7. DATABASE (Supabase / Postgres)
Write SQL migrations in `supabase/migrations`. Tables (with `created_at`, `updated_at`, sensible FKs, enums, and indexes on all FK + filter columns):

`user_profiles` (1:1 auth.users, role: citizen|admin, language, simple_mode) · `citizen_profiles` (structured eligibility attributes, JSONB + typed core columns) · `schemes` (slug, names per language, department, category, benefit summary, status: draft|published|archived, deadline nullable, trust_status, last_verified_at) · `scheme_criteria` (rule JSON, weight, required, plain-language explanation) · `documents` (master list: issuer, where to apply, typical days, fee, prerequisites, source) · `scheme_documents` (join + mandatory flag) · `scheme_sources` (url, domain, source_type, last_checked_at, http_status) · `scheme_versions` (snapshot JSON + changelog) · `eligibility_assessments` · `assessment_results` (per scheme: status, score, confidence) · `criterion_results` · `user_documents` (status only) · `applications` (tracker) · `roadmap_steps` · `user_notifications` · `notification_preferences` · `help_centers` (lat/lng, district, type, source) · `info_reports` (incorrect-info reports) · `discovery_events` (from n8n) · `audit_log` · `ai_translation_cache`.

**RLS:** enabled on every table. Citizens can read/write only their own rows. Published schemes/documents/help centers are public read. Writes to scheme data only by `admin` role (checked via a `is_admin()` SQL function). Service role used only server-side.

## 8. SEED DATA — HONESTY RULES
- Seed 6–10 real Karnataka education schemes (e.g. SSP Post-Matric Scholarships, Vidyasiri, Fee Concession, Raitha Vidya Nidhi, relevant NSP central schemes) with official source URLs.
- **Only include facts you are confident are accurate.** Anything uncertain → `trust_status = 'needs_review'` and leave the field `NULL`. **Never fabricate deadlines, amounts, or income limits.** Deadlines default to `NULL`.
- Add a clear README note: "Seed data must be verified by an admin before production use."
- Seed a demo admin and 3 demo citizen personas (student SC rural, OBC urban undergrad, farmer's child) for testing/demo. Seed help centers for 2–3 districts.

## 9. SECURITY & PRIVACY
- zod validation on every input (server-side). Rate limiting on AI, auth, and webhook routes (Upstash Redis if configured, in-memory fallback in dev).
- **Prompt-injection protection:** system prompt separated from user content; scheme data passed as quoted context; output validated against schema; the LLM has no tools that write to the DB; never echo secrets.
- n8n webhook: HMAC-SHA256 signature + timestamp (reject > 5 min old) + idempotency key.
- Secrets only in env vars; `.env.example` with every variable documented; app fails fast with a clear message if a required var is missing (validated by zod at startup), and degrades gracefully for optional ones (AI, email, Redis).
- Security headers (CSP, X-Frame-Options, etc.) in `next.config`.
- **Privacy (India DPDP Act aligned):** collect minimum data, explicit consent screen, no Aadhaar/bank numbers stored, "Export my data" and "Delete my account" in settings, don't send personal identifiers to the LLM (send only the attributes needed).

## 10. ACCESSIBILITY (WCAG 2.1 AA)
Semantic HTML, labels on every input, visible focus rings, full keyboard navigation, skip-to-content link, `aria-live` for dynamic results, 44px+ tap targets, never color-only status (always icon + text), `prefers-reduced-motion`, screen-reader tested flows, `lang` attribute set per language.

## 11. QUALITY GATES — BUILD WITHOUT ERRORS
Build in these phases. **At the end of every phase run:**
```
npm run typecheck && npm run lint && npm run test && npm run build
```
**Fix every error and warning before starting the next phase.** Do not move on with failing checks. Do not "mentally" verify — actually run the commands.

| Phase | Deliverable |
|---|---|
| 0 | Scaffold Next.js + TS strict + Tailwind + shadcn + next-intl + env validation + layout/nav. Builds clean. |
| 1 | Supabase migrations, RLS, seed data, generated TypeScript DB types. |
| 2 | Eligibility engine + match score + risk analysis as pure functions in `lib/engine` with ≥95% test coverage (edge cases: unknowns, boundaries, any_of/all_of, missing fields). |
| 3 | Onboarding wizard (guest mode), results, scheme detail, documents pages. |
| 4 | Auth, dashboard, roadmap, my-documents, application tracker, deadline badges. |
| 5 | AI layer: provider abstraction, profile extraction, grounded chat, translations, No-AI fallback. |
| 6 | Notifications (email + in-app), cron job, settings. |
| 7 | Admin portal, rule builder, review queue, audit log. |
| 8 | n8n workflow templates + signed webhook. |
| 9 | Accessibility pass, voice, simple mode, help-center map, PWA, security headers, Playwright E2E (mobile + desktop + axe), README. |

Additional code rules:
- No `any`. No unused imports. No TODOs in P0 code.
- Every server action/route returns typed `{ ok: true, data } | { ok: false, error }` — never throws to the UI.
- React error boundaries on every route segment.
- Keep components small; business logic outside components.

## 12. TESTS
- **Unit:** engine operators, tri-state logic, score/confidence, deadline badge logic, trust score, risk rules.
- **Eligibility scenarios:** each demo persona against each seeded scheme with expected outcomes.
- **API:** validation errors, auth required, RLS isolation (user A cannot read user B), webhook signature rejection, rate limit.
- **AI:** extraction schema validation with mocked provider; prompt-injection test strings don't change behavior.
- **E2E (Playwright):** guest completes onboarding → sees results → opens scheme → views roadmap, at 360px and 1280px, in all 3 languages, with axe showing zero serious violations.

## 13. DELIVERABLES
- Full repository with the folder structure below, all pages/components implemented per priority.
- `supabase/migrations/*.sql`, `supabase/seed.sql`
- `n8n/*.json` workflow templates + setup guide
- `.env.example`, `README.md` (setup in ≤10 steps, architecture diagram, match-score formula, data-verification policy, demo script for judges), `docs/` (architecture, data model, security).

```
sahaay-ai/
├─ src/app/[locale]/(public|citizen|admin)/...
├─ src/components/{ui,scheme,onboarding,roadmap,chat,admin}/
├─ src/lib/{engine,ai,supabase,notify,i18n,validation,security}/
├─ src/messages/{en,kn,hi}.json
├─ supabase/{migrations,seed.sql}
├─ n8n/
├─ tests/{unit,api,e2e}/
└─ docs/
```

## 14. DEFINITION OF DONE
- `npm run build` succeeds with zero errors and zero type errors.
- All tests pass.
- A first-time user on a phone can go from landing page → eligibility results in under 2 minutes, without signing up, in Kannada.
- Every scheme shown has a source link and a trust badge.
- The app runs with no AI key configured.

Start with Phase 0. After each phase, give a short summary: what was built, commands run and their results, and anything I need to configure.
