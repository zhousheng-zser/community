<template>
  <el-container class="layout-container">
    <!-- 侧边栏菜单 -->
    <el-aside width="220px" class="aside">
      <div class="logo">
        <h2>九州社区 | 商家后台</h2>
      </div>
      <el-menu
        :default-active="$route.path"
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>数据大屏</span>
        </el-menu-item>
        <el-menu-item index="/goods">
          <el-icon><Goods /></el-icon>
          <span>商品池管理</span>
        </el-menu-item>
        <el-menu-item index="/finance">
          <el-icon><Money /></el-icon>
          <span>佣金提现审核</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部 Header -->
      <el-header class="header">
        <div class="header-left">
          <h3>{{ $route.meta.title }}</h3>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="el-dropdown-link">
              Admin 店长 <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>系统设置</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 右下角主体页面路由展位区 -->
      <el-main class="main-body">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { Odometer, Goods, Money, ArrowDown } from '@element-plus/icons-vue'
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
}
.aside {
  background-color: #304156;
  color: #fff;
  display: flex;
  flex-direction: column;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  border-bottom: 1px solid #1f2d3d;
  background-color: #2b3643;
}
.el-menu-vertical {
  border-right: none;
  flex: 1;
}
.header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}
.main-body {
  background-color: #f0f2f5;
  padding: 20px;
}
.el-dropdown-link {
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
}
</style>
