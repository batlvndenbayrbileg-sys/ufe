#!/usr/bin/env bash
# Хийе local dev bootstrap.
# Usage: bash scripts/dev.sh   (or: pnpm dev after services are up)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "▸ Хийе dev bootstrap"

if [ ! -f .env.local ]; then
  echo "  · creating .env.local from .env.example"
  cp .env.example .env.local
fi

if command -v docker >/dev/null 2>&1; then
  echo "  · starting docker services (postgres, redis, minio)"
  docker compose up -d
else
  echo "  ! docker not found — skipping services (Tier-1 MVP can run without them)"
fi

echo "  · installing dependencies"
pnpm install

echo "  · starting dev servers (turbo)"
exec pnpm dev
