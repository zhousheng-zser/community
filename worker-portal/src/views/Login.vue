<template>
  <div class="wrap">
    <el-card class="card">
      <template #header>技工后台登录</template>
      <p class="tip">开发环境验证码默认为 <strong>123456</strong>（或环境变量 WORKER_PORTAL_SMS_CODE）</p>
      <el-form :model="form" @submit.prevent="onSubmit">
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="与小程序用户绑定一致" />
        </el-form-item>
        <el-form-item label="验证码">
          <el-input v-model="form.code" placeholder="123456" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" style="width:100%">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const form = reactive({ phone: '', code: '123456' })

async function onSubmit() {
  loading.value = true
  try {
    const { data } = await request.post('/worker-portal/login', {
      phone: form.phone,
      code: form.code
    })
    if (data.errno !== 0) {
      ElMessage.error(data.errmsg || '登录失败')
      return
    }
    localStorage.setItem('worker_portal_token', data.data.token)
    const r = route.query.redirect
    router.push(typeof r === 'string' && r ? r : '/orders')
  } catch (e) {
    const msg = e.response && e.response.data && e.response.data.errmsg
    ElMessage.error(msg || '网络错误')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}
.card { width: 400px; }
.tip { color: #666; font-size: 13px; margin-bottom: 16px; }
</style>
