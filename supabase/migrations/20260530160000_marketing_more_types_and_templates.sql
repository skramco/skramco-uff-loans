/*
  Additional campaign types + templates; strengthen PRO Portal accuracy in prompts.
*/

INSERT INTO marketing_campaign_templates (name, campaign_type, active, canva_template_id, default_audience_list_id, prompt_system, prompt_user, brand_rules)
SELECT * FROM (VALUES
  (
    'Conventional Product Spotlight',
    'conventional_product_spotlight',
    true,
    NULL::text,
    NULL::text,
    'You are a mortgage marketing copywriter for UFF wholesale. Write broker-facing Conventional product education. Never promise approval or specific rates without disclaimers. PRO Portal references must match uff.pro/pro-portal only (loan origination — not marketing tools).',
    'Create a Conventional loan product spotlight for wholesale brokers. High-level eligibility and broker talking points only. Output JSON with all standard campaign fields including compliance_risk_score (0-1).',
    '{"audience": "broker", "complianceFlags": ["Conventional"]}'::jsonb
  ),
  (
    'USDA Product Spotlight',
    'usda_product_spotlight',
    true,
    NULL::text,
    NULL::text,
    'You are a mortgage marketing copywriter for UFF wholesale. Write broker-facing USDA product education with compliant program wording. PRO Portal references: uff.pro/pro-portal capabilities only.',
    'Create a USDA loan product spotlight for wholesale brokers. Output JSON with all standard campaign fields including compliance_risk_score (0-1).',
    '{"audience": "broker", "complianceFlags": ["USDA"]}'::jsonb
  ),
  (
    'Non-QM Product Spotlight',
    'non_qm_product_spotlight',
    true,
    NULL::text,
    NULL::text,
    'You are a mortgage marketing copywriter for UFF wholesale. Write broker-facing Non-QM education without overpromising. PRO Portal is for pricing, submission, and pipeline — not marketing integrations.',
    'Create a Non-QM product spotlight for wholesale brokers. Output JSON with all standard campaign fields including compliance_risk_score (0-1).',
    '{"audience": "broker", "complianceFlags": ["Non-QM"]}'::jsonb
  ),
  (
    'Jumbo Product Spotlight',
    'jumbo_product_spotlight',
    true,
    NULL::text,
    NULL::text,
    'You are a mortgage marketing copywriter for UFF wholesale. Write broker-facing jumbo product education. PRO Portal references must be origination features only per uff.pro/pro-portal.',
    'Create a jumbo loan product spotlight for wholesale brokers. Output JSON with all standard campaign fields including compliance_risk_score (0-1).',
    '{"audience": "broker", "complianceFlags": ["Jumbo"]}'::jsonb
  ),
  (
    'Broker Recruiting',
    'broker_recruiting',
    true,
    NULL::text,
    NULL::text,
    'You are a mortgage marketing copywriter for UFF wholesale. Recruit new broker partners. Highlight UFF service and PRO Portal as a loan origination platform (uff.pro/pro-portal). Never invent PRO Portal marketing features.',
    'Create a broker recruiting email for prospective wholesale partners. Mention PRO Portal only for loan submission, pricing, locks, pipeline, and conditions. CTA to get approved or self-sign up. Output JSON with all standard campaign fields.',
    '{"audience": "broker", "tone": "professional"}'::jsonb
  ),
  (
    'Closing Timeline Tip',
    'closing_timeline_tip',
    true,
    NULL::text,
    NULL::text,
    'You are a mortgage marketing copywriter for UFF. Practical closing timeline and communication tips for brokers. PRO Portal mentions: pipeline, conditions, document upload only.',
    'Create an operational email helping brokers manage closing timelines and borrower communication. Output JSON with all standard campaign fields.',
    '{"audience": "broker", "tone": "practical"}'::jsonb
  ),
  (
    'Document Checklist Tip',
    'document_checklist_tip',
    true,
    NULL::text,
    NULL::text,
    'You are a mortgage marketing copywriter for UFF. Help brokers organize loan files. PRO Portal document upload features only — no invented tools.',
    'Create a document checklist / file-stacking tip email for brokers. Reference PRO Portal upload and conditions tracking where relevant. Output JSON with all standard campaign fields.',
    '{"audience": "broker", "tone": "practical"}'::jsonb
  )
) AS v(name, campaign_type, active, canva_template_id, default_audience_list_id, prompt_system, prompt_user, brand_rules)
WHERE NOT EXISTS (
  SELECT 1 FROM marketing_campaign_templates t WHERE t.campaign_type = v.campaign_type
);

-- Tighten existing templates for PRO Portal accuracy
UPDATE marketing_campaign_templates
SET prompt_system = prompt_system || ' PRO Portal is a wholesale loan origination platform only (see uff.pro/pro-portal). Never claim it integrates marketing content, testimonials, social proof, or CRM features.'
WHERE campaign_type IN (
  'broker_business_growth_tip',
  'operational_tip',
  're_engagement_campaign',
  'fha_product_spotlight',
  'va_product_spotlight',
  'compliance_broker_education'
);
