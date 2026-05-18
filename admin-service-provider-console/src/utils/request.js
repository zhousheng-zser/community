import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 30000
})

function loginHref() {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? `${base}login` : `${base}/login`
}

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('sp_portal_token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

request.interceptors.response.use(
  (response) => {
    const d = response.data
    if (d && typeof d.errno === 'number' && d.errno !== 0) {
      return Promise.reject(new Error(d.errmsg || '请求失败'))
    }
    return d
  },
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('sp_portal_token')
      localStorage.removeItem('sp_profile')
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = loginHref()
      }
    }
    return Promise.reject(err)
  }
)

export default request
