$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host "[1/2] Start local PostGIS..."
docker compose -f docker-compose.local.yml up -d

Write-Host "[2/2] Run Spring Boot (profile=docker)..."
$env:SPRING_PROFILES_ACTIVE = "docker"
.\gradlew.bat bootRun
