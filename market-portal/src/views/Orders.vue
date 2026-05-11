<template>
  <div class="page-wrap">
    <el-card shadow="never">
      <template #header>
        <div class="card-hd">
          <span>订单管理</span>
          <div class="toolbar">
            <el-select v-model="filter.order_status" placeholder="全部状态" clearable style="width:150px" @change="load">
              <el-option label="待接单" value="pending_accept" />
              <el-option label="备货中" value="pending_service" />
              <el-option label="待收货" value="pending_receipt" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
              <el-option label="已退款" value="refunded" />
            </el-select>
            <el-button @click="load">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="list" border stripe v-loading="loading" style="width:100%">
        <el-table-column prop="order_no" label="订单号" width="180" show-overflow-tooltip />
        <el-table-column label="商品" min-width="150" show-overflow-tooltip>
          <template #default="s">
            {{ (s.row.items && s.row.items.map(i => i.goods_name).join('、')) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="买家" width="120">
          <template #default="s">{{ s.row.buyer_nickname || s.row.receiver_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="90">
          <template #default="s">¥{{ s.row.payable_amount || s.row.goods_amount || '0' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="s">
            <el-tag :type="statusTagType(s.row.order_status)">{{ statusLabel(s.row.order_status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="160">
          <template #default="s">{{ fmt(s.row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="s">
            <el-button size="small" @click="openDetail(s.row)">详情</el-button>
            <el-button v-if="s.row.order_status === 'pending_accept'" size="small" type="primary" @click="doAction(s.row, 'accept')">接单</el-button>
            <el-button v-if="s.row.order_status === 'pending_accept'" size="small" type="danger" plain @click="doAction(s.row, 'cancel')">拒绝</el-button>
            <el-button v-if="s.row.order_status === 'pending_service'" size="small" type="success" @click="doAction(s.row, 'ship')">发货</el-button>
            <el-tag v-if="s.row.order_status === 'pending_receipt'" size="small" type="info">等待买家确认收货</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" layout="prev, pager, next, total" style="margin-top:14px"
        @current-change="load" @size-change="load" />
    </el-card>

    <el-dialog v-model="detailVisible" title="订单详情" width="580px">
      <div v-if="detailRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ detailRow.order_no }}</el-descriptions-item>
          <el-descriptions-item label="买家">{{ detailRow.buyer_nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ detailRow.receiver_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detailRow.receiver_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收货地址">{{ detailRow.receiver_address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="总金额">¥{{ detailRow.payable_amount || detailRow.goods_amount || '0' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(detailRow.order_status)">{{ statusLabel(detailRow.order_status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ detailRow.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ fmt(detailRow.created_at) }}</el-descriptions-item>
        </el-descriptions>
        <el-table v-if="detailRow.items && detailRow.items.length" :data="detailRow.items" style="margin-top:12px" size="small" border>
          <el-table-column prop="goods_name" label="商品" min-width="150" />
          <el-table-column prop="quantity" label="数量" width="70" />
          <el-table-column label="单价" width="90"><template #default="s">¥{{ s.row.unit_price }}</template></el-table-column>
          <el-table-column label="小计" width="90"><template #default="s">¥{{ s.row.amount }}</template></el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request.js'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filter = ref({ order_status: '' })
const detailVisible = ref(false)
const detailRow = ref(null)

const STATUS_MAP = {
  pending_payment: { label: '待支付', type: 'info' },
  pending_accept: { label: '待接单', type: 'warning' },
  pending_service: { label: '备货中', type: '' },
  pending_receipt: { label: '待收货', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'danger' },
  refunded: { label: '已退款', type: 'danger' }
}
function statusLabel(s) { return (STATUS_MAP[s] || {}).label || s || '-' }
function statusTagType(s) { return (STATUS_MAP[s] || {}).type || 'info' }
function fmt(d) {
  if (!d) return '-'
  const s = new Date(d).toLocaleString('zh-CN', { hour12: false })
  return s === 'Invalid Date' ? String(d) : s
}

async function load() {
  loading.value = true
  try {
    const res = await request.get('/merchant/orders', {
      params: { order_status: filter.value.order_status || undefined, page: page.value, limit: pageSize.value }
    })
    const d = res.data || {}
    list.value = d.data || d.list || []
    total.value = d.total || 0
  } catch (e) { ElMessage.error(e.message) }
  finally { loading.value = false }
}

function openDetail(row) { detailRow.value = row; detailVisible.value = true }

const ACTION_LABELS = { accept: '接单', cancel: '拒绝', ship: '发货', 'complete-delivery': '确认送达' }
async function doAction(row, action) {
  const label = ACTION_LABELS[action] || action
  try {
    await ElMessageBox.confirm(`确认执行【${label}】？`, '确认', { type: 'warning' })
    await request.post(`/merchant/orders/${row.order_no}/${action}`)
    ElMessage.success(`${label}成功`)
    load()
  } catch {}
}

onMounted(load)
</script>

<style scoped>
.page-wrap { padding: 4px; }
.card-hd { display: flex; justify-content: space-between; align-items: center; }
.toolbar { display: flex; gap: 10px; align-items: center; }
</style>
