/*
  Broker Growth Engine — new campaign types + intelligence-focused templates.
*/

INSERT INTO marketing_campaign_templates (name, campaign_type, active, canva_template_id, default_audience_list_id, prompt_system, prompt_user, brand_rules)
SELECT * FROM (VALUES
  (
    'Loan Rescue',
    'loan_rescue',
    true,
    NULL::text,
    NULL::text,
    'Broker Growth Engine: teach how to save a declined or stuck file. Structure problem → failure reason → alternative product → docs → submission → talking points. No guaranteed outcomes.',
    'Create a loan rescue playbook email for wholesale brokers. Use a realistic scenario (e.g. conventional DTI fail → FHA, self-employed → bank statement, denial → VA, investor → DSCR). Include numbered broker action steps. Output JSON with all standard campaign fields.',
    '{"audience": "broker", "complianceFlags": ["loan_rescue"]}'::jsonb
  ),
  (
    'Scenario Desk',
    'scenario_desk',
    true,
    NULL::text,
    NULL::text,
    'Broker Growth Engine: scenario desk analysis for complex borrower files. Educational only — no PII, no fabricated loan numbers.',
    'Present one complex borrower scenario and walk through how an experienced scenario desk would analyze options, documentation, and submission strategy. Output JSON with all standard campaign fields.',
    '{"audience": "broker", "complianceFlags": ["scenario_desk"]}'::jsonb
  ),
  (
    'Broker Growth',
    'broker_growth',
    true,
    NULL::text,
    NULL::text,
    'Broker Growth Engine: business development and referral generation for wholesale brokers. PRO Portal only for pipeline/origination — not marketing tools.',
    'Create a broker growth email: referral partnerships (realtor, CPA, veteran org, investor niche, etc.) with implementable weekly actions. Output JSON with all standard campaign fields.',
    '{"audience": "broker", "tone": "growth"}'::jsonb
  ),
  (
    'Market Intelligence',
    'market_intelligence',
    true,
    NULL::text,
    NULL::text,
    'Broker Growth Engine: tie market conditions to loan opportunities. Use FRED data when provided with dates. UFF is not a research subscription service.',
    'Create market intelligence for brokers: what changed, who to call, which scenarios to mine. Output JSON with all standard campaign fields.',
    '{"audience": "broker", "complianceFlags": ["market_data"]}'::jsonb
  ),
  (
    'Processing & Operations',
    'processing_operations',
    true,
    NULL::text,
    NULL::text,
    'Broker Growth Engine: processing, conditions, submission quality, pipeline speed. PRO Portal: upload, conditions, pipeline only.',
    'Help brokers close loans faster: doc collection, submission packaging, common UW delays to avoid. Output JSON with all standard campaign fields.',
    '{"audience": "broker", "tone": "operational"}'::jsonb
  ),
  (
    'Compliance Guidelines',
    'compliance_guidelines',
    true,
    NULL::text,
    NULL::text,
    'Broker Growth Engine: translate guidelines into practical broker language (FHA, VA, Conventional, occupancy, MI). Compliant — no guarantees.',
    'Explain one guideline topic in broker-friendly terms with actionable submission tips. Output JSON with all standard campaign fields.',
    '{"audience": "broker", "complianceFlags": ["guidelines"]}'::jsonb
  )
) AS v(name, campaign_type, active, canva_template_id, default_audience_list_id, prompt_system, prompt_user, brand_rules)
WHERE NOT EXISTS (
  SELECT 1 FROM marketing_campaign_templates t WHERE t.campaign_type = v.campaign_type
);

UPDATE marketing_campaign_templates
SET prompt_system = 'Broker Growth Engine: actionable broker intelligence (identify, structure, rescue, submit, close, grow). Numbered broker action steps required. Avoid generic marketing fluff. '
  || COALESCE(prompt_system, '')
WHERE prompt_system IS NULL
   OR prompt_system NOT ILIKE '%Broker Growth Engine%';
