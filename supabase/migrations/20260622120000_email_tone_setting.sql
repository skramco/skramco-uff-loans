-- Global email tone for marketing campaign generation (admin Settings UI).
INSERT INTO marketing_settings (key, value) VALUES
  ('email_tone', '"standard"'::jsonb)
ON CONFLICT (key) DO NOTHING;
