<template>
  <div class="page-wrap">
    <el-card shadow="never">
      <template #header>
        <div class="card-hd">
          <span>订单管理</span>
          <div class="toolbar">
            <el-select v-model="filter.status" placeholder="全部状态" clearable style="width:150px" @change="load">
              <el-option label="待接单" value="pending_accept" />
              <el-option label="待上门" value="paid_pending_dispatch" />
              <el-option label="服务中" value="in_service" />
              <el-option label="待用户确认" value="pending_user_confirm" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
            <el-button @click="load">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="list" border stripe v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="65" />
        <el-table-column prop="order_no" label="订单号" width="160" show-overflow-tooltip />
        <el-table-column label="服务" min-width="140">
          <template #default="s">{{ (s.row.service && s.row.service.title) || s.row.goods_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="客户" width="120">
          <template #default="s">{{ (s.row.buyer && (s.row.buyer.nickname || s.row.buyer.phone)) || s.row.contact_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="90">
          <template #default="s">¥{{ s.row.amount }}</template>
        </el-table-column>
        <el-table-column label="预约时间" width="160">
          <template #default="s">{{ fmt(s.row.appointment_time) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="s">
            <el-tag :type="statusTagType(s.row.status)">{{ statusLabel(s.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="s">
            <el-button size="small" @click="openDetail(s.row)">详情</el-button>
            <el-button v-if="s.row.status === 'pending_accept'" size="small" type="primary" @click="doAction(s.row, 'accept')">接单</el-button>
            <el-button v-if="s.row.status === 'pending_accept'" size="small" type="danger" plain @click="doAction(s.row, 'reject')">拒绝</el-button>
            <el-button v-if="s.row.status === 'paid_pending_dispatch'" size="small" type="success" @click="doAction(s.row, 'check-in')">到达打卡</el-button>
            <el-button v-if="s.row.status === 'in_service'" size="small" type="primary" @click="doAction(s.row, 'complete')">完成服务</el-button>
            <el-button v-if="s.row.status === 'pending_user_confirm'" size="small" type="info" disabled>待用户确认</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" layout="prev, pager, next, total" style="margin-top:14px"
        @current-change="load" @size-change="load" />
    </el-card>

    <el-dialog v-model="detailVisible" title="订单详情" width="560px">
      <el-descriptions :column="1" border v-if="detailRow">
        <el-descriptions-item label="订单号">{{ detailRow.order_no || detailRow.id }}</el-descriptions-item>
        <el-descriptions-item label="服务项目">{{ (detailRow.service && detailRow.service.title) || detailRow.goods_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ (detailRow.buyer && (detailRow.buyer.nickname || detailRow.buyer.phone)) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detailRow.contact_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailRow.contact_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ detailRow.amount }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ detailRow.qty || 1 }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">{{ fmt(detailRow.appointment_time) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(detailRow.status)">{{ statusLabel(detailRow.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailRow.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ fmt(detailRow.created_at) }}</el-descriptions-item>
      </el-descriptions>
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
const filter = ref({ status: '' })
const detailVisible = ref(false)
const detailRow = ref(null)

const STATUS_MAP = {
  pending_pay: { label: '待支付', type: 'info' },
  pending_accept: { label: '待接单', type: 'warning' },
  paid_pending_dispatch: { label: '待上门', type: 'warning' },
  in_service: { label: '服务中', type: 'primary' },
  pending_user_confirm: { label: '待确认', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'danger' },
  refunded: { label: '已退款', type: 'danger' }
}
function statusLabel(s) { return (STATUS_MAP[s] || {}).label || s }
function statusTagType(s) { return (STATUS_MAP[s] || {}).type || 'info' }
function fmt(d) {
  if (!d) return '-'
  const s = new Date(d).toLocaleString('zh-CN', { hour12: false })
  return s === 'Invalid Date' ? String(d) : s
}

async function load() {
  loading.value = true
  try {
    const res = await request.get('/service-provider/orders', {
      params: { status: filter.value.status || undefined, page: page.value, limit: pageSize.value }
    })
    const d = res.data || {}
    list.value = d.data || d.list || []
    total.value = d.total || 0
  } catch (e) { ElMessage.error(e.message) }
  finally { loading.value = false }
}

function openDetail(row) { detailRow.value = row; detailVisible.value = true }

const ACTION_LABELS = { accept: '接单', reject: '拒绝', 'check-in': '到达打卡', complete: '完成服务' }
async function doAction(row, action) {
  const label = ACTION_LABELS[action] || action
  try {
    await ElMessageBox.confirm(`确认执行【${label}】？`, '确认', { type: 'warning' })
    await request.post(`/service-provider/orders/${row.id}/${action}`)
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
