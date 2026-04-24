<template>
  <el-container class="layout">
    <el-aside width="240px" class="aside">
      <div class="brand">
        <div class="brand-mark">
          <el-icon :size="22"><Shop /></el-icon>
        </div>
        <div class="brand-text">
          <span class="brand-title">首页服务商</span>
          <span class="brand-sub">运行中台</span>
        </div>
      </div>

      <el-menu
        :default-active="$route.path"
        router
        class="nav-menu"
        background-color="transparent"
        :text-color="'#94a3b8'"
        :active-text-color="'#2dd4bf'"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>经营概览</span>
        </el-menu-item>
        <el-menu-item index="/shop">
          <el-icon><OfficeBuilding /></el-icon>
          <span>店铺资料</span>
        </el-menu-item>
        <el-sub-menu index="svc">
          <template #title>
            <el-icon><Goods /></el-icon>
            <span>服务管理</span>
          </template>
          <el-menu-item index="/services">服务列表</el-menu-item>
          <el-menu-item index="/services/new">发布服务</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <span>订单与履约</span>
        </el-menu-item>
      </el-menu>

      <div class="aside-footer">
        <div v-if="profile.shop_name" class="shop-chip">
          <span class="shop-name">{{ profile.shop_name }}</span>
          <span v-if="profile.community_id != null" class="comm-tag">小区 #{{ profile.community_id }}</span>
        </div>
        <el-button class="logout-btn" plain @click="logout">退出登录</el-button>
      </div>
    </el-aside>

    <el-container class="main-wrap">
      <el-header class="top-header">
        <div class="header-left">
          <h1 class="route-title">{{ $route.meta.title || '' }}</h1>
          <p class="route-desc">{{ $route.meta.desc || '与小程序「首页服务商」数据同步 · 仅本店订单与服务' }}</p>
        </div>
        <div class="header-right">
          <el-tag v-if="accountName" type="info" effect="plain" round>账号 {{ accountName }}</el-tag>
          <el-button text type="primary" @click="refresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Odometer, Shop, Goods, List, OfficeBuilding, Refresh } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const accountName = ref('')
const profile = reactive({
  shop_name: '',
  community_id: null
})

async function loadProfile() {
  try {
    const s = localStorage.getItem('sp_profile')
    if (s) {
      const p = JSON.parse(s)
      profile.shop_name = p.shop_name || ''
      profile.community_id = p.community_id
    }
    const res = await request.get('/service-provider-portal/me')
    if (res.data && res.data.profile) {
      profile.shop_name = res.data.profile.shop_name || profile.shop_name
      profile.community_id = res.data.profile.community_id
      accountName.value = res.data.account?.username || ''
      localStorage.setItem(
        'sp_profile',
        JSON.stringify({
          shop_name: profile.shop_name,
          community_id: profile.community_id,
          id: res.data.profile.id,
          user_id: res.data.profile.user_id
        })
      )
    }
  } catch {
    /* 忽略 */
  }
}

function refresh() {
  loadProfile()
  window.dispatchEvent(new CustomEvent('sp-portal-refresh'))
}

onMounted(loadProfile)

function logout() {
  localStorage.removeItem('sp_portal_token')
  localStorage.removeItem('sp_profile')
  router.push('/login')
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}
.aside {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(148, 163, 184, 0.12);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}
.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);
}
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.brand-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.02em;
}
.brand-sub {
  font-size: 12px;
  color: #94a3b8;
}
.nav-menu {
  flex: 1;
  padding: 12px 8px;
  border-right: none !important;
}
.nav-menu :deep(.el-menu-item),
.nav-menu :deep(.el-sub-menu__title) {
  border-radius: 8px;
  margin: 4px 0;
}
.nav-menu :deep(.el-menu-item.is-active) {
  background: rgba(45, 212, 191, 0.12) !important;
}
.aside-footer {
  padding: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}
.shop-chip {
  margin-bottom: 12px;
}
.shop-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  line-height: 1.4;
  word-break: break-all;
}
.comm-tag {
  display: inline-block;
  margin-top: 6px;
  font-size: 11px;
  color: #5eead4;
  background: rgba(45, 212, 191, 0.12);
  padding: 2px 8px;
  border-radius: 6px;
}
.logout-btn {
  width: 100%;
  --el-button-bg-color: transparent;
  --el-button-border-color: rgba(148, 163, 184, 0.35);
  color: #94a3b8;
}
.logout-btn:hover {
  color: #f1f5f9;
  border-color: #94a3b8;
}
.main-wrap {
  flex-direction: column;
  background: var(--sp-bg);
}
.top-header {
  height: auto !important;
  min-height: 72px;
  padding: 18px 28px !important;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid var(--sp-border);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}
.route-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--sp-text);
  letter-spacing: -0.02em;
}
.route-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--sp-muted);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.main {
  padding: 24px 28px 40px;
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
