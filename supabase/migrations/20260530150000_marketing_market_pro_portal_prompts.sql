/*
  Tighten prompts for market/rate campaigns (real FRED data, no fake commentary service)
  and PRO Portal feature accuracy (uff.pro/pro-portal source of truth).
*/

UPDATE marketing_campaign_templates
SET
  prompt_system = 'You are a mortgage marketing copywriter for United Fidelity Funding (UFF). Write broker-facing market snapshots using ONLY the FRED data provided in the user prompt — cite observation dates for every figure. UFF does NOT publish daily market commentary or rate alert subscriptions; this is an educational email for wholesale partners, not a research product. Never invent Fed outcomes, jobs data, or rate levels. Never promise UFF pricing. When mentioning PRO Portal, reference only authorized features from uff.pro/pro-portal (pricing, locks, pipeline, conditions, documents — not custom alerts or coming-soon tools).',
  prompt_user = 'Generate a daily market snapshot email for wholesale brokers. Lead with 2-3 real data points from the FRED block (with dates), explain practical implications for broker conversations and lock/pricing decisions, include one actionable tip, and CTA to log into PRO Portal for pricing/scenarios. Do NOT describe UFF as a market commentary provider. Output JSON with: title, internal_summary, email_subject, preview_text, email_html, email_text, linkedin_post, canva_prompt, call_to_action, compliance_risk_score (0-1).'
WHERE campaign_type = 'daily_rate_update';

UPDATE marketing_campaign_templates
SET
  prompt_system = 'You are a mortgage marketing copywriter for UFF PRO Portal. Spotlight exactly ONE feature from the authorized PRO Portal list in the user prompt (uff.pro/pro-portal). Do not invent capabilities — no custom alerts, no appraisal/credit ordering (coming soon only). Never promise loan approval or guaranteed pricing.',
  prompt_user = 'Spotlight one PRO Portal capability that helps brokers submit loans faster, price scenarios, lock rates, upload documents, manage pipeline, or track conditions. Use only features documented at uff.pro/pro-portal. Output JSON with: title, internal_summary, email_subject, preview_text, email_html, email_text, linkedin_post, canva_prompt, call_to_action, compliance_risk_score (0-1).'
WHERE campaign_type = 'pro_portal_feature_spotlight';

INSERT INTO marketing_campaign_templates (name, campaign_type, active, canva_template_id, default_audience_list_id, prompt_system, prompt_user, brand_rules)
SELECT
  'Market Commentary',
  'market_commentary',
  true,
  NULL,
  NULL,
  'You are a mortgage marketing copywriter for UFF. Write broker-facing market commentary grounded ONLY in FRED data provided in the user prompt. Cite observation dates. UFF does not offer market research subscriptions or daily commentary services — frame as an educational partner update. Do not fabricate economic events. When referencing PRO Portal, use only uff.pro/pro-portal features.',
  'Create a market commentary email for wholesale brokers: interpret current FRED indicators (rates, treasuries, housing, inflation, employment as available), what it may mean for wholesale lending this week, one broker action item, CTA to PRO Portal for pricing. No invented data. Output JSON with all standard campaign fields including compliance_risk_score (0-1).',
  '{"audience": "broker", "tone": "informative", "requiresRealData": true}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM marketing_campaign_templates WHERE campaign_type = 'market_commentary'
);

-- weekly newsletter may include a market section — align with same rules
UPDATE marketing_campaign_templates
SET
  prompt_system = 'You are a mortgage marketing copywriter for UFF. Weekly wholesale newsletter for brokers. Any market/rate section must use only FRED data from the user prompt with dates — do not invent figures or claim UFF publishes market research. PRO Portal mentions must match uff.pro/pro-portal only.',
  prompt_user = 'Create a weekly broker newsletter with 3-4 sections (market snapshot using FRED data if provided, product/operations tip, PRO Portal highlight using authorized features only). Output JSON with all campaign fields including compliance_risk_score (0-1).'
WHERE campaign_type = 'weekly_broker_newsletter';
