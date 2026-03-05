#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DEPLOY_DIR="${ROOT_DIR}/deploy"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ACTIVE_FILE="${DEPLOY_DIR}/runtime/active_backend"
ACTIVE_PROXY_CONF="${DEPLOY_DIR}/nginx/conf.d/active-backend.conf"

mkdir -p "${DEPLOY_DIR}/runtime" "${DEPLOY_DIR}/runtime/frontend/current" "${DEPLOY_DIR}/runtime/challenges" "${DEPLOY_DIR}/runtime/certs"

if [[ ! -f "${ACTIVE_FILE}" ]]; then
  echo "blue" > "${ACTIVE_FILE}"
fi

current="$(cat "${ACTIVE_FILE}")"
if [[ "${current}" == "blue" ]]; then
  next="green"
else
  next="blue"
fi

echo "[deploy] current=${current}, next=${next}"

docker compose -f "${COMPOSE_FILE}" build "backend-${next}"
docker compose -f "${COMPOSE_FILE}" up -d "backend-${next}" nginx

echo "[deploy] waiting for backend-${next} health..."
for i in {1..30}; do
  if docker compose -f "${COMPOSE_FILE}" exec -T nginx \
    wget -qO- "http://backend-${next}:8080/api/v1/health" >/dev/null; then
    echo "[deploy] backend-${next} is healthy"
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "[deploy] backend-${next} health check failed"
    exit 1
  fi
  sleep 2
done

cat > "${ACTIVE_PROXY_CONF}" <<EOF
proxy_pass http://backend-${next}:8080;
proxy_http_version 1.1;
proxy_set_header Host \$host;
proxy_set_header X-Real-IP \$remote_addr;
proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto \$scheme;
EOF

docker compose -f "${COMPOSE_FILE}" exec -T nginx nginx -s reload
echo "${next}" > "${ACTIVE_FILE}"

echo "[deploy] switched active backend to ${next}"
