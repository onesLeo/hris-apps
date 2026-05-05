param(
  [string]$ComposeFile = "docker\docker-compose.infra.yml",
  [string]$SqlFile = "docker\bootstrap\dev-bootstrap.sql",
  [string]$PilotOrgSqlFile = "docker\bootstrap\dev-pilot-org.sql"
)

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$composePath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $ComposeFile))
$sqlPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $SqlFile))
$bootstrapTenantId = '11111111-1111-1111-1111-111111111111'

if (-not (Test-Path $sqlPath)) {
  throw "Bootstrap SQL not found at $sqlPath"
}

& docker compose -f $composePath exec -T postgres psql -U hris_user -d hris -tAc "SELECT 1 FROM tenants WHERE id = '$bootstrapTenantId' LIMIT 1" 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Bootstrap already present; skipping."
  exit 0
}

Get-Content -Raw $sqlPath | docker compose -f $composePath exec -T postgres psql -U hris_user -d hris -v ON_ERROR_STOP=1

$pilotOrgSqlPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $PilotOrgSqlFile))
if (Test-Path $pilotOrgSqlPath) {
  Get-Content -Raw $pilotOrgSqlPath | docker compose -f $composePath exec -T postgres psql -U hris_user -d hris -v ON_ERROR_STOP=1
}
