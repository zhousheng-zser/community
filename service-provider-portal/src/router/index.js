import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { public: true } },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '经营概览', desc: '关键指标、快捷入口与近期订单一览' }
      },
      {
        path: 'shop',
        name: 'ShopProfile',
        component: () => import('../views/ShopProfile.vue'),
        meta: { title: '店铺资料', desc: '联系信息与门店展示图，同步至用户端' }
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('../views/Services.vue'),
        meta: { title: '服务管理', desc: '上架服务、定价与类目，对应小程序首页展示' }
      },
      {
        path: 'services/new',
        name: 'ServiceCreate',
        component: () => import('../views/ServiceEdit.vue'),
        meta: { title: '发布服务', desc: '填写服务信息并上架' }
      },
      {
        path: 'services/:id',
        name: 'ServiceEdit',
        component: () => import('../views/ServiceEdit.vue'),
        meta: { title: '编辑服务', desc: '修改服务与上下架状态' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('../views/Orders.vue'),
        meta: { title: '订单与履约', desc: '筛选订单、进入详情处理接单与履约' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('../views/OrderDetail.vue'),
        meta: { title: '订单详情', desc: '接单、打卡、上传凭证与完成服务' }
      }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, _from, next) => {
  if (to.meta.public) {
    next()
    return
  }
  if (!localStorage.getItem('sp_portal_token')) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  next()
})

export default router
