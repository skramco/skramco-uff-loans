/*
  Daily market briefing: require today's date in visible copy for recipients.
*/

UPDATE marketing_campaign_templates
SET prompt_user = prompt_user || ' REQUIRED: Include today''s full date (weekday, month, day, year, America/New_York) in title, email_subject, preview_text, and the first line of email_html/email_text so brokers know this is today''s briefing.'
WHERE campaign_type = 'daily_rate_update'
  AND prompt_user NOT ILIKE '%full date%';
