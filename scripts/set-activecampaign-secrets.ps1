# Set ActiveCampaign secrets on Supabase (UFF marketing automation)
# Run after: npx supabase login
# Usage: .\scripts\set-activecampaign-secrets.ps1

$projectRef = "pvzqgboffydqeqzeiysx"

npx supabase secrets set `
  ACTIVECAMPAIGN_API_URL="https://uffmortgage.api-us1.com/api/3" `
  ACTIVECAMPAIGN_API_KEY="$env:ACTIVECAMPAIGN_API_KEY" `
  ACTIVECAMPAIGN_DEFAULT_LIST_ID="21" `
  ACTIVECAMPAIGN_TIMEZONE="America/Los_Angeles" `
  ACTIVECAMPAIGN_FROM_EMAIL="noreply@uff.loans" `
  ACTIVECAMPAIGN_FROM_NAME="United Fidelity Funding" `
  ACTIVECAMPAIGN_REPLY_TO="noreply@uff.loans" `
  --project-ref $projectRef

Write-Host "Done. Redeploy: npx supabase functions deploy marketing-automation marketing-cron --project-ref $projectRef"
