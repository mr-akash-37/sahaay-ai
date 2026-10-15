# Go live — Sahaay AI on Supabase + Vercel (+ Resend)

About 30 minutes. Everything here is free-tier. You create the accounts and paste the
keys yourself — never share keys in chat or commit them.

Folder for every command: `C:\Users\HP\Downloads\sahaay-ai-app`

---

## 1. Supabase (database + sign-in) — 10 min

1. Go to **supabase.com → Sign up → New project**.
   - Name: `sahaay-ai` · Region: **South Asia (Mumbai)** · set a strong database password and save it somewhere safe.
2. Wait until the project is ready (about 2 minutes).
3. **Create the tables and load the 25 schemes:**
   - Open `supabase/production-setup.sql` in this folder (regenerate any time with `npm run db:production-sql`).
   - Supabase → **SQL Editor → New query** → paste the whole file → **Run**. You should see "Success".
4. **Sign-in links:** Supabase → **Authentication → URL Configuration**
   - Site URL: your Vercel address from step 2 (for now `http://localhost:3000`; update it after deploying).
   - Redirect URLs → add: `https://YOUR-APP.vercel.app/**` and `http://localhost:3000/**`
5. **Copy three values** from **Project Settings → API** (you'll paste them into Vercel):
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**secret** — server only)

> Supabase's built-in email sends sign-in links to any address, but only a few per hour.
> That's fine for a demo. For real users, connect Resend as the email sender (step 3).

## 2. Vercel (website hosting) — 10 min

1. Go to **vercel.com → Sign up** (free "Hobby" plan).
2. In a terminal in this folder:

   ```bash
   npx vercel login
   ```
   ```bash
   npx vercel link
   ```
   Answer: set up this project → yes; name → `sahaay-ai`; code directory → `./`; keep the detected Next.js settings.
3. Vercel dashboard → your project → **Settings → Environment Variables**. Add these for **Production**:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase (secret) |
   | `NEXT_PUBLIC_APP_URL` | `https://YOUR-APP.vercel.app` |
   | `CRON_SECRET` | a random secret (see below) |
   | `N8N_WEBHOOK_SECRET` | another random secret (only if you use n8n) |
   | `AI_PROVIDER` | `none` (until Phase 11) |

   Make a random secret (run once per secret):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Deploy:
   ```bash
   npx vercel deploy --prod
   ```
   It prints your address, e.g. `https://sahaay-ai.vercel.app`.
5. Go back to **Supabase → Authentication → URL Configuration** and set **Site URL** to that address.
6. **Check it:** open `https://YOUR-APP.vercel.app/api/health`. You should see
   `"supabase":true,"supabaseAdmin":true,"cron":true`.

The daily alert job runs automatically (`vercel.json` → 02:30 UTC = 8:00 AM IST).

## 3. Resend (email alerts + reliable sign-in emails) — optional, 10 min

Resend can only email **other people** after you verify a domain you own (e.g. `sahaay.in`).
Without a domain it only sends to your own address — enough to test.

1. **resend.com → Sign up → API Keys → Create** (permission: Sending access).
2. *(With a domain)* **Domains → Add domain** → add the DNS records it shows at your domain provider → wait for "Verified".
3. Vercel → Environment Variables → add:
   - `RESEND_API_KEY` = the key
   - `EMAIL_FROM` = `Sahaay AI <alerts@YOUR-DOMAIN>` (testing without a domain: `Sahaay AI <onboarding@resend.dev>`)
4. *(With a domain)* Use Resend for sign-in emails too: Supabase → **Authentication → Emails → SMTP Settings → Enable custom SMTP**
   - Host `smtp.resend.com` · Port `465` · Username `resend` · Password = your Resend API key
   - Sender email = an address on your verified domain
5. Redeploy: `npx vercel deploy --prod`, then check `/api/health` shows `"email":true`.

## 4. Make yourself the admin

1. Open your live site → **Profile** → sign in with your email (open the link from your inbox).
2. Supabase → **SQL Editor** → run (put your email in):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Reload **Profile** — you'll see the admin link (review queue, publish schemes, run alerts).

## 5. Share it

Send the `https://YOUR-APP.vercel.app` link — no ngrok needed. It works on any phone and can be
installed like an app ("Add to Home screen").

### Updating later
After changing code: `npx vercel deploy --prod`. After changing schemes in code: either use the
admin page's **Import new built-in schemes**, or run `npm run db:production-sql` and paste only the
seed part (from `-- ===== seed` down) into the SQL Editor.

### If something doesn't work
- `/api/health` shows `false` for something → that variable is missing in Vercel; add it and redeploy.
- Sign-in link opens the wrong site → fix Site URL / Redirect URLs in Supabase (step 1.4 / 2.5).
- "Too many sign-in links" → Supabase's built-in email limit; wait, or set up Resend SMTP (step 3.4).
