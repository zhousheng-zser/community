/**
 * 惠民卡专用 Node 进程（与线上一体化社区 API 分离时使用）
 * 启动：cd backend && pm2 start ecosystem.benefit.pm2.cjs
 * 默认端口 3001；需在 Nginx 将 /api/v1/jd|pdd|benefit 反代到此端口（见 deploy/nginx-benefit-proxy-snippet.conf）
 */
module.exports = {
  apps: [
    {
      name: 'community-benefit',
      script: 'src/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
