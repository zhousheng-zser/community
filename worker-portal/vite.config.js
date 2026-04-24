import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_PROXY_TARGET || 'http://127.0.0.1:3000'
  return {
    plugins: [vue()],
    server: {
      port: 5174,
      proxy: {
        '/api': { target, changeOrigin: true, secure: false },
        '/uploads': { target, changeOrigin: true, secure: false }
      }
    }
  }
})
