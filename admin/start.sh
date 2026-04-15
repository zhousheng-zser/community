#!/bin/bash
# 在 admin 目录直接启动 Vite 开发服务（不走 Nginx 构建发布）
# 用法：cd /root/community-backend/admin && ./start.sh
# 首次请先：npm install
# API 由 vite.config.js 代理：浏览器请求 /api → VITE_PROXY_TARGET（见 .env.development）

set -e
cd "$(dirname "$0")"
exec npm run start
