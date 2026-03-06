#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DEPLOY_DIR="${ROOT_DIR}/deploy"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"

docker compose -f "${COMPOSE_FILE}" build frontend-web
docker compose -f "${COMPOSE_FILE}" up -d frontend-web nginx

echo "[deploy] waiting for frontend-web health..."
for i in {1..30}; do
  if docker compose -f "${COMPOSE_FILE}" exec -T nginx \
    wget -qO- "http://frontend-web:3000/api/health" >/dev/null; then
    echo "[deploy] frontend-web is healthy"
    exit 0
  fi

  if [[ $i -eq 30 ]]; then
    echo "[deploy] frontend-web health check failed"
    exit 1
  fi

  sleep 2
done
