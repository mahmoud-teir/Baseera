# Deploys Baseerah's Edge Functions, their secrets and the Auth settings to the Supabase project.
# Run from the repo root in a terminal where `npx supabase login` succeeded:
#   & .\tools\deploy-supabase.ps1
# Functions are bundled server-side (no Docker needed). Migrations are applied separately (`npx supabase db push`).
$ErrorActionPreference = 'Stop'
$ref = 'yxqdquynlgfbxyultsux'

Write-Host '1/3  Edge Functions' -ForegroundColor Green
npx supabase functions deploy --workdir backend --project-ref $ref --use-api
if ($LASTEXITCODE -ne 0) { throw 'functions deploy failed' }

Write-Host '2/3  Function secrets (REPORT_SALT hashes reporter IPs for rate limiting)' -ForegroundColor Green
$salt = -join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
npx supabase secrets set --workdir backend --project-ref $ref "REPORT_SALT=$salt"
if ($LASTEXITCODE -ne 0) { throw 'secrets set failed' }

Write-Host '3/3  Auth settings from backend/supabase/config.toml (site URL and redirect URLs). Review the diff before confirming.' -ForegroundColor Green
npx supabase config push --workdir backend --project-ref $ref
if ($LASTEXITCODE -ne 0) { throw 'config push failed' }

Write-Host 'Done. Deployed functions:' -ForegroundColor Green
npx supabase functions list --project-ref $ref
