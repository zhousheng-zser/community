<template>
  <el-container class="layout">
    <el-aside :width="asideW" class="aside">
      <div class="logo">
        <span class="logo-mark">集</span>
        <div class="logo-text">
          <span class="t1">本地集市</span>
          <span class="t2">商家中台</span>
        </div>
      </div>
      <el-scrollbar class="menu-scroll">
        <el-menu
          :default-active="activeMenu"
          router
          class="side-menu"
          background-color="transparent"
          :text-color="menuText"
          :active-text-color="menuActive"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>经营概览</span>
          </el-menu-item>
          <el-menu-item index="/shop">
            <el-icon><Shop /></el-icon>
            <span>店铺装修</span>
          </el-menu-item>
          <el-sub-menu index="goods-group">
            <template #title>
              <el-icon><Goods /></el-icon>
              <span>商品</span>
            </template>
            <el-menu-item index="/goods">商品列表</el-menu-item>
            <el-menu-item index="/goods/new">发布商品</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/orders">
            <el-icon><List /></el-icon>
            <span>订单与履约</span>
          </el-menu-item>
          <el-menu-item index="/payments">
            <el-icon><Money /></el-icon>
            <span>支付与对账</span>
          </el-menu-item>
          <el-sub-menu index="cs-msg">
            <template #title>
              <el-icon><ChatDotRound /></el-icon>
              <span>客服与消息</span>
            </template>
            <el-menu-item index="/help">客服与帮助</el-menu-item>
            <el-menu-item index="/notifications">消息说明</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-scrollbar>
      <div class="aside-foot">
        <div v-if="shopName" class="shop-pill" :title="shopName">
          <span class="dot" />
          {{ shopName }}
        </div>
        <el-button class="logout-btn" type="primary" plain @click="logout">
          <el-icon class="mr"><SwitchButton /></el-icon>
          退出
        </el-button>
      </div>
    </el-aside>

    <el-container class="main-wrap">
      <el-header class="top-header">
        <div class="top-left">
          <span class="crumb">{{ pageTitle }}</span>
        </div>
        <div class="top-right">
          <span class="env-tip">店铺数据实时同步 · 与小程序展示一致</span>
        </div>
      </el-header>
      <el-main class="main">
        <div class="main-inner">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Odometer, Shop, Goods, List, Money, SwitchButton, ChatDotRound } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const shopName = ref('')
const asideW = '232px'
const menuText = '#a3b1c6'
const menuActive = '#cda05b'

const activeMenu = computed(() => {
  const p = route.path
  if (p === '/goods/new') return '/goods/new'
  if (p.startsWith('/goods/')) return '/goods'
  if (p.startsWith('/orders')) return '/orders'
  if (p === '/help' || p === '/notifications') return p
  return p
})

const pageTitle = computed(() => route.meta.title || '商家中台')

onMounted(() => {
  const raw = localStorage.getItem('merchant_shop')
  if (raw) {
    try {
      const j = JSON.parse(raw)
      shopName.value = j.name || ''
    } catch (_) {
      /* ignore */
    }
  }
})

function logout() {
  localStorage.removeItem('merchant_portal_token')
  localStorage.removeItem('merchant_shop')
  router.push('/login')
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}
.aside {
  background: linear-gradient(180deg, #1e222d 0%, #16181f 100%);
  color: var(--mp-aside-text);
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
}
.logo {
  height: var(--mp-header-h);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}
.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #cda05b, #8b6914);
  color: #fff;
  font-weight: 800;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.t1 {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}
.t2 {
  font-size: 11px;
  color: #6b7280;
  letter-spacing: 1px;
}
.menu-scroll {
  flex: 1;
  min-height: 0;
}
.side-menu {
  border-right: none;
  padding: 12px 8px;
}
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  border-radius: 10px;
  margin-bottom: 4px;
}
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background: rgba(255, 255, 255, 0.06) !important;
}
:deep(.el-menu-item.is-active) {
  background: rgba(205, 160, 91, 0.15) !important;
}
:deep(.el-sub-menu .el-menu-item) {
  min-width: auto;
  padding-left: 48px !important;
}
.aside-foot {
  padding: 12px 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}
.shop-pill {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #67c23a;
  flex-shrink: 0;
}
.logout-btn {
  width: 100%;
  --el-button-bg-color: transparent;
  border-color: rgba(205, 160, 91, 0.4);
  color: #cda05b;
}
.logout-btn:hover {
  background: rgba(205, 160, 91, 0.12);
}
.mr {
  margin-right: 4px;
}

.main-wrap {
  flex-direction: column;
  min-width: 0;
  background: var(--mp-bg);
}
.top-header {
  height: var(--mp-header-h);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
}
.crumb {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}
.env-tip {
  font-size: 12px;
  color: #c0c4cc;
}
.main {
  padding: 0;
  overflow: auto;
}
.main-inner {
  padding: 22px 24px 32px;
  min-height: calc(100vh - var(--mp-header-h));
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
