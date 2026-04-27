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
        
        <el-form-item label="授权密令（测试免密时可留空）">
          <el-input v-model="form.password" type="password" size="large" placeholder="测试阶段服务端开启 ADMIN_TEST_BYPASS=1 时可不填" show-password @keyup.enter="handleLogin">
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
        <p>管理员入口与小程序账号无关。</p>
        <p v-if="isDevProxy" class="tip-remote">
          当前通过代理访问远程 API。测试免密：在服务器 <code>backend/.env</code> 设置 <code>ADMIN_TEST_BYPASS=1</code> 后重启 Node，用户名填
          <code>ADMIN_USERNAME</code>（默认 admin）即可，密码可留空。正式环境务必关闭该项并配置强密码。
        </p>
        <p v-else>温馨提示：密码以运行后端的机器上环境变量为准。</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

const isDevProxy = computed(() => {
  const t = import.meta.env.VITE_PROXY_TARGET || ''
  return t.includes('114.55') || t.includes('http://') && !t.includes('127.0.0.1') && !t.includes('localhost')
})

const form = ref({
  username: 'admin',
  password: ''
})

const handleLogin = async () => {
  if (!form.value.username) {
    return ElMessage.warning('账号不可为空')
  }
  loading.value = true
  try {
    const res = await request.post('/auth/admin/login', {
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
  line-height: 1.5;
}
.footer-tips p {
  margin: 6px 0;
}
.tip-remote {
  text-align: left;
  color: #606266;
  font-size: 11px;
}
.tip-remote code {
  font-size: 10px;
  background: #f4f4f5;
  padding: 0 4px;
  border-radius: 3px;
}
</style>
