<template>
  <div class="login-page">
    <div class="left">
      <div class="left-inner">
        <div class="badge">本地生活 · 集市商家</div>
        <h1>店铺经营，一站完成</h1>
        <p class="lead">商品、订单、支付流水与店铺装修统一入口，数据与小程序实时同步。</p>
        <ul class="bullets">
          <li>履约状态与订单详情可追溯</li>
          <li>库存与安全库存预警</li>
          <li>店招、公告、营业时间自主维护</li>
        </ul>
      </div>
    </div>
    <div class="right">
      <el-card class="card" shadow="always">
        <template #header>
          <span class="card-title">商家登录</span>
        </template>
        <p class="tip">使用运营后台「商户账户」中的账号登录</p>
        <el-form :model="form" size="large" @submit.prevent="onSubmit">
          <el-form-item label="账号">
            <el-input v-model="form.username" autocomplete="username" placeholder="商户登录名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              autocomplete="current-password"
              placeholder="登录密码"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="loading" class="submit-btn">进入商家后台</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useMarketConsoleStore } from '../stores/marketConsole'

const base = import.meta.env.VITE_API_BASE || '/api/v1'
const router = useRouter()
const route = useRoute()
const store = useMarketConsoleStore()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

async function onSubmit() {
  loading.value = true
  try {
    const { data } = await axios.post(base + '/merchant-portal/login', {
      username: form.username,
      password: form.password
    })
    if (data.errno !== 0) {
      ElMessage.error(data.errmsg || '登录失败')
      return
    }
    localStorage.setItem('merchant_portal_token', data.data.token)
    if (data.data.shop) store.setShopFromLogin(data.data.shop)
    else store.initShopFromStorage()
    const r = route.query.redirect
    router.push(typeof r === 'string' && r ? r : '/dashboard')
  } catch (e) {
    const msg =
      (e.response && e.response.data && e.response.data.errmsg) ||
      (e.code === 'ERR_NETWORK' || e.message === 'Network Error'
        ? '无法连接后端：请先启动 backend（npm start），并确认端口与 VITE_PROXY_TARGET 一致'
        : e.message)
    ElMessage.error(msg || '网络错误')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }
  .left {
    min-height: 220px;
  }
}
.left {
  background: linear-gradient(145deg, #1e222d 0%, #2d3548 50%, #1a1d26 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
}
.left-inner {
  max-width: 420px;
}
.badge {
  display: inline-block;
  font-size: 12px;
  letter-spacing: 2px;
  color: #cda05b;
  border: 1px solid rgba(205, 160, 91, 0.5);
  padding: 4px 12px;
  border-radius: 999px;
  margin-bottom: 20px;
}
.left h1 {
  margin: 0 0 16px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
}
.lead {
  margin: 0 0 20px;
  color: #a3b1c6;
  font-size: 15px;
  line-height: 1.6;
}
.bullets {
  margin: 0;
  padding-left: 18px;
  color: #8b95a8;
  font-size: 14px;
  line-height: 2;
}
.right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  background: #f5f2ed;
}
.card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
}
.card-title {
  font-size: 18px;
  font-weight: 700;
}
.tip {
  color: #909399;
  font-size: 13px;
  margin: 0 0 8px;
  line-height: 1.5;
}
.submit-btn {
  width: 100%;
}
</style>
