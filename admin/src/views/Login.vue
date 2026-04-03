<template>
  <div class="login-container">
    <el-card class="login-box" shadow="always">
      <div class="header">
        <h2 class="title">九州社区·云商中台</h2>
        <span class="sub-title">系统管理员入口</span>
      </div>

      <el-form label-position="top">
        <el-form-item label="企业管理员账号">
          <el-input v-model="form.username" size="large" placeholder="请输入店长/运营账号">
            <template #prefix>
              <el-icon><user /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="授权密令">
          <el-input v-model="form.password" type="password" size="large" placeholder="请输入密码" show-password @keyup.enter="handleLogin">
            <template #prefix>
              <el-icon><lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-button 
          type="primary" 
          size="large" 
          class="login-btn" 
          :loading="loading"
          @click="handleLogin"
        >
          安全登入系统
        </el-button>
      </el-form>
      
      <div class="footer-tips">
        温馨提示: 这是为管理员设计的独立于小程序的 PC 端控制台
      </div>
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
  username: 'admin',
  password: ''
})

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    return ElMessage.warning('账号与密码不可为空')
  }
  loading.value = true
  try {
    const res = await request.post('/admin/login', {
      username: form.value.username,
      password: form.value.password
    })
    const data = res.data || {}
    if (data.token) {
      localStorage.setItem('admin_token', data.token)
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
  background-image: url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80');
  background-size: cover;
  background-position: center;
}

.login-box {
  width: 420px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.2) !important;
}

.header { text-align: center; margin-bottom: 30px; }
.title {
  color: #303133;
  margin: 0 0 5px 0;
  font-size: 26px;
  letter-spacing: 2px;
}
.sub-title { color: #909399; font-size: 14px; }
.login-btn { width: 100%; margin-top: 15px; font-weight: bold; font-size: 16px; }

.footer-tips {
  margin-top: 25px;
  text-align: center;
  font-size: 12px;
  color: #a8abb2;
}
</style>
