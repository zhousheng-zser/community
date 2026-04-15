<template>
  <div class="page-wrap">
    <div class="toolbar">
      <el-input v-model="shopId" placeholder="店铺ID筛选" style="width: 160px" />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button type="success" @click="openCreate">新增账号</el-button>
    </div>
    <el-table :data="rows" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="username" label="账号" width="140" />
      <el-table-column prop="shop_id" label="店铺ID" width="100" />
      <el-table-column label="店铺" min-width="120">
        <template #default="{ row }">{{ row.shop?.name || '-' }}</template>
      </el-table-column>
      <el-table-column prop="role" label="角色" width="100" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button link type="primary" @click="changeStatus(row, row.status === 'active' ? 'disabled' : 'active')">
            {{ row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
          <el-button link @click="resetPwd(row)">重置密码</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="新增商家账号" width="520px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="店铺ID"><el-input-number v-model="form.shop_id" :min="1" /></el-form-item>
        <el-form-item label="账号"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role">
            <el-option label="owner" value="owner" />
            <el-option label="manager" value="manager" />
            <el-option label="operator" value="operator" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submit">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const rows = ref([])
const shopId = ref('')
const visible = ref(false)
const form = reactive({ shop_id: 1, username: '', password: '', role: 'operator' })

async function load() {
  loading.value = true
  try {
    const params = {}
    if (shopId.value) params.shop_id = shopId.value
    const res = await request.get('/admin/merchant-accounts', { params })
    rows.value = res.data || []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}
function openCreate() { visible.value = true }
async function submit() {
  try {
    await request.post('/admin/merchant-accounts', { ...form })
    ElMessage.success('创建成功')
    visible.value = false
    await load()
  } catch (e) { ElMessage.error(e.message || '失败') }
}
async function changeStatus(row, status) {
  try {
    await request.put(`/admin/merchant-accounts/${row.id}`, { status })
    ElMessage.success('已更新')
    await load()
  } catch (e) { ElMessage.error(e.message || '失败') }
}
function resetPwd(row) {
  ElMessageBox.prompt('输入新密码', `重置 ${row.username}`, { inputValue: '' })
    .then(async ({ value }) => {
      await request.post(`/admin/merchant-accounts/${row.id}/reset-password`, { password: value })
      ElMessage.success('已重置')
    })
    .catch(() => {})
}
onMounted(load)
</script>

<style scoped>
.page-wrap { background: #fff; padding: 16px; border-radius: 8px; }
.toolbar { display: flex; gap: 10px; margin-bottom: 12px; }
</style>
