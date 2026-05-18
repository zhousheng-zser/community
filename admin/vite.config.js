import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    // 与 backend/.env 中 PORT 一致（常见 3001）；勿默认 3000，否则易对上 nginx 的 HTTPS 纯端口而 返回400
    const apiTarget = env.VITE_PROXY_TARGET || 'https://127.0.0.1:3001'
    return {
        plugins: [vue()],
        server: {
            host: true, // 监听 0.0.0.0，否则仅本机可访问，公网 IP:5173 会失败
            port: 5173,
            open: false,
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                    // 目标为 https 且证书非公信/域名不匹配时，否则代理握手失败
                    secure: false
                },
                '/uploads': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: false
                },
                '/img': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: false
                }
            }
        }
    }
})
