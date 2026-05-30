# Marketing Automation Setup

Marketing campaigns for UFF / PRO Portal are generated in Supabase, sent via **ActiveCampaign only** (not Resend), and optionally published to LinkedIn.

## Architecture

| System | Role |
|--------|------|
| **Supabase** | Campaign content, approval, audit, metrics snapshots |
| **ActiveCampaign** | Subscribers and email delivery |
| **OpenAI DALL-E** | Campaign hero images (default; no Canva required) |
| **Canva Connect** | Optional brand templates if `MARKETING_IMAGE_PROVIDER=canva` |
| **OpenAI** | Campaign copy generation |
| **ProWebsiteUFF (uff.pro)** | Broker landing pages at `/lp/{slug}` — auto-pushed to GitHub |
| **LinkedIn** | Optional company page posts |

## Deploy

```bash
# Apply migrations
npx supabase db push

# Deploy edge functions
npx supabase functions deploy marketing-automation
npx supabase functions deploy marketing-cron
```

## Environment variables

Set via `npx supabase secrets set`:

### Required for generation (Phase 1)

| Variable | Description |
|----------|-------------|
| `ADMIN_PASSWORD` | Admin UI password (existing) |
| `OPENAI_API_KEY` | OpenAI API key (copy + DALL-E images) |
| `OPENAI_MODEL` | Optional, default `gpt-4o` |
| `OPENAI_IMAGE_MODEL` | Optional, default `gpt-image-1` (use `dall-e-3` for legacy) |
| `OPENAI_IMAGE_QUALITY` | Optional for GPT image models: `low`, `medium`, `high` (default `medium`) |
| `FRED_API_KEY` | **Required for Daily Rate / Market Commentary** — live FRED economic data so AI uses real figures with dates |
| `MARKETING_IMAGE_PROVIDER` | Optional: `openai` (default) or `canva` |

### ActiveCampaign (Phase 2)

| Variable | Description |
|----------|-------------|
| `ACTIVECAMPAIGN_API_URL` | `https://uffmortgage.api-us1.com/api/3` (must include `/api/3`) |
| `ACTIVECAMPAIGN_API_KEY` | API token from [ActiveCampaign Developer settings](https://developers.activecampaign.com/reference) |
| `ACTIVECAMPAIGN_DEFAULT_LIST_ID` | Env fallback only. **Admin → Marketing → Settings** overrides this. Use `34` for testing, `21` for MarketingList-Wholesale (production). |
| `ACTIVECAMPAIGN_FROM_EMAIL` | Sender email |
| `ACTIVECAMPAIGN_FROM_NAME` | Sender name (default: United Fidelity Funding) |
| `ACTIVECAMPAIGN_REPLY_TO` | Reply-to address |
| `ACTIVECAMPAIGN_TIMEZONE` | Account timezone for `sdate` (UFF account: `America/Los_Angeles`). Auto-detected from AC if unset. |

### Canva (Phase 3)

| Variable | Description |
|----------|-------------|
| `CANVA_CLIENT_ID` | Canva Connect app client ID |
| `CANVA_CLIENT_SECRET` | Canva Connect client secret |
| `CANVA_REDIRECT_URI` | OAuth redirect URI |
| `CANVA_ACCESS_TOKEN` | Initial access token |
| `CANVA_REFRESH_TOKEN` | Refresh token (also stored in `marketing_settings`) |

### LinkedIn (Phase 5, optional)

| Variable | Description |
|----------|-------------|
| `LINKEDIN_CLIENT_ID` | LinkedIn app client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn app secret |
| `LINKEDIN_ACCESS_TOKEN` | Organization post access token |
| `LINKEDIN_ORGANIZATION_ID` | Company page organization ID |
| `LINKEDIN_AUTO_POST_ENABLED` | `true` or `false` |
| `LINKEDIN_REQUIRE_APPROVAL` | `true` or `false` |

### Scheduler

| Variable | Description |
|----------|-------------|
| `MARKETING_CRON_SECRET` | Optional bearer for cron (alternative: service role) |

### Pro landing pages (uff.pro / ProWebsiteUFF)

Each generated campaign creates a broker landing page at `https://www.uff.pro/lp/{slug}`. Email CTAs and in-body links point there. Content is committed to the ProWebsiteUFF GitHub repo so Netlify auto-deploys.

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub PAT with `contents:write` on `skramco/skramco-uff-pro` |
| `PRO_WEBSITE_GITHUB_REPO` | Optional, default `skramco/skramco-uff-pro` |
| `PRO_WEBSITE_GITHUB_BRANCH` | Optional, default `main` |
| `PRO_LANDING_BASE_URL` | Optional, default `https://www.uff.pro` |

```powershell
npx supabase secrets set GITHUB_TOKEN="ghp_..." PRO_LANDING_BASE_URL="https://www.uff.pro"
npx supabase functions deploy marketing-automation --project-ref pvzqgboffydqeqzeiysx
```

The ProWebsiteUFF app must include the `/lp/[slug]` route (see `ProWebsiteUFF/app/lp/[slug]/page.tsx`) before JSON-only commits will render pages.

## Admin UI

Routes (password-gated, same as existing admin):

- `/admin/marketing` — overview and quick generate
- `/admin/marketing/campaigns` — campaign list
- `/admin/marketing/campaigns/:id` — preview, approve, send
- `/admin/marketing/templates` — template and Canva ID config
- `/admin/marketing/settings` — approval thresholds, **ActiveCampaign list picker** (testing 34 vs marketing 21), LinkedIn flags
- `/admin/marketing/metrics` — performance dashboard

## Scheduler (cron)

POST to `marketing-cron` every **15 minutes** (external scheduler or Supabase cron):

```http
POST https://<project>.supabase.co/functions/v1/marketing-cron
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
Content-Type: application/json

{}
```

Optional body to force a job:

```json
{ "jobType": "daily_rate_update" }
```

Jobs:

| Job | Default schedule |
|-----|------------------|
| Daily rate update | Weekdays 7:30 AM ET |
| PRO Portal feature | Weekdays 2:00 PM ET |
| Weekly newsletter | Friday 9:00 AM ET |
| Metrics sync | Every 6 hours |
| Performance review | Sunday (weekly AI feedback) |

Schedules are configurable in `marketing_settings` via admin Settings UI.

## Safety rules

1. Campaigns default to **pending approval** before send.
2. High compliance risk, FHA/VA/rate references, or Vesta insights force approval.
3. Auto-send only for campaign types in `auto_send_trusted_types` setting.
4. All sends are audit-logged; idempotency keys prevent duplicate scheduled sends.
5. **Resend is not used** for marketing — ActiveCampaign only.

## Canva OAuth callback

Use the `canvaOAuthCallback` action on `marketing-automation` after OAuth redirect, or set initial tokens via env vars.

## UFF ActiveCampaign setup

```powershell
npx supabase login
$env:ACTIVECAMPAIGN_API_KEY = "your-key-from-ac-developer-settings"
.\scripts\set-activecampaign-secrets.ps1
npx supabase functions deploy marketing-automation marketing-cron --project-ref pvzqgboffydqeqzeiysx
```

Verified list **21** = `MarketingList-Wholesale` on account [uffmortgage.api-us1.com](https://uffmortgage.api-us1.com).

## ActiveCampaign MCP — do not use

Marketing sends through the **REST API** (`marketing-automation` edge function), not ActiveCampaign's MCP agent URL:

`https://uffmortgage.activehosted.com/api/agents/mcp/http`

If that MCP server was added in Cursor, remove it under **Cursor Settings → MCP** (disable/delete the ActiveCampaign / activehosted entry). It is not used by uff.loans and duplicates what the edge function already does securely via Supabase secrets.

## Testing

```bash
npm test          # Vitest — compliance guardrails, approval rules
npm run test:deno # Deno tests for shared marketing modules
```
