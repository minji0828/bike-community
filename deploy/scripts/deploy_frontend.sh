#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <frontend-dist-tar.gz>"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DEPLOY_DIR="${ROOT_DIR}/deploy"
ARCHIVE_PATH="$1"
TARGET_BASE="${DEPLOY_DIR}/runtime/frontend"
RELEASE_DIR="${TARGET_BASE}/releases/$(date +%Y%m%d_%H%M%S)"
CURRENT_LINK="${TARGET_BASE}/current"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"

mkdir -p "${RELEASE_DIR}" "${TARGET_BASE}/releases"

tar -xzf "${ARCHIVE_PATH}" -C "${RELEASE_DIR}"
ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"

docker compose -f "${COMPOSE_FILE}" up -d nginx
docker compose -f "${COMPOSE_FILE}" exec -T nginx nginx -s reload

echo "[deploy] frontend deployed to ${RELEASE_DIR}"
