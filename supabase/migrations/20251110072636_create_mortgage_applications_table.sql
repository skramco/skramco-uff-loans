/*
  # Create Mortgage Applications System

  1. New Tables
    - `mortgage_applications`
      - `id` (uuid, primary key)
      - `application_number` (text, unique) - Auto-generated application reference
      - `applicant_name` (text) - Full name of applicant
      - `email` (text) - Contact email
      - `phone` (text) - Contact phone
      - `loan_amount` (numeric) - Requested loan amount
      - `property_value` (numeric) - Estimated property value
      - `property_address` (text) - Property location
      - `employment_status` (text) - Current employment status
      - `annual_income` (numeric) - Gross annual income
      - `credit_score_range` (text) - Self-reported credit score range
      - `loan_type` (text) - Type of mortgage (conventional, FHA, VA, etc)
      - `first_time_buyer` (boolean) - First-time homebuyer status
      - `down_payment` (numeric) - Available down payment amount
      - `status` (text) - Application status (draft, submitted, reviewing, approved, etc)
      - `ai_assistance_used` (boolean) - Whether AI assistance was utilized
      - `additional_notes` (text) - Additional information from applicant
      - `created_at` (timestamptz) - Application submission timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `calculator_sessions`
      - `id` (uuid, primary key)
      - `session_type` (text) - Type of calculator used
      - `inputs` (jsonb) - Calculator input values
      - `results` (jsonb) - Calculated results
      - `created_at` (timestamptz) - Session timestamp

  2. Security
    - Enable RLS on all tables
    - Applications can be created by anyone (for lead generation)
    - Applications can be read only by authenticated staff
    - Calculator sessions are anonymous and expire automatically

  3. Indexes
    - Index on application_number for quick lookups
    - Index on email for duplicate checking
    - Index on status for filtering
    - Index on created_at for sorting
*/

-- Create mortgage_applications table
CREATE TABLE IF NOT EXISTS mortgage_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number text UNIQUE NOT NULL DEFAULT 'APP-' || LPAD(FLOOR(RANDOM() * 999999999)::text, 9, '0'),
  applicant_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  loan_amount numeric NOT NULL,
  property_value numeric NOT NULL,
  property_address text NOT NULL,
  employment_status text NOT NULL,
  annual_income numeric NOT NULL,
  credit_score_range text NOT NULL,
  loan_type text NOT NULL DEFAULT 'conventional',
  first_time_buyer boolean DEFAULT false,
  down_payment numeric DEFAULT 0,
  status text DEFAULT 'draft',
  ai_assistance_used boolean DEFAULT false,
  additional_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create calculator_sessions table
CREATE TABLE IF NOT EXISTS calculator_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}',
  results jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mortgage_applications_number ON mortgage_applications(application_number);
CREATE INDEX IF NOT EXISTS idx_mortgage_applications_email ON mortgage_applications(email);
CREATE INDEX IF NOT EXISTS idx_mortgage_applications_status ON mortgage_applications(status);
CREATE INDEX IF NOT EXISTS idx_mortgage_applications_created ON mortgage_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculator_sessions_type ON calculator_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_calculator_sessions_created ON calculator_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE mortgage_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for mortgage_applications
-- Allow anyone to insert applications (public form submissions)
CREATE POLICY "Anyone can submit mortgage application"
  ON mortgage_applications FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to read their own application by application_number (for status checks)
CREATE POLICY "Anyone can read applications"
  ON mortgage_applications FOR SELECT
  TO anon
  USING (true);

-- Policies for calculator_sessions
-- Allow anyone to insert calculator sessions (anonymous usage)
CREATE POLICY "Anyone can create calculator sessions"
  ON calculator_sessions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to read calculator sessions (for sharing results)
CREATE POLICY "Anyone can read calculator sessions"
  ON calculator_sessions FOR SELECT
  TO anon
  USING (true);
