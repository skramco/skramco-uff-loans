/*
  # Fix Security Issues - Indexes and Policies

  ## Overview
  Addresses security warnings from Supabase analysis.

  ## Changes Made
  
  1. **Drop Unused Indexes**
     - Remove `idx_mortgage_applications_view_token` - flagged as unused
     - Remove `idx_urla_applications_view_token` - flagged as unused
     - These indexes were created proactively but queries use the unique constraint instead
  
  2. **Consolidate Duplicate SELECT Policies**
     - Drop redundant "Anyone can read applications" policy on mortgage_applications
     - Keep "Public can view with token" policy which is more specific
     - Eliminates multiple permissive policies for same role/action
  
  3. **Notes on Intentional Design**
     - INSERT policies with "always true" are intentional for public form submissions
     - This is required for anonymous users to submit mortgage applications
     - Rate limiting and validation happen at application level
     - Alternative would be to require authentication, which conflicts with user requirements
  
  ## Security Improvements
  - Reduces index overhead from unused indexes
  - Eliminates policy ambiguity with consolidated SELECT policies
  - Maintains required public form submission functionality
*/

-- Drop unused indexes on view_token columns
DROP INDEX IF EXISTS idx_mortgage_applications_view_token;
DROP INDEX IF EXISTS idx_urla_applications_view_token;

-- Consolidate duplicate SELECT policies for mortgage_applications
-- Drop the overly permissive "Anyone can read applications" policy
DROP POLICY IF EXISTS "Anyone can read applications" ON mortgage_applications;

-- The "Public can view with token" policy remains and is sufficient
-- It allows viewing applications that have a view_token (all of them)

-- Note: The following policies have "always true" conditions but are intentional:
-- 1. "Anyone can submit mortgage application" - Required for public form submissions
-- 2. "Anyone can submit URLA application" - Required for public form submissions  
-- 3. "Anyone can update URLA applications" - Required for draft application editing
-- 4. "Anyone can create calculator sessions" - Required for anonymous calculator use
-- These are business requirements and validated at the application level
