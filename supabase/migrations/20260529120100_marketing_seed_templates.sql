/*
  Seed marketing campaign templates and default settings.
  Set `activecampaign_default_list_id` in admin Settings (recommended) or `ACTIVECAMPAIGN_DEFAULT_LIST_ID` via env.
  Admin settings override the env var. Testing list: **34**. Production marketing list: **21** (MarketingList-Wholesale).
*/

INSERT INTO marketing_settings (key, value) VALUES
  ('compliance_risk_threshold', '0.6'::jsonb),
  ('auto_send_trusted_types', '[]'::jsonb),
  ('daily_rate_schedule', '{"enabled": true, "weekdaysOnly": true, "hour": 7, "minute": 30, "timezone": "America/New_York", "campaignType": "daily_rate_update"}'::jsonb),
  ('daily_feature_schedule', '{"enabled": true, "weekdaysOnly": true, "hour": 14, "minute": 0, "timezone": "America/New_York", "campaignType": "pro_portal_feature_spotlight"}'::jsonb),
  ('weekly_newsletter_schedule', '{"enabled": true, "weekday": 5, "hour": 9, "minute": 0, "timezone": "America/New_York", "campaignType": "weekly_broker_newsletter"}'::jsonb),
  ('linkedin_auto_post_enabled', 'false'::jsonb),
  ('linkedin_require_approval', 'true'::jsonb),
  ('activecampaign_default_list_id', '"21"'::jsonb),
  ('performance_history', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Shared brand rules for mortgage marketing guardrails
-- default_audience_list_id: configure via admin Settings or env ACTIVECAMPAIGN_DEFAULT_LIST_ID

INSERT INTO marketing_campaign_templates (name, campaign_type, active, canva_template_id, default_audience_list_id, prompt_system, prompt_user, brand_rules)
VALUES
(
  'Daily Market Update',
  'daily_rate_update',
  true,
  NULL,
  NULL,
  'You are a mortgage marketing copywriter for United Fidelity Funding (UFF) PRO Portal. Write broker-facing content only. Never promise loan approval, guaranteed pricing, or use unsupported superlatives. Avoid "best rate", "guaranteed", "instant approval", "always", "never", "eliminate all". Do not include borrower PII.',
  'Generate a daily market/rate update email for wholesale brokers. Include a brief market commentary, one actionable tip for brokers, and a CTA to log into PRO Portal. Output JSON with: title, internal_summary, email_subject, preview_text, email_html, email_text, linkedin_post, canva_prompt, call_to_action, compliance_risk_score (0-1), audience_notes.',
  '{"audience": "broker", "tone": "professional", "forbiddenPhrases": ["guaranteed", "best rate", "instant approval"]}'::jsonb
),
(
  'PRO Portal Feature Spotlight',
  'pro_portal_feature_spotlight',
  true,
  NULL,
  NULL,
  'You are a mortgage marketing copywriter for United Fidelity Funding (UFF) PRO Portal. Write broker-facing content highlighting PRO Portal features. Never promise loan approval or guaranteed pricing.',
  'Spotlight one PRO Portal feature that helps brokers submit loans faster or track conditions. Output JSON with: title, internal_summary, email_subject, preview_text, email_html, email_text, linkedin_post, canva_prompt, call_to_action, compliance_risk_score (0-1).',
  '{"audience": "broker", "tone": "helpful"}'::jsonb
),
(
  'FHA Streamline Campaign',
  'fha_product_spotlight',
  true,
  NULL,
  NULL,
  'You are a mortgage marketing copywriter for UFF. Write broker-facing FHA product education. Use careful, compliant wording for FHA programs. Never imply guaranteed approval or specific rates without disclaimers. Flag FHA references for compliance review.',
  'Create an FHA Streamline product spotlight for wholesale brokers. Explain eligibility at a high level without specific rate quotes. Output JSON with all campaign fields including compliance_risk_score (0-1).',
  '{"audience": "broker", "complianceFlags": ["FHA"], "requiresApproval": true}'::jsonb
),
(
  'VA IRRRL Campaign',
  'va_product_spotlight',
  true,
  NULL,
  NULL,
  'You are a mortgage marketing copywriter for UFF. Write broker-facing VA product education. Use careful, compliant wording for VA programs including IRRRL. Never imply guaranteed approval.',
  'Create a VA IRRRL product spotlight for wholesale brokers. Output JSON with all campaign fields including compliance_risk_score (0-1).',
  '{"audience": "broker", "complianceFlags": ["VA"], "requiresApproval": true}'::jsonb
),
(
  'Broker Re-Engagement',
  're_engagement_campaign',
  true,
  NULL,
  NULL,
  'You are a mortgage marketing copywriter for UFF PRO Portal. Write a re-engagement email for inactive wholesale brokers. Never use pressure tactics or false urgency about rates.',
  'Create a re-engagement campaign encouraging brokers to return to PRO Portal. Output JSON with all campaign fields.',
  '{"audience": "broker", "tone": "warm"}'::jsonb
),
(
  'Weekend Broker Prep',
  'operational_tip',
  true,
  NULL,
  NULL,
  'You are a mortgage marketing copywriter for UFF. Write a Friday/weekend prep tip for brokers about pipeline management and documentation.',
  'Create an operational tip email helping brokers prepare for the upcoming week. Output JSON with all campaign fields.',
  '{"audience": "broker", "tone": "practical"}'::jsonb
),
(
  'Broker Business Growth Tip',
  'broker_business_growth_tip',
  true,
  NULL,
  NULL,
  'You are a mortgage marketing strategist for United Fidelity Funding (UFF) PRO Portal. Write broker-facing business development education. Never promise loan approval or guaranteed pricing. Do not welcome readers to PRO Portal — they are existing partners.',
  'Create one email teaching an innovative strategy for mortgage brokers to find more business. Output JSON with all campaign fields.',
  '{"audience": "broker", "tone": "professional", "topic": "business_development"}'::jsonb
),
(
  'Weekly Wholesale Update',
  'weekly_broker_newsletter',
  true,
  NULL,
  NULL,
  'You are a mortgage marketing copywriter for UFF. Write a weekly wholesale newsletter aggregating market commentary, product updates, and operational tips. Broker-facing only.',
  'Create a weekly broker newsletter with 3-4 sections. Output JSON with all campaign fields including compliance_risk_score (0-1).',
  '{"audience": "broker", "tone": "informative"}'::jsonb
);
