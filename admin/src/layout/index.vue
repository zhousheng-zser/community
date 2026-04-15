<template>
  <el-container class="layout-container">
    <el-aside width="230px" class="aside">
      <div class="logo">
        <h2>九州社区 · 运营中台</h2>
      </div>
      <el-menu
        :default-active="$route.path"
        class="el-menu-vertical"
        background-color="#1e222d"
        text-color="#a3b1c6"
        active-text-color="#cda05b"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>工作台</span>
        </el-menu-item>

        <el-sub-menu index="ops">
          <template #title>
            <el-icon><User /></el-icon>
            <span>运营与人</span>
          </template>
          <el-menu-item index="/worker-applications">技工入驻</el-menu-item>
          <el-menu-item index="/service-provider-applications">服务商入驻</el-menu-item>
          <el-menu-item index="/home-service-dispatch">九州派单（到家+帮帮）</el-menu-item>
          <el-menu-item index="/housekeeping-services">家政订单（旧）</el-menu-item>
          <el-menu-item index="/live-streams">直播场次</el-menu-item>
          <el-menu-item index="/market-applications">店铺入驻审核</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="market">
          <template #title>
            <el-icon><Shop /></el-icon>
            <span>本地集市</span>
          </template>
          <el-menu-item index="/market-orders">订单</el-menu-item>
          <el-menu-item index="/market-payments">支付流水</el-menu-item>
          <el-menu-item index="/market-shops">店铺</el-menu-item>
          <el-menu-item index="/market-goods">商品</el-menu-item>
          <el-menu-item index="/market-reviews">评价</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="biz">
          <template #title>
            <el-icon><ShoppingBag /></el-icon>
            <span>营销与演示</span>
          </template>
          <el-menu-item index="/jd-benefit-goods">惠民卡·京东</el-menu-item>
          <el-menu-item index="/goods">商品池（演示）</el-menu-item>
          <el-menu-item index="/finance">提现审核（演示）</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h3>{{ $route.meta.title }}</h3>
        </div>
        <div class="header-right">
          <el-dropdown @command="onUserCommand">
            <span class="el-dropdown-link">
              {{ adminName }} <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-body">
        <div class="page-router-wrap">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Odometer, ShoppingBag, ArrowDown, User, Shop } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const adminName = ref('管理员')

onMounted(() => {
    try {
        const t = localStorage.getItem('admin_token')
        if (t) {
            const payload = JSON.parse(atob(t.split('.')[1]))
            if (payload && payload.sub) adminName.value = payload.sub
        }
    } catch (_) {
        /* ignore */
    }
})

function onUserCommand(cmd) {
    if (cmd === 'logout') {
        localStorage.removeItem('admin_token')
        ElMessage.success('已退出')
        router.push('/login')
    }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
}
.aside {
  background-color: #1e222d;
  color: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
}
.logo {
  height: 64px;
  line-height: 64px;
  text-align: center;
  color: #cda05b;
  border-bottom: 1px solid #2a3140;
  background-color: #1a1d26;
  padding: 0 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.logo h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
}
.el-menu-vertical {
  border-right: none;
  flex: 1;
}
/* 提升多级菜单的质感 */
:deep(.el-sub-menu__title:hover), :deep(.el-menu-item:hover) {
  background-color: #2a3140 !important;
}
.header {
  height: 64px;
  background-color: #ffffff;
  border-bottom: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  z-index: 9;
}
.main-body {
  padding: 0; 
  position: relative;
  background: linear-gradient(rgba(245, 247, 250, 0.88), rgba(245, 247, 250, 0.95)), url('../assets/login-bg.jpg') center top / cover no-repeat;
  background-attachment: fixed;
  min-height: calc(100vh - 64px);
}

.page-router-wrap {
  position: relative;
  z-index: 2;
  padding: 16px;
}
.el-dropdown-link {
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
}
</style>
