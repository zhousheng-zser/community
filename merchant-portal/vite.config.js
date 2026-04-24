import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 与 backend/.env 中 PORT 一致（常见 3001；若 API 在 3000 可设 VITE_PROXY_TARGET）
  const target = env.VITE_PROXY_TARGET || 'http://127.0.0.1:3001'
  return {
    plugins: [vue()],
    server: {
      host: true,
      port: 5175,
      proxy: {
        '/api': { target, changeOrigin: true, secure: false },
        '/uploads': { target, changeOrigin: true, secure: false }
      }
    }
  }
})
