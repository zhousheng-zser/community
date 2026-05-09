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
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header><span>待处理订单</span></template>
          <el-table :data="pendingOrders" size="small" style="width:100%">
            <el-table-column prop="order_no" label="订单号" width="160" show-overflow-tooltip />
            <el-table-column label="商品" min-width="120" show-overflow-tooltip>
              <template #default="s">{{ (s.row.items && s.row.items[0] && s.row.items[0].goods_name) || '-' }}</template>
            </el-table-column>
            <el-table-column label="金额" width="90">
              <template #default="s">¥{{ s.row.total_amount || s.row.amount }}</template>
            </el-table-column>
            <el-table-column label="操作" width="130">
              <template #default="s">
                <el-button size="small" type="primary" @click="acceptOrder(s.row)">接单</el-button>
                <el-button size="small" type="danger" plain @click="rejectOrder(s.row)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="hover">
          <template #header><span>库存预警</span></template>
          <el-table :data="lowStockGoods" size="small" style="width:100%">
            <el-table-column prop="name" label="商品名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="stock" label="库存" width="70">
              <template #default="s"><el-tag type="danger" size="small">{{ s.row.stock }}</el-tag></template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request.js'

const loading = ref(false)
const pendingOrders = ref([])
const lowStockGoods = ref([])

const cards = ref([
  { label: '今日订单', value: '-', icon: '📋', bg: '#f0fff4' },
  { label: '待处理', value: '-', icon: '⏳', bg: '#fef9e7' },
  { label: '在售商品', value: '-', icon: '📦', bg: '#ebf4ff' },
  { label: '库存预警', value: '-', icon: '⚠️', bg: '#fff5f5' }
])

async function load() {
  loading.value = true
  try {
    const res = await request.get('/merchant/dashboard')
    const d = res.data || {}
    cards.value[0].value = d.today_orders ?? '-'
    cards.value[1].value = d.pending_orders ?? '-'
    cards.value[2].value = d.on_sale_goods ?? '-'
    cards.value[3].value = d.low_stock_count ?? '-'
    lowStockGoods.value = d.low_stock_goods || []

    const ordRes = await request.get('/merchant/orders', { params: { status: 'pending_accept', limit: 5 } })
    const od = ordRes.data || {}
    pendingOrders.value = od.data || od.list || []
  } catch (e) { ElMessage.error(e.message) }
  finally { loading.value = false }
}

async function acceptOrder(row) {
  try {
    await request.post(`/merchant/orders/${row.order_no}/accept`)
    ElMessage.success('已接单')
    load()
  } catch (e) { ElMessage.error(e.message) }
}

async function rejectOrder(row) {
  try {
    await request.post(`/merchant/orders/${row.order_no}/cancel`)
    ElMessage.success('已拒绝')
    load()
  } catch (e) { ElMessage.error(e.message) }
}

onMounted(load)
</script>

<style scoped>
.dashboard { padding: 4px; }
.stats-row { margin-bottom: 4px; }
.stat-card :deep(.el-card__body) { display: flex; align-items: center; gap: 14px; padding: 18px 20px; }
.stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
.stat-num { font-size: 26px; font-weight: bold; color: #2d3748; line-height: 1; }
.stat-label { font-size: 13px; color: #718096; margin-top: 4px; }
</style>
