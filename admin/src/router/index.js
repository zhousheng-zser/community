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
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('../views/Dashboard.vue'),
                meta: { title: '控制大屏', icon: 'Odometer' }
            },
            {
                path: 'jd-benefit-goods',
                name: 'JdBenefitGoods',
                component: () => import('../views/JdBenefitGoods.vue'),
                meta: { title: '惠民卡·京东联盟商品', icon: 'ShoppingBag' }
            },
            {
                path: 'goods',
                name: 'Goods',
                component: () => import('../views/Goods.vue'),
                meta: { title: '商品清单', icon: 'Goods' }
            },
            {
                path: 'benefit-alliance-goods',
                name: 'BenefitAllianceGoods',
                component: () => import('../views/BenefitAllianceGoods.vue'),
                meta: { title: '惠民卡·推广管理', icon: 'Discount' }
            },
            {
                path: 'finance',
                name: 'Finance',
                component: () => import('../views/Finance.vue'),
                meta: { title: '达人提现审核', icon: 'Money' }
            },
            {
                path: 'worker-applications',
                name: 'WorkerApplications',
                component: () => import('../views/WorkerApplications.vue'),
                meta: { title: '技工入驻审核', icon: 'User' }
            },
            {
                path: 'steward-applications',
                name: 'StewardApplications',
                component: () => import('../views/StewardApplications.vue'),
                meta: { title: '小区管家入驻审核', icon: 'HomeFilled' }
            },
            {
                path: 'service-providers',
                name: 'ServiceProviders',
                component: () => import('../views/ServiceProviders.vue'),
                meta: { title: '直约服务商管理', icon: 'Shop' }
            },
            {
                path: 'service-dispatch',
                name: 'ServiceDispatch',
                component: () => import('../views/ServiceDispatch.vue'),
                meta: { title: '到家服务派单台', icon: 'Operation' }
            },
            {
                path: 'service-home-manage',
                name: 'ServiceHomeManage',
                component: () => import('../views/ServiceHomeManage.vue'),
                meta: { title: '服务管理', icon: 'Grid' }
            },
            {
                path: 'home-display-config',
                name: 'HomeDisplayConfig',
                component: () => import('../views/HomeDisplayConfig.vue'),
                meta: { title: '首页展示管理', icon: 'HomeFilled' }
            },
            {
                path: 'home-coupon-manage',
                name: 'HomeCouponManage',
                component: () => import('../views/HomeCouponManage.vue'),
                meta: { title: '优惠券管理', icon: 'Ticket' }
            },
            {
                path: 'platform-fee-config',
                name: 'PlatformFeeConfig',
                component: () => import('../views/PlatformFeeConfig.vue'),
                meta: { title: '平台抽成配置', icon: 'Money' }
            },
            {
                path: 'commission-orders',
                name: 'CommissionOrderManage',
                component: () => import('../views/CommissionOrderManage.vue'),
                meta: { title: '推广分佣订单', icon: 'Coin' }
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

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
