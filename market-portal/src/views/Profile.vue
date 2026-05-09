<template>
  <div class="page-wrap">
    <el-card shadow="never">
      <template #header>
        <div class="card-hd">
          <span>店铺资料</span>
          <el-button type="primary" :loading="saving" @click="save">保存修改</el-button>
        </div>
      </template>
      <el-form :model="form" label-width="110px" v-loading="loading">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="店铺名称"><el-input v-model="form.name" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人"><el-input v-model="form.contact_name" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话"><el-input v-model="form.contact_phone" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业时间"><el-input v-model="form.business_hours" placeholder="09:00-21:00" /></el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="店铺地址"><el-input v-model="form.address" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Logo图片URL"><el-input v-model="form.logo" placeholder="https://..." /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经营分类"><el-input v-model="form.category" placeholder="如：生鲜/零食/日用品" /></el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="店铺简介">
              <el-input v-model="form.description" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider />
        <el-form-item label="审核状态">
          <el-tag :type="statusType(form.status)">{{ statusLabel(form.status) }}</el-tag>
          <span v-if="form.reject_reason" class="reject-tip">拒因：{{ form.reject_reason }}</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request.js'

const loading = ref(false)
const saving = ref(false)
const form = ref({})

const STATUS = {
  pending: { label: '审核中', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  active: { label: '正常营业', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  inactive: { label: '已停用', type: 'info' }
}
function statusLabel(s) { return (STATUS[s] || {}).label || s }
function statusType(s) { return (STATUS[s] || {}).type || 'info' }

async function load() {
  loading.value = true
  try {
    const res = await request.get('/merchant/shop')
    form.value = res.data || {}
  } catch (e) { ElMessage.error(e.message) }
  finally { loading.value = false }
}

async function save() {
  saving.value = true
  try {
    await request.patch('/merchant/shop', {
      name: form.value.name,
      contact_name: form.value.contact_name,
      contact_phone: form.value.contact_phone,
      address: form.value.address,
      business_hours: form.value.business_hours,
      logo: form.value.logo,
      category: form.value.category,
      description: form.value.description
    })
    ElMessage.success('已保存')
    const info = JSON.parse(localStorage.getItem('market_shop_info') || '{}')
    info.name = form.value.name || info.name
    localStorage.setItem('market_shop_info', JSON.stringify(info))
  } catch (e) { ElMessage.error(e.message) }
  finally { saving.value = false }
}

onMounted(load)
</script>

<style scoped>
.page-wrap { padding: 4px; }
.card-hd { display: flex; justify-content: space-between; align-items: center; }
.reject-tip { color: #e53e3e; font-size: 13px; margin-left: 12px; }
</style>
