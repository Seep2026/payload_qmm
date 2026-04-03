#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3000}"
PUBLIC_HOST="${PUBLIC_HOST:-}"

echo "QMM_CMS: local health checks"
curl -sS -o /dev/null -w "QMM_CMS: / -> %{http_code} %{time_total}s\n" "http://${HOST}:${PORT}/"
curl -sS -o /dev/null -w "QMM_CMS: /stories -> %{http_code} %{time_total}s\n" "http://${HOST}:${PORT}/stories"
curl -sS -o /dev/null -w "QMM_CMS: /admin -> %{http_code} %{time_total}s\n" "http://${HOST}:${PORT}/admin"

if [[ -n "$PUBLIC_HOST" ]]; then
  echo "QMM_CMS: public health checks for ${PUBLIC_HOST}"
  curl -sS -o /dev/null -w "QMM_CMS: https://${PUBLIC_HOST}/ -> %{http_code} %{time_total}s\n" "https://${PUBLIC_HOST}/"
fi

echo "QMM_CMS: health checks completed"
