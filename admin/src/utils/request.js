import axios from 'axios'

// 假设我们后期的 Node.js 跑在本机的 3000 端口
const request = axios.create({
    baseURL: 'http://127.0.0.1:3000/api',
    timeout: 5000
})

// 添加请求拦截器：以后在这把登录获取到的 JWT 令牌塞入 headers 给后端验证
request.interceptors.request.use(
    config => {
        // const token = localStorage.getItem('admin_token')
        // if (token) {
        //   config.headers['Authorization'] = 'Bearer ' + token
        // }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 添加响应拦截器：集中拦取如“密码错误”、“请重新登录”等抛错并跳出警告
request.interceptors.response.use(
    response => {
        const res = response.data
        // 如果后端制定的返回码不为 200，则当做异常处理
        if (res.code && res.code !== 200) {
            console.error('Request Error: ' + res.message || 'Error')
            return Promise.reject(new Error(res.message || 'Error'))
        } else {
            return res
        }
    },
    error => {
        console.error('Response Catch:', error)
        return Promise.reject(error)
    }
)

export default request
