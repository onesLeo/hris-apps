# HRIS local development startup
# Usage: .\start-dev.ps1
# Stops everything: .\start-dev.ps1 -Down
# Bypass port cleanup: .\start-dev.ps1 -SkipPortCleanup
# Skip DB bootstrap: .\start-dev.ps1 -SkipBootstrap

param(
  [switch]$Down,
  [switch]$SkipPortCleanup,
  [switch]$SkipBootstrap
)

$ComposeFile = "docker\docker-compose.infra.yml"
$RepoRoot = $PSScriptRoot
$NestCmd = Join-Path $RepoRoot 'apps\api\node_modules\.bin\nest.CMD'
$NextCmd = Join-Path $RepoRoot 'apps\web\node_modules\.bin\next.CMD'

function Get-ProcessIdOnPort([int]$Port) {
  $pattern = [regex]::Escape(":$Port") + '\s+\S+\s+LISTENING\s+(\d+)\s*$'
  $lines = netstat -ano -p tcp 2>$null | Select-String -Pattern $pattern -ErrorAction SilentlyContinue
  foreach ($line in $lines) {
    if ($line.Matches.Count -gt 0) {
      return [int]$line.Matches[0].Groups[1].Value
    }
  }

  return $null
}

function Stop-Ports([int[]]$Ports) {
  foreach ($port in $Ports) {
    $processId = Get-ProcessIdOnPort -Port $port
    if ($processId) {
      Write-Host "    Killing process $processId on port $port"
      taskkill /F /T /PID $processId | Out-Null
    }
  }
}

function Invoke-DevBootstrap {
  $bootstrapScript = Join-Path $PSScriptRoot 'scripts/bootstrap-dev-db.ps1'
  if (-not (Test-Path $bootstrapScript)) {
    throw "Bootstrap script not found at $bootstrapScript"
  }

  Write-Host "    Bootstrapping foundational dev schema and seed data..."
  & $bootstrapScript -ComposeFile $ComposeFile
  if ($LASTEXITCODE -ne 0) {
    throw "Dev bootstrap failed."
  }
}

if ($Down) {
  Write-Host "Stopping infrastructure..."
  docker compose -f $ComposeFile down

  Write-Host "Killing any Node processes on ports 3000 and 3001..."
  Stop-Ports -Ports @(3000, 3001)

  Write-Host "Done."
  exit 0
}

Write-Host ""
Write-Host "=== HRIS Dev Environment ==="
Write-Host ""

# Kill any leftover processes from previous runs
Write-Host "[0/3] Clearing ports 3000 and 3001..."
if ($SkipPortCleanup) {
  Write-Host "    Skipping port cleanup."
} else {
  Stop-Ports -Ports @(3000, 3001)
}

# 1. Start infrastructure
Write-Host "[1/3] Starting infrastructure (postgres, redis, keycloak, minio)..."
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

if (-not $SkipBootstrap) {
  Invoke-DevBootstrap
} else {
  Write-Host "    Skipping bootstrap."
}

# 3. Open API + Web in separate terminals
Write-Host "[3/3] Starting API and Web..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$RepoRoot\apps\api'; Write-Host 'API server'; & '$NestCmd' start --watch"
Start-Sleep -Seconds 1
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$RepoRoot\apps\web'; Write-Host 'Web server'; & '$NextCmd' dev -p 3001"

Write-Host ""
Write-Host "=== Services ==="
Write-Host "  API       http://localhost:3000"
Write-Host "  Web       http://localhost:3001"
Write-Host "  Keycloak  http://localhost:8080  (admin / admin)"
Write-Host "  Postgres  localhost:5432          (hris_user / password)"
Write-Host "  Redis     localhost:6379"
Write-Host "  MinIO     http://localhost:9000   (minioadmin / minioadmin)"
Write-Host "  Console   http://localhost:9001"
Write-Host "  Use S3   set FILE_STORAGE_DRIVER=s3 in .env.example"
Write-Host ""
Write-Host "Stop infra:  .\start-dev.ps1 -Down"
Write-Host ""
