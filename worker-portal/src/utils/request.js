import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 30000
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('worker_portal_token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

request.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response && err.response.status
    if (status === 401) {
      localStorage.removeItem('worker_portal_token')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default request
