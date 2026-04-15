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
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '工作台' } },
      { path: 'worker-applications', name: 'WorkerApplications', component: () => import('../views/WorkerApplications.vue'), meta: { title: '技工入驻' } },
      { path: 'service-provider-applications', name: 'ServiceProviderApplications', component: () => import('../views/ServiceProviderApplications.vue'), meta: { title: '服务商入驻' } },
      { path: 'home-service-dispatch', name: 'HomeServiceDispatch', component: () => import('../views/HomeServiceDispatch.vue'), meta: { title: '九州派单（到家+帮帮）' } },
      { path: 'housekeeping-services', name: 'HousekeepingServices', component: () => import('../views/HousekeepingServices.vue'), meta: { title: '家政订单（旧）' } },
      { path: 'live-streams', name: 'LiveStreams', component: () => import('../views/LiveStreams.vue'), meta: { title: '直播场次' } },
      { path: 'market-applications', name: 'MarketApplications', component: () => import('../views/MarketApplications.vue'), meta: { title: '店铺入驻审核' } },
      { path: 'market-orders', name: 'MarketOrders', component: () => import('../views/MarketOrders.vue'), meta: { title: '订单' } },
      { path: 'order-fulfillment', name: 'OrderFulfillment', component: () => import('../views/OrderFulfillment.vue'), meta: { title: '订单履约' } },
      { path: 'market-payments', name: 'MarketPayments', component: () => import('../views/MarketPayments.vue'), meta: { title: '支付流水' } },
      { path: 'refund-center', name: 'RefundCenter', component: () => import('../views/RefundCenter.vue'), meta: { title: '退款中心' } },
      { path: 'settlement-center', name: 'SettlementCenter', component: () => import('../views/SettlementCenter.vue'), meta: { title: '结算中心' } },
      { path: 'market-shops', name: 'MarketShops', component: () => import('../views/MarketShops.vue'), meta: { title: '店铺' } },
      { path: 'market-goods', name: 'MarketGoods', component: () => import('../views/MarketGoods.vue'), meta: { title: '商品' } },
      { path: 'market-reviews', name: 'MarketReviews', component: () => import('../views/MarketReviews.vue'), meta: { title: '评价' } },
      { path: 'merchant-accounts', name: 'MerchantAccounts', component: () => import('../views/MerchantAccounts.vue'), meta: { title: '商户账户' } },
      { path: 'complaint-tickets', name: 'ComplaintTickets', component: () => import('../views/ComplaintTickets.vue'), meta: { title: '投诉工单' } },
      { path: 'audit-logs', name: 'AuditLogs', component: () => import('../views/AuditLogs.vue'), meta: { title: '审计日志' } },
      { path: 'jd-benefit-goods', name: 'JdBenefitGoods', component: () => import('../views/JdBenefitGoods.vue'), meta: { title: '惠民卡·京东' } },
      { path: 'coupon-center', name: 'CouponCenter', component: () => import('../views/CouponCenter.vue'), meta: { title: '券码中心' } },
      { path: 'data-reports', name: 'DataReports', component: () => import('../views/DataReports.vue'), meta: { title: '数据报表' } },
      { path: 'goods', name: 'Goods', component: () => import('../views/Goods.vue'), meta: { title: '商品池（演示）' } },
      { path: 'finance', name: 'Finance', component: () => import('../views/Finance.vue'), meta: { title: '提现审核（演示）' } }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.meta.public) {
    if (token && to.path === '/login') {
      const r = to.query.redirect
      next(typeof r === 'string' && r ? r : '/dashboard')
    } else {
      next()
    }
    return
  }
  if (!token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  next()
})

export default router
