import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_PROXY_TARGET || 'http://127.0.0.1:3001'
  return {
    plugins: [vue()],
    server: {
      /** 监听 0.0.0.0；终端里「Network: http://172.x.x.x」多为内网 IP，仅同 VPC/同机可访问 */
      host: '0.0.0.0',
      port: 5176,
      strictPort: true,
      /** 开发环境：避免非 localhost 的 Host 被拒绝（生产勿照搬） */
      allowedHosts: true,
      proxy: {
        '/api': { target, changeOrigin: true, secure: false },
        '/uploads': { target, changeOrigin: true, secure: false }
      }
    }
  }
})
