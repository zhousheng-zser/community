<template>
  <div class="page-wrap">
    <el-form :inline="true" class="filter">
      <el-form-item label="订单号">
        <el-input v-model="orderNo" style="width: 180px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form-item>
      <el-form-item>
        <el-button @click="openApply">创建退款单</el-button>
      </el-form-item>
      <el-form-item>
        <el-button @click="exportCsv">导出 CSV</el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="refund_no" label="退款单号" min-width="160" />
      <el-table-column prop="order_no" label="订单号" min-width="150" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column prop="refund_amount" label="退款金额" width="100" />
      <el-table-column prop="reason" label="原因" min-width="140" show-overflow-tooltip />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button link type="success" @click="review(row, 'approve')" :disabled="row.status !== 'pending'">通过</el-button>
          <el-button link type="danger" @click="review(row, 'reject')" :disabled="row.status !== 'pending'">驳回</el-button>
          <el-button link type="primary" @click="execute(row, true)" :disabled="!['approved','processing'].includes(row.status)">执行成功</el-button>
          <el-button link @click="detail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="applyVisible" title="创建退款单" width="520px">
      <el-form :model="applyForm" label-width="100px">
        <el-form-item label="订单号"><el-input v-model="applyForm.order_no" /></el-form-item>
        <el-form-item label="退款金额"><el-input-number v-model="applyForm.refund_amount" :min="0" :step="0.01" /></el-form-item>
        <el-form-item label="原因"><el-input v-model="applyForm.reason" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApply">提交</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawer" title="退款详情" size="45%">
      <pre class="json">{{ JSON.stringify(detailData, null, 2) }}</pre>
    </el-drawer>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const rows = ref([])
const orderNo = ref('')
const applyVisible = ref(false)
const drawer = ref(false)
const detailData = ref(null)
const applyForm = reactive({ order_no: '', refund_amount: 0, reason: '' })

async function load() {
  loading.value = true
  try {
    const params = {}
    if (orderNo.value) params.order_no = orderNo.value
    const res = await request.get('/admin/refunds', { params })
    rows.value = res.data || []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function openApply() {
  applyForm.order_no = ''
  applyForm.refund_amount = 0
  applyForm.reason = ''
  applyVisible.value = true
}

async function submitApply() {
  try {
    await request.post('/admin/refunds/apply', { ...applyForm })
    ElMessage.success('已创建')
    applyVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '创建失败')
  }
}

async function review(row, action) {
  try {
    await request.post(`/admin/refunds/${row.id}/review`, { action })
    ElMessage.success('已审核')
    await load()
  } catch (e) {
    ElMessage.error(e.message || '失败')
  }
}

async function execute(row, success) {
  try {
    await request.post(`/admin/refunds/${row.id}/execute`, { success })
    ElMessage.success('已执行')
    await load()
  } catch (e) {
    ElMessage.error(e.message || '失败')
  }
}

async function detail(row) {
  try {
    const res = await request.get(`/admin/refunds/${row.id}`)
    detailData.value = res.data || {}
    drawer.value = true
  } catch (e) {
    ElMessage.error(e.message || '失败')
  }
}

async function exportCsv() {
  try {
    const res = await request.get('/admin/refunds/export/csv', { responseType: 'blob' })
    const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'refunds.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error(e.message || '导出失败')
  }
}

onMounted(load)
</script>

<style scoped>
.page-wrap { background: #fff; padding: 16px; border-radius: 8px; }
.filter { margin-bottom: 12px; }
.json { white-space: pre-wrap; word-break: break-word; font-size: 12px; }
</style>
