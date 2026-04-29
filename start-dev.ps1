# HRIS local development startup
# Usage: .\start-dev.ps1
# Stops everything: .\start-dev.ps1 -Down

param([switch]$Down)

$ComposeFile = "docker\docker-compose.infra.yml"

if ($Down) {
  Write-Host "Stopping infrastructure..."
  docker compose -f $ComposeFile down
  Write-Host "Done."
  exit 0
}

Write-Host ""
Write-Host "=== HRIS Dev Environment ==="
Write-Host ""

# 1. Start infrastructure
Write-Host "[1/3] Starting infrastructure (postgres, redis, keycloak)..."
docker compose -f $ComposeFile up -d
if ($LASTEXITCODE -ne 0) {
  Write-Error "Docker failed to start. Is Docker Desktop running?"
  exit 1
}

# 2. Wait for postgres to be healthy
Write-Host "[2/3] Waiting for postgres to be ready..."
$retries = 0
while ($retries -lt 30) {
  $containerId = docker compose -f $ComposeFile ps -q postgres 2>$null
  if ($containerId) {
    $health = docker inspect --format="{{.State.Health.Status}}" $containerId 2>$null
    if ($health -eq "healthy") { break }
  }
  Start-Sleep -Seconds 2
  $retries++
}
if ($retries -ge 30) {
  Write-Error "Postgres did not become healthy in time."
  exit 1
}
Write-Host "    Postgres is ready."

# 3. Open API + Web in separate terminals
Write-Host "[3/3] Starting API and Web..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Write-Host 'API server'; pnpm --filter @hris/api dev"
Start-Sleep -Seconds 1
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Write-Host 'Web server'; pnpm --filter @hris/web dev"

Write-Host ""
Write-Host "=== Services ==="
Write-Host "  API       http://localhost:3000"
Write-Host "  Web       http://localhost:3001"
Write-Host "  Keycloak  http://localhost:8080  (admin / admin)"
Write-Host "  Postgres  localhost:5432          (hris_user / password)"
Write-Host "  Redis     localhost:6379"
Write-Host ""
Write-Host "Stop infra:  .\start-dev.ps1 -Down"
Write-Host ""
