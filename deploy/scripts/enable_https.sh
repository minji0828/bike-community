#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <domain>"
  exit 1
fi

DOMAIN="$1"
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DEPLOY_DIR="${ROOT_DIR}/deploy"
SSL_TEMPLATE="${DEPLOY_DIR}/nginx/conf.d/default-ssl.conf.example"
SSL_CONF="${DEPLOY_DIR}/nginx/conf.d/default-ssl.conf"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"

if [[ ! -f "${SSL_TEMPLATE}" ]]; then
  echo "SSL template not found: ${SSL_TEMPLATE}"
  exit 1
fi

sed "s/YOUR_DOMAIN/${DOMAIN}/g" "${SSL_TEMPLATE}" > "${SSL_CONF}"
docker compose -f "${COMPOSE_FILE}" exec -T nginx nginx -t
docker compose -f "${COMPOSE_FILE}" exec -T nginx nginx -s reload

echo "[deploy] HTTPS config enabled for ${DOMAIN}"
