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

function apiMessage(obj) {
  if (!obj || typeof obj !== 'object') return ''
  return obj.message || obj.msg || obj.errmsg || ''
}

/** 与小程序/网关常见约定一致：code 为 0 或 200 均视为成功（仅 code===200 会把 0 误判为失败 →「请求失败」） */
function isCodeSuccess(code) {
  return code === 200 || code === 0
}

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res && typeof res.code === 'number' && !isCodeSuccess(res.code)) {
      return Promise.reject(new Error(apiMessage(res) || '请求失败'))
    }
    if (res && typeof res.errno === 'number' && res.errno !== 0) {
      return Promise.reject(new Error(apiMessage(res) || '请求失败'))
    }
    if (res && typeof res.errcode === 'number' && res.errcode !== 0) {
      return Promise.reject(new Error(apiMessage(res) || '请求失败'))
    }
    return res
  },
  (error) => {
    const res = error.response
    const status = res && res.status
    const data = res && res.data
    let serverMsg = ''
    if (data && typeof data === 'object') {
      serverMsg =
        data.message || data.msg || data.errmsg || data.error || ''
    } else if (typeof data === 'string' && data.length < 200) {
      serverMsg = data
    }
    // 后端历史占位符或乱码时避免整段只有问号
    if (serverMsg && /^[\s\?？]+$/.test(String(serverMsg))) {
      serverMsg = ''
    }

    if (status === 401) {
      localStorage.removeItem('admin_token')
      if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
        window.location.assign('/login')
      }
    }

    const isNetwork =
      !res &&
      (error.code === 'ERR_NETWORK' ||
        (error.message && String(error.message).toLowerCase().includes('network')))
    const hint = isNetwork
      ? '无法连接后端：请确认 VITE_PROXY_TARGET 指向可访问的 API，且服务器已启动。'
      : ''
    const msg =
      serverMsg ||
      (status ? `HTTP ${status}${res.statusText ? ' ' + res.statusText : ''}` : '') ||
      error.message ||
      '网络错误'
    return Promise.reject(new Error(hint ? `${msg}。${hint}` : msg))
  }
)

export default request
