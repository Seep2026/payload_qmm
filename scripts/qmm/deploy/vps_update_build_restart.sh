#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SERVICE_NAME="${SERVICE_NAME:-qmmee}"
BRANCH="${BRANCH:-main}"

cd "$ROOT_DIR"

echo "QMM_CMS: syncing latest code from origin/$BRANCH"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "QMM_CMS: running rebuild"
bash scripts/qmm/deploy/vps_rebuild.sh

echo "QMM_CMS: restarting service $SERVICE_NAME"
systemctl daemon-reload
systemctl restart "$SERVICE_NAME"
systemctl --no-pager -l status "$SERVICE_NAME"

echo "QMM_CMS: done"
