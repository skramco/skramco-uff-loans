/*
  Daily rate update → same-day market briefing (RSS headlines required).
  Schedule: end of US market day (5:45 PM ET weekdays).
*/

UPDATE marketing_campaign_templates
SET
  name = 'Daily Market Briefing',
  prompt_system = 'Broker Growth Engine for UFF wholesale. Write a same-day market briefing using ONLY today''s RSS headlines in the user prompt (Mortgage News Daily, HousingWire, NMN, MPA, IMF, etc.). Supplement with FRED only when provided and cite observation dates. UFF does NOT publish daily commentary subscriptions. Never invent headlines or rate moves. Never promise UFF pricing.',
  prompt_user = 'Generate the end-of-day wholesale broker market briefing for today. Lead with 3-5 themes from today''s RSS headlines (cite source names). Add broker action steps, lock/pricing conversation guidance, and PRO Portal CTA for pricing scenarios. Output JSON with all standard campaign fields including compliance_risk_score (0-1).'
WHERE campaign_type = 'daily_rate_update';

UPDATE marketing_settings
SET value = '{"enabled": true, "weekdaysOnly": true, "hour": 17, "minute": 45, "timezone": "America/New_York", "campaignType": "daily_rate_update"}'::jsonb,
    updated_at = now()
WHERE key = 'daily_rate_schedule';
