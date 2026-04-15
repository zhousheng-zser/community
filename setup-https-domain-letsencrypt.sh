#!/usr/bin/env bash
# 域名 + Let’s Encrypt（推荐真机）：Nginx 监听 443（及 80 跳转），反代到 Node :3001
#
# 前置（阿里云 DNS）：
#   在「域名解析」为 @（主机记录为空或 @）添加 A 记录 → 服务器公网 IP（如 114.55.167.14）
#   生效后再执行本脚本。
#
# 前置（防火墙 / 安全组）：放行 TCP 80、443
#
# 用法（服务器 root）：
#   export CERTBOT_EMAIL=你的邮箱@example.com
#   export DOMAIN=ancientscrolllibrary.cn   # 可选，默认此域名
#   export BACKEND_DIR=/root/community-backend/backend
#   bash deploy/setup-https-domain-letsencrypt.sh
#
set -euo pipefail

DOMAIN="${DOMAIN:-ancientscrolllibrary.cn}"
BACKEND_DIR="${BACKEND_DIR:-/root/community-backend/backend}"
EMAIL="${CERTBOT_EMAIL:-}"

if [[ -z "$EMAIL" ]]; then
  echo ">>> 请设置环境变量 CERTBOT_EMAIL=你的邮箱（Let's Encrypt 注册用）"
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo ">>> 请先安装 nginx"
  exit 1
fi

# Node 与 Nginx 分工：Node 仅监听 3001（与 IP+自签方案一致）
if grep -q '^PORT=3000' "$BACKEND_DIR/.env" 2>/dev/null; then
  sed -i 's/^PORT=3000/PORT=3001/' "$BACKEND_DIR/.env"
  echo ">>> 已将 $BACKEND_DIR/.env 中 PORT 改为 3001"
fi

if [[ -x "$BACKEND_DIR/restart.sh" ]]; then
  (cd "$BACKEND_DIR" && bash restart.sh)
else
  echo ">>> 未找到 $BACKEND_DIR/restart.sh，请先部署 Node"
  exit 1
fi

# 释放 3000 上可能残留的旧进程（与 setup-https-3000-ip.sh 逻辑一致）
if ss -tlnp 2>/dev/null | grep -q ':3000 ' && ! ss -tlnp 2>/dev/null | grep ':3000 ' | grep -q nginx; then
  if command -v fuser >/dev/null 2>&1; then
    fuser -k 3000/tcp 2>/dev/null || true
  fi
  sleep 1
fi

apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx

NGINX_INIT="/etc/nginx/sites-available/community-${DOMAIN}-http.conf"
cat > "$NGINX_INIT" <<EOF
# 临时 HTTP：供 certbot 签发证书；签发后会自动改为 80→443 跳转并配置 SSL
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

ln -sf "$NGINX_INIT" "/etc/nginx/sites-enabled/community-${DOMAIN}-http.conf"

nginx -t
systemctl reload nginx

certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive --redirect

echo ">>> 本机验收（应 200，且 curl 不加 -k）："
curl -s -o /dev/null -w "https://${DOMAIN}/api/v1/market/shops -> %{http_code}\n" \
  "https://${DOMAIN}/api/v1/market/shops?page=1&page_size=1"

echo ">>> 完成。微信后台 request / downloadFile 填：https://${DOMAIN}"
echo ">>> 小程序 utils/config.js 中 baseUrl / imageBaseUrl 须为 https://${DOMAIN}（与上一致）"
