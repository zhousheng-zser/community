<template>
  <div class="page-wrap">
    <div class="toolbar">
      <el-select v-model="status" clearable placeholder="状态" style="width: 140px" @change="load">
        <el-option label="open" value="open" />
        <el-option label="processing" value="processing" />
        <el-option label="resolved" value="resolved" />
        <el-option label="closed" value="closed" />
      </el-select>
      <el-button @click="createVisible = true">新增工单</el-button>
    </div>
    <el-table :data="rows" v-loading="loading" border stripe>
      <el-table-column prop="ticket_no" label="工单号" min-width="160" />
      <el-table-column prop="order_no" label="订单号" width="140" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column prop="content" label="内容" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link @click="resolve(row, 'processing')">跟进</el-button>
          <el-button link type="success" @click="resolve(row, 'resolved')">解决</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="createVisible" title="新增投诉工单" width="520px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="订单号"><el-input v-model="form.order_no" /></el-form-item>
        <el-form-item label="类型"><el-input v-model="form.type" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const rows = ref([])
const status = ref('')
const createVisible = ref(false)
const form = reactive({ order_no: '', type: 'order', content: '' })

async function load() {
  loading.value = true
  try {
    const params = {}
    if (status.value) params.status = status.value
    const res = await request.get('/admin/complaint-tickets', { params })
    rows.value = res.data || []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally { loading.value = false }
}
async function submitCreate() {
  try {
    await request.post('/admin/complaint-tickets', { ...form })
    ElMessage.success('已创建')
    createVisible.value = false
    await load()
  } catch (e) { ElMessage.error(e.message || '失败') }
}
async function resolve(row, nextStatus) {
  try {
    await request.put(`/admin/complaint-tickets/${row.id}`, { status: nextStatus })
    ElMessage.success('已更新')
    await load()
  } catch (e) { ElMessage.error(e.message || '失败') }
}
onMounted(load)
</script>

<style scoped>
.page-wrap { background: #fff; padding: 16px; border-radius: 8px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
</style>
