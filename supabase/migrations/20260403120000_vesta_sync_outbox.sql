/*
  # Vesta sync outbox (durable create + idempotency)

  - vesta_sync_jobs: queue for pushing loans to Vesta
  - idempotency_key UNIQUE prevents duplicate create_loan per loan
  - claim_vesta_sync_job: single-row claim for worker (SKIP LOCKED)
  - RLS: borrowers insert/select own jobs; updates via service role (worker)
*/

CREATE TABLE IF NOT EXISTS vesta_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  operation text NOT NULL CHECK (operation IN ('create_loan')),
  idempotency_key text NOT NULL UNIQUE,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  mapping_version text NOT NULL DEFAULT '1',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'dead_letter')),
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  next_retry_at timestamptz,
  vesta_loan_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vesta_sync_jobs_loan_id ON vesta_sync_jobs(loan_id);
CREATE INDEX IF NOT EXISTS idx_vesta_sync_jobs_status_created ON vesta_sync_jobs(status, created_at);

ALTER TABLE vesta_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Borrowers can view own vesta sync jobs"
  ON vesta_sync_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans l
      WHERE l.id = vesta_sync_jobs.loan_id
        AND l.borrower_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Borrowers can insert vesta sync jobs for own loans"
  ON vesta_sync_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans l
      WHERE l.id = vesta_sync_jobs.loan_id
        AND l.borrower_id = (SELECT auth.uid())
    )
  );

COMMENT ON TABLE vesta_sync_jobs IS 'Outbox for idempotent Vesta API sync; processed by vesta-sync-worker Edge Function.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'vesta_sync_status'
  ) THEN
    ALTER TABLE loans ADD COLUMN vesta_sync_status text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE loans ADD COLUMN submitted_at timestamptz;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.claim_vesta_sync_job(p_loan_id uuid)
RETURNS SETOF vesta_sync_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE vesta_sync_jobs j
  SET
    status = 'processing',
    updated_at = now(),
    attempt_count = j.attempt_count + 1
  WHERE j.id = (
    SELECT v.id
    FROM vesta_sync_jobs v
    WHERE v.loan_id = p_loan_id
      AND v.status = 'pending'
    ORDER BY v.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING j.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_vesta_sync_job(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_vesta_sync_job(uuid) TO service_role;
