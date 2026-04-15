<template>
  <div class="login-container">
    <el-card class="login-box" shadow="always">
      <div class="header">
        <h2 class="title">九州社区·云商中台</h2>
        <span class="sub-title">系统管理员入口</span>
      </div>

      <el-form label-position="top">
        <el-form-item label="管理员账号">
          <el-input v-model="form.username" size="large" placeholder="请输入账号" autocomplete="username">
            <template #prefix>
              <el-icon><user /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            size="large"
            placeholder="请输入密码"
            show-password
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
          安全登入系统
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

const form = ref({
  username: 'wsxCDE',
  password: ''
})

const handleLogin = async () => {
  if (!form.value.username) {
    return ElMessage.warning('账号不可为空')
  }
  if (!form.value.password) {
    return ElMessage.warning('请输入密码')
  }
  loading.value = true
  try {
    const res = await request.post('/auth/admin/login', {
      username: form.value.username,
      password: form.value.password
    })
    const data = res.data || {}
    const token = data.token || res.token
    if (token) {
      localStorage.setItem('admin_token', token)
      ElMessage.success('登录成功')
      const redirect = route.query.redirect
      router.push(typeof redirect === 'string' && redirect ? redirect : '/dashboard')
    } else {
      ElMessage.error('未返回令牌，请检查后端配置')
    }
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2d3a4b;
  background-image: url('../assets/login-bg.jpg');
  background-size: cover;
  background-position: center;
}

.login-box {
  width: 420px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2) !important;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}
.title {
  color: #303133;
  margin: 0 0 5px 0;
  font-size: 26px;
  letter-spacing: 2px;
}
.sub-title {
  color: #909399;
  font-size: 14px;
}
.login-btn {
  width: 100%;
  margin-top: 15px;
  font-weight: bold;
  font-size: 16px;
}

</style>
