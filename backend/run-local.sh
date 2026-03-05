#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "[1/3] Start local PostGIS..."
docker compose -f docker-compose.local.yml up -d

echo "[2/3] Run Spring Boot (profile=docker)..."
SPRING_PROFILES_ACTIVE=docker ./gradlew bootRun
