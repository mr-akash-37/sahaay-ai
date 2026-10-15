# Showing the code to judges (VS Code + live changes)

## 1. Before the judges arrive (10 minutes)

1. **Open the project in VS Code**
   File → **Open Folder…** → `C:\Users\HP\Downloads\sahaay-ai-app` → **Select Folder**.
   (Open the folder, not the zip.) If asked "Do you trust the authors?", click **Yes**.
2. **Turn on Auto Save:** File → **Auto Save** (tick). Changes then show in the browser as you type.
3. **Make text big for the room:** press `Ctrl` + `=` two or three times.
4. **Start the database** (only needed to show sign-in and alerts): open **Docker Desktop**, wait for "Engine running", then in the VS Code terminal (`Ctrl` + `` ` ``):
   ```bash
   npx supabase start
   ```
5. **Start the app** in the same terminal:
   ```bash
   npm run dev
   ```
   Wait for **Ready**, then open **http://localhost:3000/en** in Chrome.
6. Arrange the screen: **VS Code on the left, Chrome on the right** (Windows key + ← / →).
7. Keep these Chrome tabs open:
   - http://localhost:3000/en — the app
   - http://127.0.0.1:54324 — local email inbox (sign-in links arrive here)

> Safety net: the clean copy `Downloads\sahaay-ai-app.zip` is your backup. If an edit goes wrong,
> right-click the file in VS Code → **Open Timeline** → pick an earlier version → **Restore**,
> or just press `Ctrl` + `Z` until it's back.

## 2. The 5-file code tour (2 minutes)

Use `Ctrl` + `P` and type the file name to open each one quickly.

| Show | File | What to say |
|---|---|---|
| Scheme data | `src/data/schemes-citizens.ts` | "Every scheme is data: its rules, documents, steps and official sources. Adding a scheme needs no new code." |
| Rule engine | `src/lib/engine/evaluate.ts` (lines 21 and 80) | "This decides eligibility. Each rule is met, not met or unknown — 'I don't know' is never treated as 'no'. No AI here." |
| Smart questions | `src/lib/engine/next-question.ts` | "The assistant asks the one question that settles the most schemes." |
| Three languages | `src/messages/en.json`, `kn.json`, `hi.json` | "All screen text lives here, so translating is editing text, not code." |
| Safety for AI | `src/lib/ai/prompts.ts` | "If AI is switched on, it may only use verified data and can't change results." |

Bonus: `tests/unit/` — "246 automatic tests check the rules, schemes and languages."

## 3. Live changes judges often ask for

Each takes under a minute. The browser updates by itself after you save.

### A. "Change some text on the home page"
1. `Ctrl` + `P` → `en.json` → line **30**: `"heroTitle": "Find the government schemes you deserve"`.
2. Change the words inside the quotes, e.g. `"Find every scheme you qualify for"`.
3. Look at http://localhost:3000/en — the headline has changed.
4. Say: "Kannada and Hindi are in `kn.json` and `hi.json` with the same key."

### B. "Change the colour"
1. `Ctrl` + `P` → `globals.css` → line **17**: `--primary: #0f4c81;`
2. Change it to `#1e5e22` (green). Every button and the logo change at once.
3. Change it back afterwards.

### C. "Change an eligibility rule and show the effect"
1. Open the app → **My Schemes** for a person aged 42 (use **Edit my answers** to set age 42) — Atal Pension shows **not eligible** (age limit 18–40).
2. `Ctrl` + `P` → `schemes-citizens.ts` → line **533**:
   `age("age_18_40", 18, 40, ...`
3. Change `40` to `45` and save. Refresh **My Schemes** — Atal Pension now shows as a match.
4. Run the tests to show the safety net:
   ```bash
   npm test
   ```
   Say: "Tests protect the real rules — if someone changes a rule by mistake, we find out immediately."
5. **Change it back to 40** (the real rule) and save.

### D. "Add a new scheme"
1. In `schemes-citizens.ts`, find `slug: "pmsby"` (`Ctrl` + `F`).
2. Copy that whole block from `{` to the matching `},` and paste it right below.
3. Change: `slug` (e.g. `"demo-scheme"`), the `name` in all three languages, and the age in the `criteria`.
4. Save → open **All schemes** — the new scheme is listed, with its own page and rules.
5. Delete the block afterwards (it isn't a real scheme).
   Keep `applyUrl` and `sources` on official `.gov.in` sites — a test checks this.

### E. "Explain how the decision is made"
Open `evaluate.ts` line **21** (`evaluateRule`) and line **80** (`evaluateScheme`):
- each rule → met / not met / unknown
- all met → **Eligible**; any unknown → **Likely eligible**; any not met → **Not eligible**
- the match % comes from how many rules are met.

### F. "Show where the data is saved"
1. Sign in on **Profile** with any email → open the link in the local inbox (http://127.0.0.1:54324).
2. In the VS Code terminal, show the saved row straight from the database:
   ```bash
   docker exec supabase_db_sahaay-ai psql -U postgres -d postgres -c "select u.email, p.email_alerts, cp.answers->>'occupation' as work, cp.answers->>'state' as state from auth.users u join public.profiles p on p.id = u.id left join public.citizen_profiles cp on cp.user_id = u.id;"
   ```
   It prints each account's email, whether alerts are on, and their saved answers.
3. Say: "Without signing in, nothing leaves the phone. With sign-in, the database only lets each person read their own row (row-level security)."

### G. "Show the new-scheme alert"
1. Make your demo account an admin (once):
   ```bash
   docker exec supabase_db_sahaay-ai psql -U postgres -d postgres -c "update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR-DEMO-EMAIL');"
   ```
2. Reload **Profile** → open the **Admin** page → publish or import a scheme → click **Run alerts now**.
3. The bell at the top shows a number; **Notifications** lists "New scheme you may qualify for: …".

## 4. If something goes wrong during the demo

| Problem | Quick fix |
|---|---|
| Page shows an error after an edit | Press `Ctrl` + `Z` in VS Code, save, refresh |
| Browser didn't update | Press `F5` in Chrome |
| "Port 3000 in use" | Another copy is running — just open http://localhost:3000 |
| Sign-in says "not available" | Docker isn't running or `npx supabase start` wasn't run |
| Not sure what you changed | File → **Open Timeline** on that file, compare, restore |

## 5. Questions about the code

- **"Why not let AI decide?"** — Rules must be explainable and the same every time; AI can make mistakes.
- **"How do you know it works?"** — 246 unit tests + 86 browser tests; run `npm test` live.
- **"How do you add a state?"** — Add its schemes with `level: "state"`, `state: "<code>"` and a residence rule; tests check it.
- **"Where are the secrets?"** — In `.env.local`, never shared, never in the zip. Don't open it on the projector.
