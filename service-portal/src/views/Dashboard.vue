<template>
  <div class="dashboard">
    <el-row :gutter="16" class="stats-row" v-loading="loading">
      <el-col :span="6" v-for="c in cards" :key="c.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ background: c.bg }">{{ c.icon }}</div>
          <div class="stat-body">
            <div class="stat-num">{{ c.value }}</div>
            <div class="stat-label">{{ c.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>待处理订单</span></template>
          <el-table :data="pendingOrders" size="small" style="width:100%">
            <el-table-column prop="order_no" label="订单号" width="150" show-overflow-tooltip />
            <el-table-column label="服务" min-width="120">
              <template #default="s">{{ (s.row.service && s.row.service.title) || s.row.goods_name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="80">
              <template #default="s">¥{{ s.row.amount }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="s">
                <el-button size="small" type="primary" @click="goAccept(s.row)">接单</el-button>
                <el-button size="small" type="danger" plain @click="goReject(s.row)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>本月收入（元）</span></template>
          <div class="income-chart">
            <div class="income-big">¥ {{ dash.month_income || '0.00' }}</div>
            <div class="income-sub">待结算 ¥{{ dash.pending_income || '0.00' }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request.js'

const router = useRouter()
const loading = ref(false)
const dash = ref({})
const pendingOrders = ref([])

const cards = ref([
  { label: '今日订单', value: '-', icon: '📋', bg: '#ebf4ff' },
  { label: '待接单', value: '-', icon: '⏳', bg: '#fef9e7' },
  { label: '服务项目', value: '-', icon: '🔧', bg: '#eafaf1' },
  { label: '技工数量', value: '-', icon: '👷', bg: '#fdf2f8' }
])

async function load() {
  loading.value = true
  try {
    const res = await request.get('/service-provider/dashboard')
    const d = res.data || {}
    dash.value = d
    cards.value[0].value = d.today_orders ?? '-'
    cards.value[1].value = d.pending_orders ?? '-'
    cards.value[2].value = d.services_count ?? '-'
    cards.value[3].value = d.workers_count ?? '-'
    // 获取待接单
    const ordRes = await request.get('/service-provider/orders', { params: { status: 'pending_accept', limit: 5 } })
    const od = ordRes.data || {}
    pendingOrders.value = od.data || od.list || []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function goAccept(row) {
  try {
    await request.post(`/service-provider/orders/${row.id}/accept`)
    ElMessage.success('已接单')
    load()
  } catch (e) { ElMessage.error(e.message) }
}

async function goReject(row) {
  try {
    await request.post(`/service-provider/orders/${row.id}/reject`)
    ElMessage.success('已拒绝')
    load()
  } catch (e) { ElMessage.error(e.message) }
}

onMounted(load)
</script>

<style scoped>
.dashboard { padding: 4px; }
.stats-row { margin-bottom: 4px; }
.stat-card { display: flex; align-items: center; }
.stat-card :deep(.el-card__body) { display: flex; align-items: center; gap: 14px; padding: 18px 20px; }
.stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
.stat-num { font-size: 26px; font-weight: bold; color: #2d3748; line-height: 1; }
.stat-label { font-size: 13px; color: #718096; margin-top: 4px; }
.income-chart { text-align: center; padding: 30px 0; }
.income-big { font-size: 40px; font-weight: bold; color: #2b6cb0; }
.income-sub { font-size: 13px; color: #a0aec0; margin-top: 8px; }
</style>
