<template>
  <div class="page-wrap">
    <el-form :inline="true" class="filter">
      <el-form-item label="开始">
        <el-date-picker v-model="from" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="结束">
        <el-date-picker v-model="to" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">对账查询</el-button>
      </el-form-item>
      <el-form-item>
        <el-button @click="generate">生成结算预览</el-button>
      </el-form-item>
      <el-form-item>
        <el-button @click="exportCsv">导出 CSV</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="12" class="summary">
      <el-col :span="6"><el-card>订单数：{{ summary.order_count || 0 }}</el-card></el-col>
      <el-col :span="6"><el-card>实收：￥{{ Number(summary.paid_amount || 0).toFixed(2) }}</el-card></el-col>
      <el-col :span="6"><el-card>退款：￥{{ Number(summary.refund_amount || 0).toFixed(2) }}</el-card></el-col>
      <el-col :span="6"><el-card>净额：￥{{ Number(summary.net_amount || 0).toFixed(2) }}</el-card></el-col>
    </el-row>

    <el-table :data="rows" border stripe>
      <el-table-column prop="shop_id" label="店铺ID" width="100" />
      <el-table-column prop="order_count" label="订单数" width="100" />
      <el-table-column prop="payable_sum" label="应收金额" />
    </el-table>
    <el-drawer v-model="previewVisible" title="结算预览" size="50%">
      <pre class="json">{{ JSON.stringify(preview, null, 2) }}</pre>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const from = ref('')
const to = ref('')
const rows = ref([])
const summary = ref({})
const preview = ref({})
const previewVisible = ref(false)

async function load() {
  try {
    const params = {}
    if (from.value) params.from = from.value
    if (to.value) params.to = to.value
    const [s, list] = await Promise.all([
      request.get('/admin/reconcile/summary', { params }),
      request.get('/admin/settlements', { params })
    ])
    summary.value = s.data || {}
    rows.value = list.data || []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

async function generate() {
  try {
    const res = await request.post('/admin/settlements/generate', { from: from.value || null, to: to.value || null })
    preview.value = res.data || {}
    previewVisible.value = true
  } catch (e) {
    ElMessage.error(e.message || '生成失败')
  }
}

async function exportCsv() {
  try {
    const res = await request.get('/admin/settlements/export/csv', { responseType: 'blob' })
    const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'settlement.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error(e.message || '导出失败')
  }
}
</script>

<style scoped>
.page-wrap { background: #fff; padding: 16px; border-radius: 8px; }
.filter { margin-bottom: 12px; }
.summary { margin-bottom: 12px; }
.json { white-space: pre-wrap; font-size: 12px; }
</style>
