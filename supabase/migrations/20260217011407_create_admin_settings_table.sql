/*
  # Create admin settings table

  1. New Tables
    - `admin_settings` (singleton configuration table)
      - `id` (integer, primary key, constrained to 1)
      - `vesta_environment` (text, either 'dev' or 'production')
      - `updated_at` (timestamptz, auto-updated)
  2. Security
    - Enable RLS on `admin_settings` table
    - No public access policies (accessed via service role only from edge functions)
  3. Data
    - Seed with default row set to 'dev' environment
*/

CREATE TABLE IF NOT EXISTS admin_settings (
  id integer PRIMARY KEY DEFAULT 1,
  vesta_environment text NOT NULL DEFAULT 'dev' CHECK (vesta_environment IN ('dev', 'production')),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO admin_settings (id, vesta_environment)
VALUES (1, 'dev')
ON CONFLICT (id) DO NOTHING;
