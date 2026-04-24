<template>
  <div class="page">
    <div class="left">
      <div class="left-inner">
        <div class="badge">九州社区 · 服务商</div>
        <h1>首页服务商<br />运行中台</h1>
        <p class="lead">
          管理店铺形象、上架到家服务、处理订单全流程：接单、上门打卡、上传服务凭证、完成履约。
        </p>
        <ul class="bullets">
          <li>与小程序「首页服务商」数据实时一致</li>
          <li>仅展示本店订单与服务</li>
          <li>支持打包单与多服务 SKU</li>
        </ul>
      </div>
    </div>
    <div class="right">
      <div class="card">
        <h2>账号登录</h2>
        <p class="sub">使用运营后台为您开通的门户账号</p>
        <el-form :model="form" size="large" label-position="top" @submit.prevent="submit">
          <el-form-item label="账号">
            <el-input v-model="form.username" autocomplete="username" placeholder="登录名" clearable />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              autocomplete="current-password"
              placeholder="请输入密码"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="loading" class="submit">进入中台</el-button>
          </el-form-item>
        </el-form>
        <p class="hint">未开通请联系运营：服务商申请审核通过后，在运营中台创建门户账号。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const base = import.meta.env.VITE_API_BASE || '/api/v1'
const router = useRouter()
const route = useRoute()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

async function submit() {
  loading.value = true
  try {
    const { data } = await axios.post(`${base}/service-provider-portal/login`, {
      username: form.username,
      password: form.password
    })
    if (data.errno !== 0) {
      ElMessage.error(data.errmsg || '登录失败')
      return
    }
    localStorage.setItem('sp_portal_token', data.data.token)
    if (data.data.profile) {
      localStorage.setItem('sp_profile', JSON.stringify(data.data.profile))
    }
    const r = route.query.redirect
    router.push(typeof r === 'string' && r ? r : '/dashboard')
  } catch (e) {
    const msg =
      e.response?.data?.errmsg ||
      (e.code === 'ERR_NETWORK' ? '无法连接后端，请确认 API 已启动且 Vite 代理正确' : e.message)
    ElMessage.error(msg || '网络错误')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr  minmax(400px, 480px);
}
@media (max-width: 900px) {
  .page {
    grid-template-columns: 1fr;
  }
  .left {
    min-height: 200px;
    padding: 32px 24px !important;
  }
}
.left {
  background: linear-gradient(160deg, #0f172a 0%, #134e4a 48%, #0f766e 100%);
  color: #f8fafc;
  padding: 48px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.left-inner {
  max-width: 420px;
}
.badge {
  display: inline-block;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #5eead4;
  margin-bottom: 16px;
}
h1 {
  margin: 0 0 16px;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.03em;
}
.lead {
  margin: 0 0 20px;
  font-size: 15px;
  line-height: 1.65;
  color: #cbd5e1;
}
.bullets {
  margin: 0;
  padding-left: 18px;
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.9;
}
.right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  background: #f8fafc;
}
.card {
  width: 100%;
  max-width: 400px;
  padding: 36px 32px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04);
}
h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}
.sub {
  margin: 0 0 24px;
  font-size: 14px;
  color: #64748b;
}
.submit {
  width: 100%;
  height: 44px;
  font-weight: 600;
}
.hint {
  margin: 20px 0 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.55;
}
</style>
