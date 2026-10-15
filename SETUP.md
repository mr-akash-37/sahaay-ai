# Run Sahaay AI on your laptop

Works on Windows, Mac and Linux. About 10 minutes the first time.

## 1. Install Node.js (once)

1. Go to **https://nodejs.org** and download the **LTS** version (20 or newer).
2. Install it with the default options.
3. Check it worked — open a terminal (Windows: **PowerShell**) and run:

   ```bash
   node --version
   ```
   You should see `v20…` or higher.

## 2. Unzip the app

Unzip `sahaay-ai-app.zip` anywhere, for example your **Downloads** folder.
Open a terminal **inside** the unzipped `sahaay-ai-app` folder
(Windows: open the folder, click the address bar, type `powershell`, press Enter).

## 3. Install and start

```bash
npm install
```
(First time only — downloads the libraries, about 2–5 minutes.)

Then choose ONE way to run it:

| What you want | Command | Open in browser |
|---|---|---|
| Try it / show it (fast, recommended) | `npm run share` | http://localhost:3001 |
| Change the code (reloads on save) | `npm run dev` | http://localhost:3000 |

Stop it any time with **Ctrl + C** in the terminal.

That's it — the app works fully in **guest mode**: all 25 schemes, step-by-step check,
"describe in my words", the assistant, voice typing (Chrome/Edge), roadmap, tracker,
English / ಕನ್ನಡ / हिन्दी, and the "Try an example" demo people. Answers are saved in the browser.

## 4. Share with a friend (optional)

While `npm run share` is running, in a **second** terminal:

```bash
ngrok http 3001
```
Send your friend the `https://…ngrok-free.dev` link it prints. (Install ngrok from https://ngrok.com first.)

---

## Optional extras (need accounts or keys)

The app turns these on by itself once their settings are in a file named **`.env.local`**.
Create it by copying **`.env.example`** to **`.env.local`** and filling in only what you need.
Never share or upload `.env.local`.

| Feature | What you need | Guide |
|---|---|---|
| Sign-in, saving answers across devices, email alerts, admin page | A free **Supabase** project (cloud), or Docker Desktop for a local one | `docs/GO_LIVE.md` step 1 |
| Alert emails | A **Resend** account | `docs/GO_LIVE.md` step 3 |
| Smarter AI answers | An **OpenAI** or **Gemini** API key | set `AI_PROVIDER`, `AI_MODEL` and the key in `.env.local` |
| Public website (no laptop needed) | A **Vercel** account | `docs/GO_LIVE.md` step 2 |

**Your Supabase cloud database is already set up** (you ran `supabase/production-setup.sql`).
To use it from the laptop, put these three values from Supabase → Project Settings → API into
`.env.local`, then restart:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
Also add `http://localhost:3000/**` and `http://localhost:3001/**` under Supabase →
Authentication → URL Configuration → Redirect URLs, so sign-in links come back to your laptop.

## Checks (for developers)

```bash
npm run check
```
Runs type checks, lint, 246 unit tests and a production build.
Browser tests: `npx playwright install chromium` once, then `npm run test:e2e`.

## Where things are

| Folder / file | What it is |
|---|---|
| `src/data/` | Schemes, documents, example people — add schemes here |
| `src/messages/` | All text in English, Kannada, Hindi |
| `src/app/` | Pages |
| `supabase/` | Database setup (`production-setup.sql` = everything in one file) |
| `docs/DEMO.md` | 3-minute demo script and judge Q&A |
| `docs/GO_LIVE.md` | Putting it online |

## Problems?

- **`npm` is not recognised** → Node.js isn't installed, or reopen the terminal after installing.
- **Port already in use** → another copy is running; close it, or use the other command.
- **Sign-in says "not available"** → normal in guest mode; add the Supabase settings above.
- **Voice typing does nothing** → use Chrome or Edge and allow the microphone.
