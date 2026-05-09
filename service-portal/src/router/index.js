import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layout/index.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '工作台首页' } },
      { path: 'profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { title: '店铺资料' } },
      { path: 'services', name: 'Services', component: () => import('../views/Services.vue'), meta: { title: '服务项目管理' } },
      { path: 'orders', name: 'Orders', component: () => import('../views/Orders.vue'), meta: { title: '订单管理' } },
      { path: 'workers', name: 'Workers', component: () => import('../views/Workers.vue'), meta: { title: '技工管理' } },
      { path: 'finance', name: 'Finance', component: () => import('../views/Finance.vue'), meta: { title: '财务收入' } }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('sp_token')
  if (to.meta.public) {
    if (token && to.path === '/login') next('/')
    else next()
    return
  }
  if (!token) { next({ path: '/login', query: { redirect: to.fullPath } }); return }
  next()
})

export default router
