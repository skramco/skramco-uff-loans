/*
  # Add Application Data Fields to Loans Table

  ## Overview
  Extends the loans table to support incremental application data persistence.
  Borrowers can save progress as they complete each wizard step.

  ## Modified Tables
  ### `loans`
  - `loan_application_data` (jsonb) - Stores all form data as a JSON object
  - `application_progress` (integer) - Tracks which step the borrower has completed (0-7)
  - `is_submitted` (boolean) - Whether the application has been fully submitted

  ## Important Notes
  - loan_application_data stores the entire URLA form as a structured JSON payload
  - application_progress tracks wizard completion for resume functionality
  - is_submitted prevents further edits after final submission
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'loan_application_data'
  ) THEN
    ALTER TABLE loans ADD COLUMN loan_application_data jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'application_progress'
  ) THEN
    ALTER TABLE loans ADD COLUMN application_progress integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'is_submitted'
  ) THEN
    ALTER TABLE loans ADD COLUMN is_submitted boolean DEFAULT false;
  END IF;
END $$;
