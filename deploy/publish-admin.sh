#!/usr/bin/env bash
# 管理后台一键发布：依赖安装（可选）→ 生产构建 → 同步 dist → 校验并重载 Nginx
#
# 用法（在仓库内任意目录均可）：
#   bash deploy/publish-admin.sh
#   bash deploy/publish-admin.sh --install   # 发布前强制 npm install（依赖变更时用）
#
# 环境变量（可选）：
#   ADMIN_DIST_SRC  默认 <仓库>/admin/dist
#   ADMIN_DIST_DST  默认 /www/wwwroot/community-admin（宝塔站点根）；其他机器请 export 成你的目录
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADMIN="$ROOT/admin"
SYNC_SCRIPT="$ROOT/deploy/sync-admin-dist.sh"

FORCE_INSTALL=0
if [[ "${1:-}" == "--install" ]]; then
  FORCE_INSTALL=1
  shift
fi
if [[ $# -gt 0 ]]; then
  echo "用法: $0 [--install]"
  exit 1
fi

if [[ ! -f "$ADMIN/package.json" ]]; then
  echo ">>> 未找到 $ADMIN/package.json"
  exit 1
fi
if [[ ! -f "$SYNC_SCRIPT" ]]; then
  echo ">>> 未找到 $SYNC_SCRIPT"
  exit 1
fi

cd "$ADMIN"

if [[ "$FORCE_INSTALL" -eq 1 ]]; then
  echo ">>> npm install（--install）..."
  npm install
elif [[ ! -d node_modules ]]; then
  echo ">>> 未检测到 node_modules，正在 npm install..."
  npm install
fi

echo ">>> 生产构建（读取 .env.production）..."
npm run build

echo ">>> 同步静态文件到 Nginx 目录..."
sudo bash "$SYNC_SCRIPT"

echo ">>> 校验并重载 Nginx..."
if sudo nginx -t; then
  sudo systemctl reload nginx
  echo ">>> 发布完成。"
  echo "    静态目录默认: /www/wwwroot/community-admin（可用 ADMIN_DIST_DST 覆盖）"
  echo "    验证: curl -sI https://你的域名/ | head -5"
  echo "    若前有 CDN：建议刷新 / 与 /index.html 缓存。"
else
  echo ">>> nginx -t 失败，请检查配置后执行: sudo nginx -t && sudo systemctl reload nginx"
  exit 1
fi
