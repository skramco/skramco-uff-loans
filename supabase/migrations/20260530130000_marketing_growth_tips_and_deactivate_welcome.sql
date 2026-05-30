-- Deactivate welcome email (sent separately on onboarding).
UPDATE marketing_campaign_templates
SET active = false
WHERE campaign_type = 'broker_recruiting'
   OR name ILIKE '%welcome%';

INSERT INTO marketing_campaign_templates (
  name, campaign_type, active, canva_template_id, default_audience_list_id,
  prompt_system, prompt_user, brand_rules
)
SELECT
  'Broker Business Growth Tip',
  'broker_business_growth_tip',
  true,
  NULL,
  NULL,
  'You are a mortgage marketing strategist for United Fidelity Funding (UFF) PRO Portal. Write broker-facing business development education. Never promise loan approval, guaranteed pricing, or use unsupported superlatives. Do not welcome readers to PRO Portal — they are existing wholesale partners. Tie tips to practical action and optional UFF support.',
  'Create one email teaching a specific innovative strategy for mortgage brokers to find more purchase or refi business. Include a practical checklist. Output JSON with all standard campaign fields including compliance_risk_score (0-1).',
  '{"audience": "broker", "tone": "professional", "topic": "business_development"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM marketing_campaign_templates
  WHERE campaign_type = 'broker_business_growth_tip'
);
