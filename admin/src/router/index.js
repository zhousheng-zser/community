import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layout/index.vue'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue')
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

export default router
