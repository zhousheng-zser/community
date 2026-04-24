#!/usr/bin/env bash
# 同时启动 backend API + 运营中台 Vite（先 API 就绪再起前端，避免代理 ECONNREFUSED）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-3001}"
(cd "$ROOT/backend" && npm start) &
API_PID=$!
cleanup() { kill "$API_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

ok=0
for _ in $(seq 1 80); do
  if curl -sf "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 0.25
done
if [ "$ok" != "1" ]; then
  echo "[dev-admin-stack] ERROR: API 未在 http://127.0.0.1:${PORT}/ 就绪（请检查 backend/.env 的 PORT 与数据库）。"
  exit 1
fi

cd "$ROOT/admin"
exec npm run dev
