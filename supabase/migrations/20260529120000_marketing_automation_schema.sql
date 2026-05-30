/*
  Marketing automation schema for UFF / PRO Portal.

  Tables:
    - marketing_campaigns
    - marketing_campaign_metrics
    - marketing_campaign_templates
    - marketing_audit_log
    - marketing_settings
    - marketing_scheduler_runs (idempotency)
    - marketing_linkedin_queue

  Security: RLS enabled, no permissive policies — service role only.
  Storage: marketing-assets bucket (private).
*/

-- ---------------------------------------------------------------------------
-- marketing_campaigns
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'sent', 'failed', 'cancelled')),
  title text,
  internal_summary text,
  email_subject text,
  preview_text text,
  email_html text,
  email_text text,
  linkedin_post text,
  canva_prompt text,
  canva_template_id text,
  canva_design_id text,
  canva_export_url text,
  image_asset_url text,
  activecampaign_campaign_id text,
  activecampaign_message_id text,
  activecampaign_list_id text,
  scheduled_send_at timestamptz,
  sent_at timestamptz,
  approval_required boolean NOT NULL DEFAULT true,
  approved_by uuid,
  approved_at timestamptz,
  compliance_risk_score numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON marketing_campaigns (campaign_type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_scheduled ON marketing_campaigns (scheduled_send_at)
  WHERE scheduled_send_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- marketing_campaign_metrics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns (id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('activecampaign', 'linkedin', 'internal')),
  sends int NOT NULL DEFAULT 0,
  opens int NOT NULL DEFAULT 0,
  clicks int NOT NULL DEFAULT 0,
  unsubscribes int NOT NULL DEFAULT 0,
  bounces int NOT NULL DEFAULT 0,
  spam_complaints int NOT NULL DEFAULT 0,
  linkedin_impressions int NOT NULL DEFAULT 0,
  linkedin_likes int NOT NULL DEFAULT 0,
  linkedin_comments int NOT NULL DEFAULT 0,
  linkedin_shares int NOT NULL DEFAULT 0,
  raw_response jsonb,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_metrics_campaign ON marketing_campaign_metrics (campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_captured ON marketing_campaign_metrics (captured_at DESC);

-- ---------------------------------------------------------------------------
-- marketing_campaign_templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  campaign_type text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  canva_template_id text,
  default_audience_list_id text,
  prompt_system text,
  prompt_user text,
  brand_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_templates_type ON marketing_campaign_templates (campaign_type)
  WHERE active = true;

-- ---------------------------------------------------------------------------
-- marketing_audit_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES marketing_campaigns (id) ON DELETE SET NULL,
  action text NOT NULL,
  actor_id uuid,
  actor_type text NOT NULL CHECK (actor_type IN ('user', 'system', 'scheduler', 'api')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_audit_campaign ON marketing_audit_log (campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_audit_created ON marketing_audit_log (created_at DESC);

-- ---------------------------------------------------------------------------
-- marketing_settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- marketing_scheduler_runs (idempotency)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_scheduler_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  campaign_id uuid REFERENCES marketing_campaigns (id) ON DELETE SET NULL,
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'completed', 'failed', 'skipped')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_scheduler_job ON marketing_scheduler_runs (job_type, created_at DESC);

-- ---------------------------------------------------------------------------
-- marketing_linkedin_queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_linkedin_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'published', 'failed', 'cancelled')),
  post_text text,
  image_url text,
  publish_result jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_linkedin_queue_status ON marketing_linkedin_queue (status);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION marketing_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_marketing_campaigns_updated ON marketing_campaigns;
CREATE TRIGGER trg_marketing_campaigns_updated
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION marketing_set_updated_at();

DROP TRIGGER IF EXISTS trg_marketing_settings_updated ON marketing_settings;
CREATE TRIGGER trg_marketing_settings_updated
  BEFORE UPDATE ON marketing_settings
  FOR EACH ROW EXECUTE FUNCTION marketing_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — service role only (no permissive policies)
-- ---------------------------------------------------------------------------
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_scheduler_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_linkedin_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'marketing_campaigns' AND policyname = 'No direct access to marketing campaigns'
  ) THEN
    CREATE POLICY "No direct access to marketing campaigns"
      ON marketing_campaigns FOR ALL
      USING (false) WITH CHECK (false);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Storage bucket for marketing assets
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing-assets',
  'marketing-assets',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
