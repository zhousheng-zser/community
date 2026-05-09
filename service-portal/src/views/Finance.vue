<template>
  <div class="page-wrap">
    <el-row :gutter="16" v-loading="loading">
      <el-col :span="8">
        <el-card shadow="hover" class="sum-card">
          <div class="sum-label">本月收入</div>
          <div class="sum-num">¥ {{ summary.month_income || '0.00' }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="sum-card">
          <div class="sum-label">待结算</div>
          <div class="sum-num text-warn">¥ {{ summary.pending_income || '0.00' }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="sum-card">
          <div class="sum-label">累计收入</div>
          <div class="sum-num text-success">¥ {{ summary.total_income || '0.00' }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top:16px">
      <template #header><span>收入明细</span></template>
      <el-table :data="incomeList" border stripe style="width:100%">
        <el-table-column prop="id" label="ID" width="65" />
        <el-table-column label="订单号" min-width="160" show-overflow-tooltip>
          <template #default="s">{{ s.row.order_no || s.row.order_id || '-' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="110">
          <template #default="s">¥{{ s.row.amount }}</template>
        </el-table-column>
        <el-table-column label="类型" width="90">
          <template #default="s">
            <el-tag size="small">{{ s.row.type || '服务收入' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="170">
          <template #default="s">{{ fmt(s.row.created_at) }}</template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" layout="prev, pager, next, total" style="margin-top:14px"
        @current-change="loadList" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request.js'

const loading = ref(false)
const summary = ref({})
const incomeList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

function fmt(d) {
  if (!d) return '-'
  const s = new Date(d).toLocaleString('zh-CN', { hour12: false })
  return s === 'Invalid Date' ? String(d) : s
}

async function loadSummary() {
  try {
    const res = await request.get('/service-provider/finance/income/summary')
    summary.value = res.data || {}
  } catch {}
}

async function loadList() {
  try {
    const res = await request.get('/service-provider/finance/income/list', { params: { page: page.value, limit: pageSize.value } })
    const d = res.data || {}
    incomeList.value = d.data || d.list || []
    total.value = d.total || 0
  } catch (e) { ElMessage.error(e.message) }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([loadSummary(), loadList()])
  loading.value = false
})
</script>

<style scoped>
.page-wrap { padding: 4px; }
.sum-card :deep(.el-card__body) { text-align: center; padding: 24px; }
.sum-label { font-size: 14px; color: #718096; margin-bottom: 10px; }
.sum-num { font-size: 32px; font-weight: bold; color: #2d3748; }
.text-warn { color: #d69e2e !important; }
.text-success { color: #38a169 !important; }
</style>
