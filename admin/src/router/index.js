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
                path: 'finance',
                name: 'Finance',
                component: () => import('../views/Finance.vue'),
                meta: { title: '达人提现审核', icon: 'Money' }
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
