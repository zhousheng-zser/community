#!/bin/bash
# 管理端发布（与 deploy/publish-admin.sh 相同流程，便于在 admin 目录下习惯用法）
#
# 本地开发：./start.sh 或 npm run dev / npm start
#
# 用法：
#   cd /root/community-backend/admin
#   ./restart.sh
#   ./restart.sh --install   # 发布前强制 npm install

set -e
ADMIN_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bash "$ADMIN_DIR/../deploy/publish-admin.sh" "$@"
