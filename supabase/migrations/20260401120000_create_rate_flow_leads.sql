/*
  # Pre-application rate flow leads (/start)

  Stores anonymous and authenticated submissions from the rate/lead flow
  (intent, ZIP, property type, financial inputs, computed estimates).

  - Append-only inserts from the browser (anon + authenticated).
  - No SELECT for anon/authenticated (read via service role / dashboard).
*/

CREATE TABLE IF NOT EXISTS rate_flow_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_session_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_flow_leads_session ON rate_flow_leads (client_session_id);
CREATE INDEX IF NOT EXISTS idx_rate_flow_leads_created ON rate_flow_leads (created_at DESC);

ALTER TABLE rate_flow_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert rate flow leads"
  ON rate_flow_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(client_session_id)) >= 8
    AND jsonb_typeof(payload) = 'object'
  );

GRANT INSERT ON rate_flow_leads TO anon;
GRANT INSERT ON rate_flow_leads TO authenticated;

COMMENT ON TABLE rate_flow_leads IS 'Pre-application /start flow snapshots; query with service role.';
