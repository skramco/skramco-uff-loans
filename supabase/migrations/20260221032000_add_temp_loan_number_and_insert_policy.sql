/*
  # Add Temp Loan Number + Loans INSERT Policy

  ## Overview
  - Adds `temp_loan_number` column to loans table for pre-Vesta tracking
  - Adds a DB function to auto-generate UFF-TEMP-XXXXX numbers
  - Adds missing INSERT policy so authenticated borrowers can create loans
  - Adds phone column to borrower_profiles

  ## Flow
  - On account creation, borrower gets a temp loan number (UFF-TEMP-12345)
  - Temp number is used until final application submission
  - On submit, Vesta loan is created and vesta_loan_id is populated
  - Dashboard shows temp # or real Vesta # depending on state
*/

-- Add temp_loan_number column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'temp_loan_number'
  ) THEN
    ALTER TABLE loans ADD COLUMN temp_loan_number text;
  END IF;
END $$;

-- Add phone column to borrower_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'borrower_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE borrower_profiles ADD COLUMN phone text;
  END IF;
END $$;

-- Create function to generate temp loan numbers
CREATE OR REPLACE FUNCTION generate_temp_loan_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_num integer;
BEGIN
  -- Use a simple sequence based on count + random suffix
  SELECT COALESCE(MAX(CAST(SUBSTRING(temp_loan_number FROM 10) AS integer)), 10000) + 1
  INTO seq_num
  FROM loans
  WHERE temp_loan_number IS NOT NULL AND temp_loan_number LIKE 'UFF-TEMP-%';

  NEW.temp_loan_number := 'UFF-TEMP-' || seq_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Create trigger to auto-generate temp loan number on insert
DROP TRIGGER IF EXISTS generate_temp_loan_number_trigger ON public.loans;
CREATE TRIGGER generate_temp_loan_number_trigger
  BEFORE INSERT ON public.loans
  FOR EACH ROW
  WHEN (NEW.temp_loan_number IS NULL)
  EXECUTE FUNCTION generate_temp_loan_number();

-- Add unique index on temp_loan_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_loans_temp_loan_number
  ON loans(temp_loan_number) WHERE temp_loan_number IS NOT NULL;

-- Add INSERT policy for loans (was missing - borrowers couldn't create loans!)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'loans' AND policyname = 'Borrowers can create own loans'
  ) THEN
    CREATE POLICY "Borrowers can create own loans"
      ON loans FOR INSERT
      TO authenticated
      WITH CHECK (borrower_id = auth.uid());
  END IF;
END $$;
