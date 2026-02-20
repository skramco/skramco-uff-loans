/*
  # Fix Security Issues

  ## Changes Made
  
  1. **Drop Unused Indexes**
     - Removes all unused indexes that were flagged by security analysis
     - Indexes on `mortgage_applications`: application_number, email, status, created_at
     - Indexes on `calculator_sessions`: session_type, created_at
     - Indexes on `urla_applications`: application_number, email, status, created_at, submitted_at
     - These indexes were created proactively but are not currently being used by any queries
  
  2. **Fix Function Search Path**
     - Updates `update_urla_updated_at` function with secure search path
     - Sets `search_path` to empty string to prevent search path manipulation attacks
     - Uses fully qualified table names to ensure security
  
  ## Security Improvements
  - Reduces database bloat from unused indexes
  - Prevents potential search path injection attacks
  - Follows PostgreSQL security best practices
*/

-- Drop unused indexes on mortgage_applications
DROP INDEX IF EXISTS idx_mortgage_applications_number;
DROP INDEX IF EXISTS idx_mortgage_applications_email;
DROP INDEX IF EXISTS idx_mortgage_applications_status;
DROP INDEX IF EXISTS idx_mortgage_applications_created;

-- Drop unused indexes on calculator_sessions
DROP INDEX IF EXISTS idx_calculator_sessions_type;
DROP INDEX IF EXISTS idx_calculator_sessions_created;

-- Drop unused indexes on urla_applications
DROP INDEX IF EXISTS idx_urla_applications_number;
DROP INDEX IF EXISTS idx_urla_applications_email;
DROP INDEX IF EXISTS idx_urla_applications_status;
DROP INDEX IF EXISTS idx_urla_applications_created;
DROP INDEX IF EXISTS idx_urla_applications_submitted;

-- Recreate the update function with secure search path
CREATE OR REPLACE FUNCTION update_urla_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';
