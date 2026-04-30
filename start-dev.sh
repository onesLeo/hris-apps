#!/usr/bin/env bash
# HRIS local development startup (Mac/Linux)
# Usage: ./start-dev.sh
# Stop:  ./start-dev.sh --down
set -e

COMPOSE_FILE="docker/docker-compose.infra.yml"

if [[ "${1:-}" == "--down" ]]; then
  echo "Stopping infrastructure..."
  docker compose -f "$COMPOSE_FILE" down
  echo "Done."
  exit 0
fi

echo ""
echo "=== HRIS Dev Environment ==="
echo ""

# 1. Start infrastructure
echo "[1/3] Starting infrastructure (postgres, redis, keycloak, minio)..."
docker compose -f "$COMPOSE_FILE" up -d

# 2. Wait for postgres
echo "[2/3] Waiting for postgres to be ready..."
retries=0
while [[ $retries -lt 30 ]]; do
  container=$(docker compose -f "$COMPOSE_FILE" ps -q postgres 2>/dev/null || true)
  if [[ -n "$container" ]]; then
    health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "")
    [[ "$health" == "healthy" ]] && break
  fi
  sleep 2
  ((retries++))
done
if [[ $retries -ge 30 ]]; then
  echo "ERROR: Postgres did not become healthy in time." >&2
  exit 1
fi
echo "    Postgres is ready."

# 3. Start API + Web concurrently
echo "[3/3] Starting API and Web..."
echo ""
pnpm --filter @hris/api dev &
API_PID=$!
pnpm --filter @hris/web dev &
WEB_PID=$!

echo ""
echo "=== Services ==="
echo "  API       http://localhost:3000"
echo "  Web       http://localhost:3001"
echo "  Keycloak  http://localhost:8080  (admin / admin)"
echo "  Postgres  localhost:5432          (hris_user / password)"
echo "  Redis     localhost:6379"
echo "  MinIO     http://localhost:9000   (minioadmin / minioadmin)"
echo "  Console   http://localhost:9001"
echo "  Use S3   set FILE_STORAGE_DRIVER=s3 in .env.example"
echo ""
echo "Press Ctrl+C to stop API and Web."
echo "Stop infra:  ./start-dev.sh --down"
echo ""

trap "kill $API_PID $WEB_PID 2>/dev/null; exit 0" INT TERM
wait $API_PID $WEB_PID
