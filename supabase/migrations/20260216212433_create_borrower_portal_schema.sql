/*
  # Borrower Portal Schema

  ## Overview
  Creates a secure borrower authentication and portal system with proper RLS policies.
  Borrowers can view their loans, conditions, and upload documents.

  ## 1. New Tables

  ### `borrower_profiles`
  - `id` (uuid, primary key, references auth.users)
  - `first_name` (text, required)
  - `last_name` (text, required)
  - `email` (text, required, unique)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `loans`
  - `id` (uuid, primary key)
  - `borrower_id` (uuid, foreign key to borrower_profiles)
  - `vesta_loan_id` (text, nullable)
  - `status` (text, default 'Active')
  - `loan_amount` (numeric, nullable)
  - `loan_type` (text, nullable)
  - `property_address` (text, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `conditions`
  - `id` (uuid, primary key)
  - `loan_id` (uuid, foreign key to loans)
  - `title` (text, required)
  - `description` (text, nullable)
  - `status` (text, default 'Open') - Open/Submitted/Cleared
  - `responsible_party` (text, default 'Borrower') - Borrower/Lender
  - `due_date` (date, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `documents`
  - `id` (uuid, primary key)
  - `loan_id` (uuid, foreign key to loans)
  - `condition_id` (uuid, nullable, foreign key to conditions)
  - `file_name` (text, required)
  - `file_url` (text, required)
  - `file_size` (bigint, nullable)
  - `file_type` (text, nullable)
  - `uploaded_by` (uuid, foreign key to auth.users)
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Borrowers can only access their own data
  - Policies enforce data isolation by borrower_id
  - All tables have proper indexes for performance

  ## 3. Important Notes
  - Uses Supabase auth.users for authentication
  - Passwords are automatically hashed by Supabase
  - borrower_profiles extends auth.users with additional info
  - Documents will be stored in Supabase Storage
  - Foreign key constraints ensure data integrity
*/

-- Create borrower_profiles table
CREATE TABLE IF NOT EXISTS borrower_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id uuid NOT NULL REFERENCES borrower_profiles(id) ON DELETE CASCADE,
  vesta_loan_id text,
  status text DEFAULT 'Active' NOT NULL,
  loan_amount numeric(12, 2),
  loan_type text,
  property_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conditions table
CREATE TABLE IF NOT EXISTS conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'Open' NOT NULL CHECK (status IN ('Open', 'Submitted', 'Cleared')),
  responsible_party text DEFAULT 'Borrower' NOT NULL CHECK (responsible_party IN ('Borrower', 'Lender')),
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  condition_id uuid REFERENCES conditions(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  uploaded_by uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_conditions_loan_id ON conditions(loan_id);
CREATE INDEX IF NOT EXISTS idx_conditions_status ON conditions(status);
CREATE INDEX IF NOT EXISTS idx_documents_loan_id ON documents(loan_id);
CREATE INDEX IF NOT EXISTS idx_documents_condition_id ON documents(condition_id);

-- Enable Row Level Security
ALTER TABLE borrower_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Borrower Profiles Policies
CREATE POLICY "Borrowers can view own profile"
  ON borrower_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Borrowers can update own profile"
  ON borrower_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON borrower_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Loans Policies
CREATE POLICY "Borrowers can view own loans"
  ON loans FOR SELECT
  TO authenticated
  USING (borrower_id = auth.uid());

CREATE POLICY "Borrowers can update own loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (borrower_id = auth.uid())
  WITH CHECK (borrower_id = auth.uid());

-- Conditions Policies
CREATE POLICY "Borrowers can view conditions for own loans"
  ON conditions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = conditions.loan_id
      AND loans.borrower_id = auth.uid()
    )
  );

CREATE POLICY "Borrowers can update conditions for own loans"
  ON conditions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = conditions.loan_id
      AND loans.borrower_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = conditions.loan_id
      AND loans.borrower_id = auth.uid()
    )
  );

-- Documents Policies
CREATE POLICY "Borrowers can view documents for own loans"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = documents.loan_id
      AND loans.borrower_id = auth.uid()
    )
  );

CREATE POLICY "Borrowers can upload documents for own loans"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = documents.loan_id
      AND loans.borrower_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Borrowers can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_borrower_profiles_updated_at ON borrower_profiles;
CREATE TRIGGER update_borrower_profiles_updated_at
  BEFORE UPDATE ON borrower_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loans_updated_at ON loans;
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conditions_updated_at ON conditions;
CREATE TRIGGER update_conditions_updated_at
  BEFORE UPDATE ON conditions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
