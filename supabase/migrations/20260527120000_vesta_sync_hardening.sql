/*
  # Vesta sync hardening

  - Server-side enqueue when loan is submitted (trigger)
  - SQL payload builder from loan_application_data
  - Claim failed jobs eligible for retry
  - Reset stuck processing jobs
*/

-- Build Vesta outbox payload from loan_application_data (mirrors mapLoanApplicationToVesta top-level fields)
CREATE OR REPLACE FUNCTION public.build_vesta_payload_from_application(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  pi jsonb := COALESCE(p_data->'personalInfo', '{}'::jsonb);
  ld jsonb := COALESCE(p_data->'loanDetails', '{}'::jsonb);
  pr jsonb := COALESCE(p_data->'property', '{}'::jsonb);
  prop_addr text;
BEGIN
  prop_addr := NULLIF(trim(concat_ws(', ',
    NULLIF(pr->>'address', ''),
    NULLIF(pr->>'city', ''),
    NULLIF(pr->>'state', ''),
    NULLIF(pr->>'zip', '')
  )), '');

  RETURN jsonb_build_object(
    'borrowerFirstName', pi->>'firstName',
    'borrowerLastName', pi->>'lastName',
    'borrowerEmail', pi->>'email',
    'borrowerPhone', pi->>'phone',
    'loanAmount', (ld->>'loanAmount')::numeric,
    'propertyAddress', COALESCE(NULLIF(pr->>'address', ''), prop_addr),
    'loanType', ld->>'loanType',
    'loanPurpose', ld->>'loanPurpose',
    'propertyValue', (pr->>'propertyValue')::numeric,
    'applicationData', p_data,
    'urlaMapped', jsonb_build_object(
      'personalInfo', pi,
      'employment', COALESCE(p_data->'employment', '{}'::jsonb),
      'assets', COALESCE(p_data->'assets', '{}'::jsonb),
      'liabilities', COALESCE(p_data->'liabilities', '{}'::jsonb),
      'property', pr,
      'loanDetails', ld,
      'declarations', COALESCE(p_data->'declarations', '{}'::jsonb)
    ),
    'mappingVersion', '1'
  );
END;
$$;

-- Enqueue create_loan job when application is submitted (server-side, idempotent)
CREATE OR REPLACE FUNCTION public.enqueue_vesta_sync_on_submit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  IF NEW.is_submitted IS TRUE
     AND (TG_OP = 'INSERT' OR OLD.is_submitted IS DISTINCT FROM TRUE)
     AND NEW.vesta_loan_id IS NULL
     AND NEW.loan_application_data IS NOT NULL
  THEN
    v_payload := build_vesta_payload_from_application(NEW.loan_application_data);

    INSERT INTO vesta_sync_jobs (
      loan_id,
      operation,
      idempotency_key,
      payload_json,
      mapping_version,
      status
    ) VALUES (
      NEW.id,
      'create_loan',
      'create_loan:' || NEW.id::text,
      v_payload,
      '1',
      'pending'
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

    IF NEW.vesta_sync_status IS NULL OR NEW.vesta_sync_status = '' THEN
      NEW.vesta_sync_status := 'queued';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_vesta_sync_on_submit ON loans;
CREATE TRIGGER trg_enqueue_vesta_sync_on_submit
  BEFORE INSERT OR UPDATE OF is_submitted, loan_application_data ON loans
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_vesta_sync_on_submit();

-- Reset jobs stuck in processing (worker crash / timeout)
CREATE OR REPLACE FUNCTION public.reset_stuck_vesta_sync_jobs(p_stale_minutes integer DEFAULT 15)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE vesta_sync_jobs
  SET
    status = 'pending',
    updated_at = now()
  WHERE status = 'processing'
    AND updated_at < now() - (p_stale_minutes || ' minutes')::interval;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_stuck_vesta_sync_jobs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_stuck_vesta_sync_jobs(integer) TO service_role;

-- Claim next eligible job: pending, or failed with retry due
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
      AND (
        v.status = 'pending'
        OR (
          v.status = 'failed'
          AND v.attempt_count < 5
          AND (v.next_retry_at IS NULL OR v.next_retry_at <= now())
        )
      )
    ORDER BY v.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING j.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_vesta_sync_job(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_vesta_sync_job(uuid) TO service_role;

-- Backfill: enqueue jobs for submitted loans missing Vesta ID and without active jobs
CREATE OR REPLACE FUNCTION public.backfill_vesta_sync_jobs(p_limit integer DEFAULT 50)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_count integer := 0;
BEGIN
  FOR r IN
    SELECT l.id, l.loan_application_data
    FROM loans l
    WHERE l.is_submitted = true
      AND l.vesta_loan_id IS NULL
      AND l.loan_application_data IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM vesta_sync_jobs j
        WHERE j.loan_id = l.id
          AND j.status IN ('pending', 'processing')
      )
    ORDER BY l.submitted_at ASC NULLS LAST, l.created_at ASC
    LIMIT p_limit
  LOOP
    INSERT INTO vesta_sync_jobs (
      loan_id,
      operation,
      idempotency_key,
      payload_json,
      mapping_version,
      status
    ) VALUES (
      r.id,
      'create_loan',
      'create_loan:' || r.id::text,
      build_vesta_payload_from_application(r.loan_application_data),
      '1',
      'pending'
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

    UPDATE vesta_sync_jobs
    SET
      status = 'pending',
      last_error = NULL,
      next_retry_at = NULL,
      updated_at = now()
    WHERE loan_id = r.id
      AND status IN ('failed', 'dead_letter')
      AND vesta_loan_id IS NULL;

    UPDATE loans
    SET vesta_sync_status = COALESCE(vesta_sync_status, 'queued'),
        updated_at = now()
    WHERE id = r.id AND vesta_loan_id IS NULL;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_vesta_sync_jobs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backfill_vesta_sync_jobs(integer) TO service_role;
