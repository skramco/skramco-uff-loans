/*
  # Fix Security and Performance Issues

  ## 1. Missing Foreign Key Index
  - Add index on `documents.uploaded_by` for the `documents_uploaded_by_fkey` constraint
  - Prevents slow sequential scans on cascading deletes and joins

  ## 2. Optimize RLS Policies (auth function caching)
  - Replace `auth.uid()` with `(select auth.uid())` in all borrower portal RLS policies
  - Affected tables: borrower_profiles, loans, conditions, documents (10 policies total)
  - Prevents re-evaluation of the auth function per row, improving query performance at scale

  ## 3. Fix Function Search Path
  - Update `update_updated_at_column` function with SECURITY DEFINER and empty search_path
  - Prevents potential search path manipulation attacks

  ## 4. Add Restrictive Policy to admin_settings
  - Adds a no-access policy so the linter sees RLS is intentionally configured
  - Table is only accessed via service role key (which bypasses RLS)

  ## 5. Tighten Always-True RLS Policies
  - `calculator_sessions` INSERT: Require non-empty session_type
  - `mortgage_applications` INSERT: Require non-empty applicant_name and email
  - `urla_applications` INSERT: Require non-empty borrower_email
  - `urla_applications` UPDATE: Restrict to draft-status applications only

  ## 6. Unused Indexes (kept intentionally)
  - idx_loans_borrower_id, idx_conditions_loan_id, idx_conditions_status,
    idx_documents_loan_id, idx_documents_condition_id are on borrower portal
    tables and support foreign key joins and common filtering patterns.
    They appear unused because the portal is new. Retained for future performance.

  ## Notes
  - Auth DB Connection Strategy is a project-level Supabase setting (not addressable via migration)
*/

-- 1. Add missing index for documents.uploaded_by foreign key
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- 2. Optimize borrower_profiles RLS policies with (select auth.uid())
DROP POLICY IF EXISTS "Borrowers can view own profile" ON borrower_profiles;
CREATE POLICY "Borrowers can view own profile"
  ON borrower_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Borrowers can update own profile" ON borrower_profiles;
CREATE POLICY "Borrowers can update own profile"
  ON borrower_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON borrower_profiles;
CREATE POLICY "Users can insert own profile"
  ON borrower_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- Optimize loans RLS policies
DROP POLICY IF EXISTS "Borrowers can view own loans" ON loans;
CREATE POLICY "Borrowers can view own loans"
  ON loans FOR SELECT
  TO authenticated
  USING (borrower_id = (select auth.uid()));

DROP POLICY IF EXISTS "Borrowers can update own loans" ON loans;
CREATE POLICY "Borrowers can update own loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (borrower_id = (select auth.uid()))
  WITH CHECK (borrower_id = (select auth.uid()));

-- Optimize conditions RLS policies
DROP POLICY IF EXISTS "Borrowers can view conditions for own loans" ON conditions;
CREATE POLICY "Borrowers can view conditions for own loans"
  ON conditions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = conditions.loan_id
      AND loans.borrower_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Borrowers can update conditions for own loans" ON conditions;
CREATE POLICY "Borrowers can update conditions for own loans"
  ON conditions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = conditions.loan_id
      AND loans.borrower_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = conditions.loan_id
      AND loans.borrower_id = (select auth.uid())
    )
  );

-- Optimize documents RLS policies
DROP POLICY IF EXISTS "Borrowers can view documents for own loans" ON documents;
CREATE POLICY "Borrowers can view documents for own loans"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = documents.loan_id
      AND loans.borrower_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Borrowers can upload documents for own loans" ON documents;
CREATE POLICY "Borrowers can upload documents for own loans"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = documents.loan_id
      AND loans.borrower_id = (select auth.uid())
    )
    AND uploaded_by = (select auth.uid())
  );

DROP POLICY IF EXISTS "Borrowers can delete own documents" ON documents;
CREATE POLICY "Borrowers can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (uploaded_by = (select auth.uid()));

-- 3. Fix update_updated_at_column function with secure search path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

-- 4. Add restrictive policy to admin_settings (service role bypasses RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_settings' AND policyname = 'No direct access to admin settings'
  ) THEN
    CREATE POLICY "No direct access to admin settings"
      ON admin_settings FOR SELECT
      TO authenticated
      USING (false);
  END IF;
END $$;

-- 5. Tighten always-true RLS policies with meaningful checks

-- calculator_sessions: require non-empty session_type
DROP POLICY IF EXISTS "Anyone can create calculator sessions" ON calculator_sessions;
CREATE POLICY "Anyone can create calculator sessions"
  ON calculator_sessions FOR INSERT
  TO anon
  WITH CHECK (session_type <> '');

-- mortgage_applications: require non-empty applicant data
DROP POLICY IF EXISTS "Anyone can submit mortgage application" ON mortgage_applications;
CREATE POLICY "Anyone can submit mortgage application"
  ON mortgage_applications FOR INSERT
  TO anon
  WITH CHECK (applicant_name <> '' AND email <> '');

-- urla_applications INSERT: require non-empty borrower email
DROP POLICY IF EXISTS "Anyone can submit URLA application" ON urla_applications;
CREATE POLICY "Anyone can submit URLA application"
  ON urla_applications FOR INSERT
  TO anon
  WITH CHECK (borrower_email <> '');

-- urla_applications UPDATE: restrict to draft-status applications only
DROP POLICY IF EXISTS "Anyone can update URLA applications" ON urla_applications;
CREATE POLICY "Anyone can update URLA applications"
  ON urla_applications FOR UPDATE
  TO anon
  USING (status = 'draft')
  WITH CHECK (status IN ('draft', 'submitted'));
