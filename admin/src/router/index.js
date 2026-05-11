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
                path: 'home-display-config',
                name: 'HomeDisplayConfig',
                component: () => import('../views/HomeDisplayConfig.vue'),
                meta: { title: '首页管理', icon: 'HomeFilled' }
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
