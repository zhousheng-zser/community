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
      { path: 'goods', name: 'Goods', component: () => import('../views/Goods.vue'), meta: { title: '商品管理' } },
      { path: 'orders', name: 'Orders', component: () => import('../views/Orders.vue'), meta: { title: '订单管理' } },
      { path: 'refunds', name: 'Refunds', component: () => import('../views/Refunds.vue'), meta: { title: '退款管理' } }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('market_token')
  if (to.meta.public) {
    if (token && to.path === '/login') next('/')
    else next()
    return
  }
  if (!token) { next({ path: '/login', query: { redirect: to.fullPath } }); return }
  next()
})

export default router
