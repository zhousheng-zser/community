#!/usr/bin/env bash
# 将 admin 构建结果同步到站点根目录（宝塔：与 jshsp2.eds-tech.cn 的 root 一致）
#
# 默认目标：/www/wwwroot/community-admin
# 其他环境请显式设置：export ADMIN_DIST_DST=/你的站点目录
#
# 可选：ADMIN_DIST_SRC=<路径> 指定 dist 来源（默认 <仓库>/admin/dist）
#
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${ADMIN_DIST_SRC:-$ROOT/admin/dist}"
DST="${ADMIN_DIST_DST:-/www/wwwroot/community-admin}"

if [[ ! -f "$SRC/index.html" ]]; then
  echo "缺少 $SRC/index.html，请先: cd admin && npm run build"
  exit 1
fi

sudo mkdir -p "$DST"

if id -u www &>/dev/null; then
  CHOWN_USER=www
elif id -u www-data &>/dev/null; then
  CHOWN_USER=www-data
else
  CHOWN_USER=root
fi

sudo rsync -a --delete "$SRC/" "$DST/"
sudo chown -R "${CHOWN_USER}:${CHOWN_USER}" "$DST"
echo "已同步: $SRC -> $DST"
