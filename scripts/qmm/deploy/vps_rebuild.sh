#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"

export PAYLOAD_DATABASE="${PAYLOAD_DATABASE:-sqlite}"
export SQLITE_URL="${SQLITE_URL:-file:./payload-qmm.db}"
export QMM_SKIP_BOOTSTRAP_ON_INIT="${QMM_SKIP_BOOTSTRAP_ON_INIT:-true}"
export NODE_ENV="${NODE_ENV:-production}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536 --no-deprecation}"
export PORT="${PORT:-3000}"

echo "QMM_CMS: rebuild started"
echo "QMM_CMS: ROOT_DIR=$ROOT_DIR"
echo "QMM_CMS: PAYLOAD_DATABASE=$PAYLOAD_DATABASE SQLITE_URL=$SQLITE_URL"

pnpm install --frozen-lockfile
pnpm run qmm:db:status:vps
pnpm run build:vps
pnpm run build:app

echo "QMM_CMS: rebuild completed"
