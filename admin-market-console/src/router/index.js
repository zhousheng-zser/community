import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'

const isDev = import.meta.env.DEV

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { public: true } },
  ...(isDev ? [{ path: '/dev-entry', name: 'DevEntry', component: () => import('../views/DevEntry.vue'), meta: { public: true } }] : []),
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '工作台' } },
      { path: 'analytics', name: 'MarketAnalytics', component: () => import('../views/AnalyticsMarket.vue'), meta: { title: '销售数据分析' } },
      { path: 'shop', name: 'ShopProfile', component: () => import('../views/ShopProfile.vue'), meta: { title: '店铺装修与资料' } },
      { path: 'goods', name: 'Goods', component: () => import('../views/Goods.vue'), meta: { title: '商品管理' } },
      { path: 'goods/new', name: 'GoodCreate', component: () => import('../views/GoodCreate.vue'), meta: { title: '新建商品' } },
      { path: 'goods/:id', name: 'GoodEdit', component: () => import('../views/GoodEdit.vue'), meta: { title: '编辑商品' } },
      { path: 'orders', name: 'Orders', component: () => import('../views/Orders.vue'), meta: { title: '订单与履约' } },
      { path: 'orders/:orderNo', name: 'OrderDetail', component: () => import('../views/OrderDetail.vue'), meta: { title: '订单详情' } },
      { path: 'payments', name: 'Payments', component: () => import('../views/Payments.vue'), meta: { title: '支付与对账' } },
      { path: 'help', name: 'MerchantHelp', component: () => import('../views/MerchantHelp.vue'), meta: { title: '客服与帮助' } },
      {
        path: 'notifications',
        name: 'MerchantNotifications',
        component: () => import('../views/MerchantNotifications.vue'),
        meta: { title: '消息说明' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.meta.public) {
    next()
    return
  }
  if (!localStorage.getItem('merchant_portal_token')) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  next()
})

export default router
