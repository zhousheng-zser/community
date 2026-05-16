#!/usr/bin/env bash
# 将「集市商家管理台」「直约服务商管理台」的 dist 同步到 jshsp2 站点子目录。
# 必须使用本仓库内 admin-market-console / admin-service-provider-console 的构建产物
#（vite base 已设为子路径）；切勿把运营后台 admin/dist 拷到子目录，否则 index.html
# 会引用 /assets/... 导致子路径下白屏。
#
# 用法（在服务器或本机构建后同步到目标机）：
#   cd community-backend && ./deploy/sync-console-dist.sh
#
# 环境变量：
#   MARKET_DST   默认 /www/wwwroot/jshsp2/market-console
#   SP_DST       默认 /www/wwwroot/jshsp2/service-provider-console
#   SKIP_BUILD=1  跳过 npm run build（已手动构建时）
#
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MARKET_SRC="$ROOT/admin-market-console/dist"
SP_SRC="$ROOT/admin-service-provider-console/dist"
MARKET_DST="${MARKET_DST:-/www/wwwroot/jshsp2/market-console}"
SP_DST="${SP_DST:-/www/wwwroot/jshsp2/service-provider-console}"

check_index() {
  local path="$1"
  local needle="$2"
  if ! grep -q "$needle" "$path/index.html" 2>/dev/null; then
    echo "错误: $path/index.html 中未找到「$needle」，可能不是带子路径的构建，请勿部署 admin/dist。"
    exit 1
  fi
}

if [[ "${SKIP_BUILD:-}" != "1" ]]; then
  (cd "$ROOT/admin-market-console" && npm run build)
  (cd "$ROOT/admin-service-provider-console" && npm run build)
fi

if [[ ! -f "$MARKET_SRC/index.html" ]] || [[ ! -f "$SP_SRC/index.html" ]]; then
  echo "缺少 dist，请先构建或去掉 SKIP_BUILD=1"
  exit 1
fi

check_index "$MARKET_SRC" "/market-console/assets/"
check_index "$SP_SRC" "/service-provider-console/assets/"

if id -u www &>/dev/null; then
  CHOWN_USER=www
elif id -u www-data &>/dev/null; then
  CHOWN_USER=www-data
else
  CHOWN_USER=root
fi

sudo mkdir -p "$MARKET_DST" "$SP_DST"
sudo rsync -a --delete "$MARKET_SRC/" "$MARKET_DST/"
sudo rsync -a --delete "$SP_SRC/" "$SP_DST/"
sudo chown -R "${CHOWN_USER}:${CHOWN_USER}" "$MARKET_DST" "$SP_DST"

echo "已同步:"
echo "  $MARKET_SRC -> $MARKET_DST"
echo "  $SP_SRC -> $SP_DST"
echo "请确认 Nginx 已包含 deploy/nginx-market-sp-console-snippet.conf 中的 location，并重载 nginx。"
