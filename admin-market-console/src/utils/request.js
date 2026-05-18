import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 30000
})

function loginHref() {
  const base = import.meta.env.BASE_URL || '/'
  const path = base.endsWith('/') ? `${base}login` : `${base}/login`
  return path.startsWith('/') ? path : `/${path}`
}

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('merchant_portal_token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

request.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('merchant_portal_token')
      localStorage.removeItem('merchant_shop')
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = loginHref()
      }
    }
    return Promise.reject(err)
  }
)

export default request
