<template>
  <div class="login-page">
    <el-card class="login-box" shadow="always">
      <div class="header">
        <div class="icon">🏪</div>
        <h2 class="title">九州社区</h2>
        <p class="sub">集市商家工作台</p>
      </div>

      <el-form label-position="top">
        <el-form-item label="手机号">
          <el-input v-model="form.phone" size="large" placeholder="请输入注册手机号" clearable>
            <template #prefix><el-icon><Phone /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" size="large" placeholder="请输入密码" show-password @keyup.enter="handleLogin">
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
          登录工作台
        </el-button>
      </el-form>

      <div class="tips" v-if="isBypass">
        <el-divider>开发模式</el-divider>
        <el-form-item label="User ID (PORTAL_TEST_BYPASS=1 时可用)">
          <el-input v-model="form.user_id" size="small" placeholder="直接填入 user_id" />
        </el-form-item>
      </div>

      <p class="footer-tip">此入口仅供已在小程序完成入驻的集市商家使用</p>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Phone, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request.js'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const isBypass = import.meta.env.DEV

const form = ref({ phone: '', password: '', user_id: '' })

async function handleLogin() {
  if (!form.value.phone && !form.value.user_id) return ElMessage.warning('请填写手机号')
  loading.value = true
  try {
    const res = await request.post('/auth/merchant-portal/login', {
      phone: form.value.phone || undefined,
      password: form.value.password || undefined,
      user_id: form.value.user_id || undefined
    })
    const data = res.data || {}
    if (data.token) {
      localStorage.setItem('market_token', data.token)
      if (data.shop) localStorage.setItem('market_shop_info', JSON.stringify(data.shop))
      if (data.user) localStorage.setItem('market_user_info', JSON.stringify(data.user))
      ElMessage.success('登录成功')
      const redirect = route.query.redirect
      router.push(typeof redirect === 'string' && redirect ? redirect : '/dashboard')
    } else {
      ElMessage.error('未返回令牌')
    }
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1a3a2a 0%, #2d6a40 50%, #1a3a2a 100%);
}
.login-box {
  width: 420px;
  border-radius: 16px;
  padding: 10px;
  background: rgba(255,255,255,0.97);
  box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
}
.header { text-align: center; margin-bottom: 28px; }
.icon { font-size: 48px; margin-bottom: 8px; }
.title { margin: 0 0 4px; font-size: 24px; color: #1a3a2a; letter-spacing: 2px; }
.sub { margin: 0; color: #38a169; font-size: 14px; font-weight: 500; }
.login-btn { width: 100%; margin-top: 12px; font-size: 15px; font-weight: bold; height: 44px; }
.footer-tip { text-align: center; font-size: 12px; color: #a0aec0; margin-top: 20px; margin-bottom: 0; }
</style>
