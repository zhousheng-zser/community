import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE || '/api/v1'
const TOKEN_KEY = 'market_token'

const request = axios.create({ baseURL, timeout: 20000 })

request.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res && typeof res.code === 'number' && res.code !== 0 && res.code !== 200) {
      return Promise.reject(new Error(res.msg || res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    const res = error.response
    const status = res && res.status
    const data = res && res.data
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      if (!window.location.pathname.endsWith('/login')) window.location.assign('/login')
    }
    const serverMsg = data && typeof data === 'object' ? (data.msg || data.message || '') : (typeof data === 'string' ? data : '')
    const msg = serverMsg || (status ? `HTTP ${status}` : error.message || '网络错误')
    return Promise.reject(new Error(msg))
  }
)

export default request
