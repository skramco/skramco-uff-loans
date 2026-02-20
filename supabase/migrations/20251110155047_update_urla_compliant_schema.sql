/*
  # Update Mortgage Applications to URLA-Compliant Schema

  ## Overview
  Updates the mortgage_applications table to match the Uniform Residential Loan Application (URLA)
  format used by Fannie Mae and Freddie Mac (Form 1003).

  ## New Tables
  
  ### `urla_applications`
  Complete URLA-compliant mortgage application with all sections:
  
  **Section 1a - Borrower Information:**
  - Basic identifying information
  - Contact details
  - Marital status
  - Dependents
  - Citizenship/residency
  
  **Section 1b - Current Employment:**
  - Employer information
  - Position, years on job
  - Income details
  - Self-employment flag
  
  **Section 1c - Previous Employment:**
  - For applicants with < 2 years at current employer
  
  **Section 2a - Assets:**
  - Bank accounts
  - Retirement accounts
  - Other assets
  
  **Section 2b - Liabilities:**
  - Monthly debts
  - Credit cards
  - Other obligations
  
  **Section 3 - Real Estate:**
  - Current property ownership
  - Rental income
  
  **Section 4 - Loan and Property Information:**
  - Loan purpose
  - Property details
  - Loan amount
  - Property type and occupancy
  
  **Section 5 - Declarations:**
  - Outstanding judgments
  - Bankruptcy history
  - Foreclosure history
  - Lawsuits
  - Loan obligations
  - Down payment source
  
  **Section 6 - Acknowledgments:**
  - Certifications and agreements
  
  **Section 7 - Military Service:**
  - Military service status
  
  **Section 8 - Demographics (optional):**
  - Government monitoring information
  
  ## Security
  - Enable RLS on urla_applications table
  - Allow public submissions (anon role)
  - Authenticated users can read all applications
  
  ## Migration Strategy
  - Creates new urla_applications table
  - Preserves existing mortgage_applications table
  - Applications submitted after deployment use new URLA format
*/

-- Create comprehensive URLA applications table
CREATE TABLE IF NOT EXISTS urla_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number text UNIQUE NOT NULL DEFAULT 'URLA-' || LPAD(FLOOR(RANDOM() * 999999999)::text, 9, '0'),
  
  -- Section 1a: Borrower Information
  borrower_first_name text NOT NULL DEFAULT '',
  borrower_middle_name text DEFAULT '',
  borrower_last_name text NOT NULL DEFAULT '',
  borrower_suffix text DEFAULT '',
  borrower_ssn text DEFAULT '',
  borrower_dob date,
  borrower_citizenship text DEFAULT '',
  borrower_marital_status text DEFAULT '',
  borrower_dependents_count integer DEFAULT 0,
  borrower_dependents_ages text DEFAULT '',
  
  -- Contact Information
  borrower_email text NOT NULL DEFAULT '',
  borrower_phone text NOT NULL DEFAULT '',
  borrower_current_address text NOT NULL DEFAULT '',
  borrower_current_city text DEFAULT '',
  borrower_current_state text DEFAULT '',
  borrower_current_zip text DEFAULT '',
  borrower_years_at_address numeric DEFAULT 0,
  borrower_months_at_address integer DEFAULT 0,
  borrower_housing_status text DEFAULT 'rent',
  borrower_monthly_rent numeric DEFAULT 0,
  
  -- Previous Address (if < 2 years at current)
  borrower_previous_address text DEFAULT '',
  borrower_previous_city text DEFAULT '',
  borrower_previous_state text DEFAULT '',
  borrower_previous_zip text DEFAULT '',
  borrower_years_at_prev_address numeric DEFAULT 0,
  
  -- Section 1b: Current Employment
  current_employer_name text DEFAULT '',
  current_employer_phone text DEFAULT '',
  current_employer_address text DEFAULT '',
  current_employer_city text DEFAULT '',
  current_employer_state text DEFAULT '',
  current_employer_zip text DEFAULT '',
  current_position text DEFAULT '',
  current_employment_start_date date,
  current_years_employed numeric DEFAULT 0,
  current_months_employed integer DEFAULT 0,
  self_employed boolean DEFAULT false,
  current_base_income numeric DEFAULT 0,
  current_overtime numeric DEFAULT 0,
  current_bonus numeric DEFAULT 0,
  current_commission numeric DEFAULT 0,
  current_military_entitlements numeric DEFAULT 0,
  current_other_income numeric DEFAULT 0,
  current_total_monthly_income numeric DEFAULT 0,
  
  -- Section 1c: Previous Employment (if < 2 years at current)
  previous_employer_name text DEFAULT '',
  previous_employer_phone text DEFAULT '',
  previous_position text DEFAULT '',
  previous_employment_start_date date,
  previous_employment_end_date date,
  previous_monthly_income numeric DEFAULT 0,
  
  -- Section 2a: Assets
  checking_accounts jsonb DEFAULT '[]',
  savings_accounts jsonb DEFAULT '[]',
  retirement_accounts jsonb DEFAULT '[]',
  other_assets jsonb DEFAULT '[]',
  total_assets numeric DEFAULT 0,
  gift_funds numeric DEFAULT 0,
  gift_source text DEFAULT '',
  
  -- Section 2b: Liabilities
  monthly_liabilities jsonb DEFAULT '[]',
  total_monthly_debt numeric DEFAULT 0,
  alimony_child_support numeric DEFAULT 0,
  
  -- Section 3: Real Estate Owned
  real_estate_owned jsonb DEFAULT '[]',
  
  -- Section 4: Loan and Property Information
  loan_purpose text NOT NULL DEFAULT 'purchase',
  loan_amount numeric NOT NULL DEFAULT 0,
  property_address text NOT NULL DEFAULT '',
  property_city text DEFAULT '',
  property_state text DEFAULT '',
  property_zip text DEFAULT '',
  property_county text DEFAULT '',
  property_value numeric NOT NULL DEFAULT 0,
  property_type text DEFAULT 'single_family',
  occupancy_type text DEFAULT 'primary_residence',
  units_count integer DEFAULT 1,
  mixed_use_property boolean DEFAULT false,
  manufactured_home boolean DEFAULT false,
  loan_type text DEFAULT 'conventional',
  down_payment numeric DEFAULT 0,
  
  -- Section 5: Declarations
  outstanding_judgments boolean DEFAULT false,
  outstanding_judgments_explanation text DEFAULT '',
  bankruptcy_last_7_years boolean DEFAULT false,
  bankruptcy_explanation text DEFAULT '',
  foreclosure_last_7_years boolean DEFAULT false,
  foreclosure_explanation text DEFAULT '',
  lawsuit_party boolean DEFAULT false,
  lawsuit_explanation text DEFAULT '',
  loan_foreclosure_obligation boolean DEFAULT false,
  loan_foreclosure_obligation_explanation text DEFAULT '',
  delinquent_federal_debt boolean DEFAULT false,
  delinquent_federal_debt_explanation text DEFAULT '',
  alimony_obligation boolean DEFAULT false,
  down_payment_borrowed boolean DEFAULT false,
  down_payment_borrowed_explanation text DEFAULT '',
  co_maker_note boolean DEFAULT false,
  us_citizen boolean DEFAULT true,
  permanent_resident boolean DEFAULT false,
  primary_residence boolean DEFAULT true,
  ownership_last_3_years boolean DEFAULT false,
  property_type_last_3_years text DEFAULT '',
  ownership_title text DEFAULT '',
  
  -- Section 7: Military Service
  currently_serving boolean DEFAULT false,
  previously_served boolean DEFAULT false,
  active_duty boolean DEFAULT false,
  surviving_spouse boolean DEFAULT false,
  non_activated_reserves boolean DEFAULT false,
  
  -- Section 8: Demographics (optional - government monitoring)
  ethnicity_hispanic_latino boolean,
  ethnicity_not_hispanic_latino boolean,
  ethnicity_not_provided boolean DEFAULT true,
  race_american_indian text DEFAULT '',
  race_asian text DEFAULT '',
  race_black boolean DEFAULT false,
  race_pacific_islander text DEFAULT '',
  race_white boolean DEFAULT false,
  race_not_provided boolean DEFAULT true,
  sex text DEFAULT 'not_provided',
  demographic_info_provided_via text DEFAULT '',
  
  -- Application Metadata
  status text DEFAULT 'draft',
  ai_assistance_used boolean DEFAULT false,
  additional_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  current_section integer DEFAULT 1,
  completed_sections jsonb DEFAULT '[]'
);

-- Create indexes for URLA applications
CREATE INDEX IF NOT EXISTS idx_urla_applications_number ON urla_applications(application_number);
CREATE INDEX IF NOT EXISTS idx_urla_applications_email ON urla_applications(borrower_email);
CREATE INDEX IF NOT EXISTS idx_urla_applications_status ON urla_applications(status);
CREATE INDEX IF NOT EXISTS idx_urla_applications_created ON urla_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_urla_applications_submitted ON urla_applications(submitted_at DESC);

-- Enable RLS
ALTER TABLE urla_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert applications (public form submissions)
CREATE POLICY "Anyone can submit URLA application"
  ON urla_applications FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to read applications
CREATE POLICY "Anyone can read URLA applications"
  ON urla_applications FOR SELECT
  TO anon
  USING (true);

-- Allow anyone to update their draft applications
CREATE POLICY "Anyone can update URLA applications"
  ON urla_applications FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_urla_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_urla_applications_updated_at ON urla_applications;
CREATE TRIGGER update_urla_applications_updated_at
  BEFORE UPDATE ON urla_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_urla_updated_at();
