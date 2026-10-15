# Sahaay AI — 3-minute demo script

**One line:** *Sahaay AI is a welfare copilot. Instead of searching portals, a citizen just says who they are, in their own language, and Sahaay finds the schemes they qualify for, explains why, and tells them exactly what to do next.*

## Before you start (2 minutes of setup)

1. Run `npm run dev` and open http://localhost:3000/en. Use a phone-sized window if possible (browser dev tools → mobile view).
2. Open **Profile → Delete my data** so you start clean.
3. Keep two tabs ready: `/en/assistant` and `/kn` (Kannada home page).

## The demo (≈3 minutes)

| Time | Show | Say |
|---|---|---|
| 0:00 | Home page | "Most citizens miss benefits because schemes are scattered, rules are confusing and everything is in complex English. Sahaay fixes that." |
| 0:20 | **Assistant** tab → type: *I need financial support for my crops* | "No forms. A farmer just says what he needs." |
| 0:35 | Sahaay replies *I understood: Farmer* and asks **one** question with buttons | "It asks only the questions that can still change the answer. A farmer is never asked about colleges or business loans." |
| 0:50 | Answer age 50, Man, Village, owns land: Yes, income tax: No, government job: No | "Four or five taps instead of a 20-question form." |
| 1:10 | Results: **PM-KISAN, Kisan Credit Card, accident insurance**, with links | "Every result comes from fixed rules, not AI guesses. AI understands the person; rules decide eligibility." |
| 1:25 | Open **PM-KISAN** → show ✓ rules, documents, official portal, 🔊 **Read aloud**, application tracker | "It explains *why*, lists documents with where to get them, and links only to official .gov.in portals." |
| 1:50 | Switch to **ಕನ್ನಡ** → **Ask Sahaay** button → type *ಅರ್ಜಿ ಹಾಕಲು ಯಾರಿಗಾದರೂ ಹಣ ಕೊಡಬೇಕೇ?* | "In Kannada or Hindi, on any page: applying is free, never pay agents. Fighting fraud is built in." |
| 2:15 | **Try an example → Lakshmi** (woman starting a tailoring shop) | "Not just students or farmers: Gruha Lakshmi, Shakti, PMEGP, MUDRA, PM Awas, all in one view." |
| 2:35 | **Roadmap** → slowest certificates first, risk panel, **Share on WhatsApp** | "It turns eligibility into a plan: which certificate to get first, and what could block you." |
| 2:50 | Close | "Honest by design: no invented deadlines or amounts, every scheme shows its source and when it was checked, and nothing goes live without human review." |

## Example people (`/demo`)

| Person | Shows |
|---|---|
| 🌾 Ramesh, 48, small farmer in Maharashtra | PM-KISAN, Kisan Credit Card, insurance — shows that people outside Karnataka get every central scheme |
| 🎓 Kavya, 19, SC BSc student, farmer's daughter | Post-Matric SC, Raitha Vidya Nidhi, Central Sector Scholarship, Shakti |
| 🧵 Lakshmi, 34, woman starting a shop, Bengaluru | Gruha Lakshmi, Shakti, PMEGP, MUDRA, PM Awas Urban, Atal Pension |
| 👴 Siddappa, 72, retired | Ayushman Vay Vandana (70+ health cover) |
| 💼 Arjun, 23, unemployed BCom graduate | Yuva Nidhi, Atal Pension, insurance |

These outcomes are checked by automated tests (`tests/unit/demo-personas.test.ts`), so the demo can't break silently.

## Likely judge questions

**"Isn't this just myScheme?"**
myScheme is a great national catalogue. Sahaay focuses on what happens *after* discovery, for people who struggle with forms:
- **Conversation, not filters:** describe yourself in Kannada, Hindi or English (typed or spoken), and it asks only the next useful question.
- **Explains every rule** (✓ / ✗ / not sure yet) and says honestly when it can't be sure.
- **Personal roadmap:** documents ordered by how long they take, where to get each, risks, a tracker, a WhatsApp checklist.
- **Alerts** when a new or changed scheme matches you (with consent).
- Built to plug into myScheme's data if API access is granted (see `n8n/README.md`).

We don't claim myScheme lacks these features. These are the parts of the experience we focused on.

**"How do you stop the AI from making things up?"**
The AI never decides eligibility. A deterministic rule engine does (217+ unit tests). The AI only reads the citizen's description (and the person confirms it) and phrases answers using our verified data. With no AI key at all, everything still works.

**"How do you keep data accurate?"**
Every scheme stores its official source and review date and shows a trust badge. Deadlines and amounts are never stored unless verified. n8n watches official pages daily; changes go to an admin review queue; citizens can report wrong information. Nothing is published without a human.

**"Privacy?"**
Guest mode keeps answers only in the browser. Accounts are optional, protected by row-level security, and deletable in one click. We never ask for Aadhaar or bank numbers.

**"Does it work for people who can't read well?"**
Voice input, read-aloud, simple mode (bigger text), icons with every status, and screen-reader support (automated accessibility checks run in the test suite).

**"What's next?"**
Go live (Supabase + Vercel), AI answers with an API key, more schemes and states, and a myScheme integration once access is approved.
