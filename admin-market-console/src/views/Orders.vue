<template>
  <div class="merchant-page">
    <div class="page-intro merchant-card">
      <h1 class="merchant-page-title">订单与履约</h1>
      <p class="merchant-page-desc" style="margin-bottom: 0">
        按状态筛选订单，进入详情可接单、发货与完成。支付与顾客信息以平台脱敏规则展示。
      </p>
    </div>
    <div class="toolbar merchant-card">
      <span class="sub-h">筛选</span>
      <div class="filters">
        <el-select v-model="filterStatus" clearable placeholder="订单状态" style="width: 160px" @change="reload">
          <el-option label="待付款" value="pending_payment" />
          <el-option label="待接单" value="pending_accept" />
          <el-option label="备货/出餐中" value="pending_service" />
          <el-option label="待收货" value="pending_receipt" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
          <el-option label="已退款" value="refunded" />
        </el-select>
        <el-select v-model="filterPay" clearable placeholder="支付状态" style="width: 140px" @change="reload">
          <el-option label="未支付" value="unpaid" />
          <el-option label="已支付" value="paid" />
          <el-option label="退款中" value="refund_pending" />
          <el-option label="已退款" value="refunded" />
        </el-select>
        <el-button @click="reload">刷新</el-button>
      </div>
    </div>
    <el-table v-loading="loading" :data="list" stripe class="table-card merchant-card">
      <el-table-column prop="order_no" label="订单号" min-width="168">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push('/orders/' + row.order_no)">{{ row.order_no }}</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="order_status_text" label="状态" width="110" />
      <el-table-column prop="pay_status" label="支付" width="90" />
      <el-table-column prop="payable_amount" label="实付" width="90" />
      <el-table-column prop="receiver_name" label="收货人" width="90" />
      <el-table-column prop="buyer_phone_masked" label="用户手机" width="120" />
      <el-table-column prop="item_count" label="件数" width="60" />
      <el-table-column prop="created_at" label="下单时间" width="170">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="商品摘要" min-width="200">
        <template #default="{ row }">
          <span class="ellipsis">{{ itemSummary(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push('/orders/' + row.order_no)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="page"
      :page-size="limit"
      :total="total"
      layout="total, prev, pager, next"
      class="mt"
      @current-change="load"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const filterStatus = ref('')
const filterPay = ref('')

function formatTime(v) {
  if (!v) return ''
  return new Date(v).toLocaleString('zh-CN')
}

function itemSummary(row) {
  const items = row.items || []
  return items.map((i) => `${i.goods_name}×${i.quantity}`).join('；')
}

function reload() {
  page.value = 1
  load()
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    if (filterStatus.value) params.order_status = filterStatus.value
    if (filterPay.value) params.pay_status = filterPay.value
    const { data } = await request.get('/market/merchant/orders', { params })
    if (data.code !== 0 && data.errno !== 0) {
      ElMessage.error(data.msg || data.errmsg || '加载失败')
      return
    }
    const d = data.data || {}
    list.value = d.list || []
    total.value = d.total || 0
  } catch (_) {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page-intro {
  padding: 20px 22px;
  margin-bottom: 16px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 18px;
}
.sub-h {
  font-size: 13px;
  color: #909399;
  margin-right: 8px;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
h2 {
  margin: 0;
  font-size: 20px;
}
.table-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}
.mt {
  margin-top: 16px;
  justify-content: flex-end;
}
.ellipsis {
  display: inline-block;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
