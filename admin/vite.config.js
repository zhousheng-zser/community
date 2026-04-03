import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const apiTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:3000'
    return {
        plugins: [vue()],
        server: {
            port: 5173,
            open: true,
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true
                }
            }
        }
    }
})
