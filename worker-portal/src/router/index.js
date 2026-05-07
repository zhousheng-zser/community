import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'

const isDev = import.meta.env.DEV

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { public: true } },
  ...(isDev ? [{ path: '/dev-entry', name: 'DevEntry', component: () => import('../views/DevEntry.vue'), meta: { public: true } }] : []),
  {
    path: '/',
    component: MainLayout,
    redirect: '/orders',
    children: [
      { path: 'orders', name: 'Orders', component: () => import('../views/Orders.vue'), meta: { title: '服务订单' } },
      { path: 'orders/:id', name: 'OrderDetail', component: () => import('../views/OrderDetail.vue'), meta: { title: '订单详情' } }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, _from, next) => {
  if (to.meta.public) {
    next()
    return
  }
  if (!localStorage.getItem('worker_portal_token')) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  next()
})

export default router
