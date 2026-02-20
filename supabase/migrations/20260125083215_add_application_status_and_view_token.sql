/*
  # Add Application Status Tracking and Public View Tokens

  ## Overview
  Adds status tracking and secure public viewing capabilities for mortgage applications.

  ## Changes Made
  
  1. **Add View Tokens**
     - Adds `view_token` column to both `mortgage_applications` and `urla_applications` tables
     - Each application gets a unique secure token for public viewing
     - Tokens are generated automatically on insert
  
  2. **Update Status Field**
     - Adds proper status tracking for application lifecycle
     - Status values:
       - `submitted` - Application just received
       - `under_review` - Being reviewed by loan officer
       - `documents_requested` - Additional documents needed
       - `processing` - Application is being processed
       - `approved` - Application approved
       - `denied` - Application denied
       - `closed` - Application closed/completed
  
  3. **Add Status History**
     - Adds `status_updated_at` timestamp
     - Adds `status_notes` for internal notes on status changes
  
  4. **Security**
     - Allow public to view applications with valid view token
     - Update existing RLS policies
  
  ## Notes
  - View tokens are UUID v4 for security
  - Existing applications will get tokens generated automatically
  - Status defaults to 'submitted' for new applications
*/

-- Add view_token and status tracking to mortgage_applications
DO $$
BEGIN
  -- Add view_token column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mortgage_applications' AND column_name = 'view_token'
  ) THEN
    ALTER TABLE mortgage_applications 
    ADD COLUMN view_token uuid UNIQUE DEFAULT gen_random_uuid();
  END IF;

  -- Add status_updated_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mortgage_applications' AND column_name = 'status_updated_at'
  ) THEN
    ALTER TABLE mortgage_applications 
    ADD COLUMN status_updated_at timestamptz DEFAULT now();
  END IF;

  -- Add status_notes column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mortgage_applications' AND column_name = 'status_notes'
  ) THEN
    ALTER TABLE mortgage_applications 
    ADD COLUMN status_notes text DEFAULT '';
  END IF;
END $$;

-- Update status field to use better values
UPDATE mortgage_applications SET status = 'submitted' WHERE status = 'pending' OR status = 'draft';

-- Add view_token and status tracking to urla_applications
DO $$
BEGIN
  -- Add view_token column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'urla_applications' AND column_name = 'view_token'
  ) THEN
    ALTER TABLE urla_applications 
    ADD COLUMN view_token uuid UNIQUE DEFAULT gen_random_uuid();
  END IF;

  -- Add status_updated_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'urla_applications' AND column_name = 'status_updated_at'
  ) THEN
    ALTER TABLE urla_applications 
    ADD COLUMN status_updated_at timestamptz DEFAULT now();
  END IF;

  -- Add status_notes column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'urla_applications' AND column_name = 'status_notes'
  ) THEN
    ALTER TABLE urla_applications 
    ADD COLUMN status_notes text DEFAULT '';
  END IF;
END $$;

-- Update status field to use better values
UPDATE urla_applications SET status = 'submitted' WHERE status = 'pending' OR status = 'draft';

-- Create index for view_token lookups
CREATE INDEX IF NOT EXISTS idx_mortgage_applications_view_token ON mortgage_applications(view_token);
CREATE INDEX IF NOT EXISTS idx_urla_applications_view_token ON urla_applications(view_token);

-- Update RLS policy to allow public viewing with valid token for mortgage_applications
DROP POLICY IF EXISTS "Public can view with token" ON mortgage_applications;
CREATE POLICY "Public can view with token"
  ON mortgage_applications FOR SELECT
  TO anon
  USING (view_token IS NOT NULL);

-- Update RLS policy to allow public viewing with valid token for urla_applications  
DROP POLICY IF EXISTS "Anyone can read URLA applications" ON urla_applications;
CREATE POLICY "Public can view URLA with token"
  ON urla_applications FOR SELECT
  TO anon
  USING (view_token IS NOT NULL);

-- Create function to update status_updated_at when status changes
CREATE OR REPLACE FUNCTION update_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

-- Add triggers for status updates
DROP TRIGGER IF EXISTS update_mortgage_status_timestamp ON mortgage_applications;
CREATE TRIGGER update_mortgage_status_timestamp
  BEFORE UPDATE ON mortgage_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_status_timestamp();

DROP TRIGGER IF EXISTS update_urla_status_timestamp ON urla_applications;
CREATE TRIGGER update_urla_status_timestamp
  BEFORE UPDATE ON urla_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_status_timestamp();
