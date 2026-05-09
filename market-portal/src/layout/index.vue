<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <span class="logo-icon">🏪</span>
        <div class="logo-text">
          <p class="logo-title">集市商家工作台</p>
          <p class="logo-sub">{{ shopName }}</p>
        </div>
      </div>
      <el-menu :default-active="$route.path" class="el-menu-vertical"
        background-color="#1a3a2a" text-color="#a0c4aa" active-text-color="#68d391" router>
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon><span>工作台</span>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><Shop /></el-icon><span>店铺资料</span>
        </el-menu-item>
        <el-menu-item index="/goods">
          <el-icon><Goods /></el-icon><span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon><span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/refunds">
          <el-icon><RefreshLeft /></el-icon><span>退款管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h3>{{ $route.meta.title || '集市商家工作台' }}</h3>
        </div>
        <div class="header-right">
          <el-dropdown @command="onCmd">
            <span class="el-dropdown-link">
              {{ userName }} <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-body"><router-view /></el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Odometer, Shop, Goods, Document, RefreshLeft, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userName = ref('商家')
const shopName = ref('')

onMounted(() => {
  try {
    const info = JSON.parse(localStorage.getItem('market_shop_info') || '{}')
    shopName.value = info.name || ''
    const user = JSON.parse(localStorage.getItem('market_user_info') || '{}')
    userName.value = user.nickname || user.phone || '商家'
  } catch {}
})

function onCmd(cmd) {
  if (cmd === 'logout') {
    localStorage.removeItem('market_token')
    localStorage.removeItem('market_shop_info')
    localStorage.removeItem('market_user_info')
    ElMessage.success('已退出')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container { height: 100vh; display: flex; }
.aside { background-color: #1a3a2a; display: flex; flex-direction: column; }
.logo {
  height: 70px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  border-bottom: 1px solid #2d5a3a;
  background-color: #142a1e;
}
.logo-icon { font-size: 28px; }
.logo-title { color: #fff; font-size: 14px; font-weight: bold; margin: 0; }
.logo-sub { color: #68d391; font-size: 11px; margin: 2px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
.el-menu-vertical { border-right: none; flex: 1; }
.header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0,21,41,.06);
}
.header h3 { margin: 0; color: #2d3748; font-size: 16px; }
.main-body { background: #f7f9fc; padding: 20px; }
.el-dropdown-link { cursor: pointer; color: #4a5568; display: flex; align-items: center; gap: 4px; }
</style>
