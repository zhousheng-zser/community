/**
 * 惠民卡 API 独立进程（默认 3001），与主社区 3000 并存；Nginx 按路径反代见 deploy/nginx-benefit-proxy-snippet.conf
 */
module.exports = {
  apps: [
    {
      name: 'community-benefit-api',
      cwd: __dirname,
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
