# Vesta loan sync setup

Applications submitted at `/apply` create a row in `loans` and enqueue `vesta_sync_jobs`. The `vesta-sync-worker` edge function calls Vesta `POST /loans` and stores `vesta_loan_id`.

## Required Supabase secrets

Set on **all** Vesta-related edge functions (`vesta-sync-worker`, `vesta-integration`, `vesta-sync-cron`, `admin-settings`):

| Secret | Description |
|--------|-------------|
| `VESTA_DEV_API_KEY` | UFF beta API token |
| `VESTA_DEV_API_URL` | Optional (default `https://uff.beta.vesta.com/api/v1`) |
| `VESTA_DEV_API_VERSION` | Optional (default `26.1`) |
| `VESTA_PROD_API_KEY` | Production token when using prod |
| `VESTA_PROD_API_URL` | Optional |
| `VESTA_PROD_API_VERSION` | Optional |
| `VESTA_CRON_SECRET` | Optional bearer for scheduled `vesta-sync-cron` calls |

Also required: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `ADMIN_PASSWORD`.

## Deploy

```bash
supabase db push
supabase functions deploy vesta-sync-worker
supabase functions deploy vesta-integration
supabase functions deploy vesta-sync-cron
supabase functions deploy admin-settings
```

## Scheduled drain (recommended)

In Supabase Dashboard → Database → Extensions, enable `pg_cron` if available, **or** use an external scheduler to POST every 5 minutes:

```
POST https://<project>.supabase.co/functions/v1/vesta-sync-cron
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
```

Optional: set `VESTA_CRON_SECRET` and send `Authorization: Bearer <VESTA_CRON_SECRET>` instead.

## Admin recovery

Admin dashboard → **Vesta sync**:

- **Drain pending queue** — processes pending and retry-eligible failed jobs
- **Backfill** (API: `backfillVestaJobs`) — enqueues jobs for submitted loans missing Vesta ID
- **Run cron** (API: `runVestaSyncCron`) — reset stuck + backfill + drain

## Verify a submission

After submit, check:

```sql
SELECT id, vesta_loan_id, vesta_sync_status FROM loans WHERE id = '<loan-uuid>';
SELECT status, last_error, attempt_count FROM vesta_sync_jobs WHERE loan_id = '<loan-uuid>';
```

`vesta_loan_id` should be set; `vesta_sync_jobs.status` should be `succeeded`.

## Loan type / purpose mapping

The application form uses labels like **Conventional**, **FHA**, **VA** for mortgage *product*. Vesta’s top-level `loanType` field is a different enum (sending `Conventional` there returns HTTP 400).

On create, the worker sends:

- `loanProduct.mortgageType` — from the form’s loan type (see `supabase/functions/_shared/vestaEnums.ts`)
- `loanPurpose` — from the form’s loan purpose (`Purchase`, `Refinance`, `CashOutRefinance`, etc.)

If a new form value fails validation, add it to `UI_MORTGAGE_TYPE_TO_VESTA` or `UI_LOAN_PURPOSE_TO_VESTA` in that file (and the mirrored `src/lib/vestaEnums.ts`).
