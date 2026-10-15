# n8n workflows for Sahaay AI

n8n watches official government pages and tells Sahaay AI when something changes.
**Nothing is published automatically.** Every change becomes a *pending event* in
the admin portal (`/en/admin` → Review queue). An admin checks the official page,
updates the scheme record, and approves. Citizens are alerted only after that.

```
n8n (daily) ──signed POST──▶ /api/webhooks/discovery ──▶ discovery_events (pending)
                                                              │ admin reviews & publishes
                                                              ▼
                                   schemes + scheme_versions ──▶ alert job ──▶ in-app + email
```

## Workflows

| File | What it does |
|---|---|
| `official-page-monitor.json` | Once a day, fetches each official page in its list. It sends `page_changed` when the visible text changes and `link_broken` when the page fails to load. |

## Setup

1. **Generate a secret** (at least 32 characters):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **Sahaay AI**: put it in `.env.local` as `N8N_WEBHOOK_SECRET=...` (and in Vercel's environment variables).
3. **n8n server**: set these environment variables, then restart n8n:
   ```
   SAHAAY_WEBHOOK_SECRET=<the same secret>
   SAHAAY_APP_URL=https://your-sahaay-domain   # no trailing slash
   NODE_FUNCTION_ALLOW_BUILTIN=crypto          # lets the Code node sign requests
   ```
4. In n8n: **Workflows → Import from file** → choose `official-page-monitor.json`.
5. Open the **Pages to watch** node and edit the list. Use only official `https://` government pages.
6. Run it once manually. The first run only records each page, so no events are sent. Activate the workflow.

## Webhook contract

`POST /api/webhooks/discovery`

Headers:
- `x-sahaay-timestamp`: Unix seconds. Requests more than 5 minutes old or new are rejected (replay protection).
- `x-sahaay-signature`: hex HMAC-SHA256 of `${timestamp}.${rawBody}` using the shared secret.

Body (JSON):

| Field | Required | Notes |
|---|---|---|
| `idempotencyKey` | yes | 8–200 chars. Re-sending the same key is ignored (returns `duplicate: true`). |
| `source` | yes | Human-readable source name. |
| `sourceUrl` | yes | Must be `https://`. |
| `eventType` | yes | `new_scheme`, `deadline_change`, `benefit_change`, `eligibility_change`, `link_broken` or `page_changed` |
| `title` | yes | Shown in the review queue. |
| `details` | no | Up to 5,000 chars. |
| `schemeSlug` | no | Links the event to an existing scheme. |
| `proposed` | no | A complete scheme record (same shape as `src/data/schemes.ts`). It is validated strictly and still needs admin approval. |

Responses: `201` created, `200` duplicate, `401` bad signature, `413` too large, `422` invalid payload (with details), `429` rate limited, `503` not configured.

## Adding myScheme later

If API Setu / NeGD grants myScheme API access, add a workflow that calls their API and sends each new or changed scheme as a `new_scheme` or `eligibility_change` event. Include a `proposed` record once the fields are mapped. The review and alert pipeline stays exactly the same.
