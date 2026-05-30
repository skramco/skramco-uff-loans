# Set marketing automation secrets on Supabase (OpenAI + optional ActiveCampaign)
# Prerequisite: npx supabase login
# Usage: .\scripts\set-marketing-secrets.ps1

$ErrorActionPreference = "Stop"
$projectRef = "pvzqgboffydqeqzeiysx"
$envFile = Join-Path (Join-Path $PSScriptRoot "..") ".env"
$envFile = (Resolve-Path $envFile).Path

function Get-DotEnvValue([string]$name) {
  if (-not (Test-Path $envFile)) { return $null }
  foreach ($line in Get-Content $envFile) {
    if ($line -match "^\s*$name=(.*)$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

$openAiKey = $env:OPENAI_API_KEY
if (-not $openAiKey) {
  $openAiKey = Get-DotEnvValue "OPENAI_API_KEY"
}

if (-not $openAiKey) {
  Write-Error "OPENAI_API_KEY not found. Set `$env:OPENAI_API_KEY or add it to .env"
}

$secretArgs = @(
  "OPENAI_API_KEY=$openAiKey"
)

if ($env:ACTIVECAMPAIGN_API_KEY) {
  $secretArgs += @(
    'ACTIVECAMPAIGN_API_URL=https://uffmortgage.api-us1.com/api/3'
    "ACTIVECAMPAIGN_API_KEY=$($env:ACTIVECAMPAIGN_API_KEY)"
    "ACTIVECAMPAIGN_DEFAULT_LIST_ID=21"
    "ACTIVECAMPAIGN_FROM_EMAIL=noreply@uff.loans"
    "ACTIVECAMPAIGN_FROM_NAME=United Fidelity Funding"
    "ACTIVECAMPAIGN_REPLY_TO=noreply@uff.loans"
  )
}

$fredKey = $env:FRED_API_KEY
if (-not $fredKey) {
  $fredKey = Get-DotEnvValue "FRED_API_KEY"
}
if ($fredKey) {
  $secretArgs += "FRED_API_KEY=$fredKey"
}

if ($env:GITHUB_TOKEN) {
  $secretArgs += @(
    "GITHUB_TOKEN=$($env:GITHUB_TOKEN)"
    "PRO_WEBSITE_GITHUB_REPO=skramco/skramco-uff-pro"
    "PRO_WEBSITE_GITHUB_BRANCH=main"
    "PRO_LANDING_BASE_URL=https://www.uff.pro"
  )
} else {
  $ghToken = Get-DotEnvValue "GITHUB_TOKEN"
  if ($ghToken) {
    $secretArgs += @(
      "GITHUB_TOKEN=$ghToken"
      "PRO_WEBSITE_GITHUB_REPO=skramco/skramco-uff-pro"
      "PRO_WEBSITE_GITHUB_BRANCH=main"
      "PRO_LANDING_BASE_URL=https://www.uff.pro"
    )
  }
}

Write-Host "Setting secrets on project $projectRef ..."
npx supabase secrets set @secretArgs --project-ref $projectRef
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to set secrets. Run: npx supabase login"
}

Write-Host ""
Write-Host "Done. Edge functions pick up new secrets automatically (no redeploy required)."
Write-Host "Retry Generate Campaign in /admin/marketing."
