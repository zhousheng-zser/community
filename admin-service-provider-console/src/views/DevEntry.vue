<template>
  <div class="dev-entry-page">
    <div class="card">
      <h1>🔧 开发模式入口</h1>
      <p class="subtitle">当前环境：开发阶段 | 一键进入各工作台</p>

      <div class="section">
        <h3>服务商工作台</h3>
        <p class="hint">DEBUG_SERVICE_PROVIDER_PORTAL_LOGIN=1 时无需密码</p>
        <el-button type="primary" size="large" :loading="spLoading" @click="enterServiceProvider">
          进入服务商工作台
        </el-button>
      </div>

      <el-divider />

      <div class="section">
        <h3>技工工作台</h3>
        <p class="hint">DEBUG_SKIP_WORKER_PORTAL_LOGIN=1 时无需验证码</p>
        <el-button type="success" size="large" :loading="workerLoading" @click="enterWorker">
          进入技工工作台
        </el-button>
      </div>

      <el-divider />

      <div class="section">
        <h3>商家后台</h3>
        <p class="hint">DEBUG_MERCHANT_LOGIN=1 时无需密码</p>
        <el-button type="warning" size="large" :loading="merchantLoading" @click="enterMerchant">
          进入商家后台
        </el-button>
      </div>

      <el-divider />

      <div class="section">
        <h3>运营后台</h3>
        <p class="hint">需单独登录 admin 系统</p>
        <el-button size="large" @click="goAdmin">打开运营后台</el-button>
      </div>

      <div class="footer">
        <el-tag type="info">此页面仅在开发环境可用</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()
const base = import.meta.env.VITE_API_BASE || '/api/v1'

const spLoading = ref(false)
const workerLoading = ref(false)
const merchantLoading = ref(false)

async function enterServiceProvider() {
  spLoading.value = true
  try {
    const { data } = await axios.post(`${base}/service-provider-portal/login`, {
      username: '',
      password: ''
    })
    if (data.errno !== 0) {
      ElMessage.error(data.errmsg || '服务商登录失败')
      return
    }
    localStorage.setItem('sp_portal_token', data.data.token)
    if (data.data.profile) {
      localStorage.setItem('sp_profile', JSON.stringify(data.data.profile))
    }
    ElMessage.success(`已登录：${data.data.profile?.shop_name || '服务商'}`)
    router.push('/dashboard')
  } catch (e) {
    const msg = e.response?.data?.errmsg || e.message || '网络错误'
    ElMessage.error(msg)
  } finally {
    spLoading.value = false
  }
}

async function enterWorker() {
  workerLoading.value = true
  try {
    const { data } = await axios.post(`${base}/worker-portal/login`, {
      phone: '',
      code: ''
    })
    if (data.errno !== 0) {
      ElMessage.error(data.errmsg || '技工登录失败')
      return
    }
    localStorage.setItem('worker_portal_token', data.data.token)
    ElMessage.success(`已登录：${data.data.user?.nickname || '技工'}`)
    router.push('/orders')
  } catch (e) {
    const msg = e.response?.data?.errmsg || e.message || '网络错误'
    ElMessage.error(msg)
  } finally {
    workerLoading.value = false
  }
}

async function enterMerchant() {
  merchantLoading.value = true
  try {
    const { data } = await axios.post(`${base}/merchant-portal/login`, {
      username: '',
      password: ''
    })
    if (data.errno !== 0) {
      ElMessage.error(data.errmsg || '商家登录失败')
      return
    }
    localStorage.setItem('merchant_portal_token', data.data.token)
    ElMessage.success(`已登录：${data.data.shop?.name || '商家'}`)
    // 商家后台是独立项目，这里只存储token并提示用户
    ElMessage.success('商家Token已写入localStorage，请切换到商家后台页面')
  } catch (e) {
    const msg = e.response?.data?.errmsg || e.message || '网络错误'
    ElMessage.error(msg)
  } finally {
    merchantLoading.value = false
  }
}

function goAdmin() {
  const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5176'
  window.open(adminUrl, '_blank')
}
</script>

<style scoped>
.dev-entry-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #134e4a 48%, #0f766e 100%);
  padding: 24px;
}
.card {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
h1 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}
.subtitle {
  margin: 0 0 28px;
  font-size: 14px;
  color: #64748b;
}
.section {
  margin-bottom: 20px;
}
.section h3 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}
.hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: #94a3b8;
}
.el-button {
  width: 100%;
  height: 44px;
  font-weight: 600;
}
.footer {
  margin-top: 24px;
  text-align: center;
}
</style>
