import axios from 'axios'

// 开发默认 /api/v1（经 Vite 代理到 backend:3000）；生产在 .env.production 写完整 https 域名
const baseURL = import.meta.env.VITE_API_BASE || '/api/v1'

const request = axios.create({
  baseURL,
  timeout: 20000
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res && typeof res.code === 'number' && res.code !== 200) {
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    const status = error.response && error.response.status
    if (status === 401) {
      localStorage.removeItem('admin_token')
      if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
        window.location.assign('/login')
      }
    }
    const isNetwork =
      !error.response &&
      (error.code === 'ERR_NETWORK' ||
        (error.message && String(error.message).toLowerCase().includes('network')))
    const hint = isNetwork
      ? '无法连接后端：请在项目 backend 目录执行 npm start（默认端口 3000），并确认 MySQL 与 .env 已配置。'
      : ''
    const msg =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      '网络错误'
    return Promise.reject(new Error(hint ? `${msg}。${hint}` : msg))
  }
)

export default request
