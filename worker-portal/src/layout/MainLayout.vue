<template>
  <el-container class="layout">
    <el-header class="header">
      <span class="brand">技工后台</span>
      <el-button type="primary" link @click="logout">退出</el-button>
    </el-header>
    <el-container>
      <el-aside width="200px">
        <el-menu :default-active="active" router>
          <el-menu-item index="/orders">服务订单</el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const active = computed(() => (route.path.startsWith('/orders') ? '/orders' : route.path))

function logout() {
  localStorage.removeItem('worker_portal_token')
  router.push('/login')
}
</script>

<style scoped>
.layout { min-height: 100vh; }
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
}
.brand { font-weight: 600; }
</style>
