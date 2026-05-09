<template>
  <div class="page-wrap">
    <el-card shadow="never">
      <template #header>
        <div class="card-hd">
          <span>退款管理</span>
          <el-button @click="load">刷新</el-button>
        </div>
      </template>

      <el-table :data="list" border stripe v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="65" />
        <el-table-column label="订单号" width="180" show-overflow-tooltip>
          <template #default="s">{{ s.row.order_no || (s.row.order && s.row.order.order_no) || '-' }}</template>
        </el-table-column>
        <el-table-column label="买家" width="120">
          <template #default="s">{{ (s.row.user && (s.row.user.nickname || s.row.user.phone)) || '-' }}</template>
        </el-table-column>
        <el-table-column label="退款金额" width="110">
          <template #default="s">¥{{ s.row.refund_amount || s.row.amount }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="退款原因" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="s">
            <el-tag :type="refundTagType(s.row.status)">{{ refundLabel(s.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="160">
          <template #default="s">{{ fmt(s.row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="s">
            <template v-if="s.row.status === 'pending'">
              <el-button size="small" type="success" @click="approve(s.row)">同意退款</el-button>
              <el-button size="small" type="danger" plain @click="reject(s.row)">拒绝</el-button>
            </template>
            <span v-else class="settled">已处理</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" layout="prev, pager, next, total" style="margin-top:14px"
        @current-change="load" @size-change="load" />
    </el-card>
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

const REFUND_MAP = {
  pending: { label: '待处理', type: 'warning' },
  approved: { label: '已同意', type: 'success' },
  rejected: { label: '已拒绝', type: 'danger' },
  completed: { label: '已退款', type: 'success' },
  cancelled: { label: '已撤销', type: 'info' }
}
function refundLabel(s) { return (REFUND_MAP[s] || {}).label || s }
function refundTagType(s) { return (REFUND_MAP[s] || {}).type || 'info' }
function fmt(d) {
  if (!d) return '-'
  const s = new Date(d).toLocaleString('zh-CN', { hour12: false })
  return s === 'Invalid Date' ? String(d) : s
}

async function load() {
  loading.value = true
  try {
    const res = await request.get('/merchant/refunds/list', { params: { page: page.value, limit: pageSize.value } })
    const d = res.data || {}
    list.value = d.data || d.list || []
    total.value = d.total || 0
  } catch (e) { ElMessage.error(e.message) }
  finally { loading.value = false }
}

async function approve(row) {
  try {
    await ElMessageBox.confirm('确认同意该退款申请？退款后积分将同步扣除。', '确认退款', { type: 'warning' })
    await request.post(`/merchant/refunds/${row.id}/approve`)
    ElMessage.success('已同意退款')
    load()
  } catch {}
}

async function reject(row) {
  try {
    const { value: reason } = await ElMessageBox.prompt('请填写拒绝原因', '拒绝退款', {
      confirmButtonText: '确认拒绝', cancelButtonText: '取消', inputPlaceholder: '选填'
    })
    await request.post(`/merchant/refunds/${row.id}/reject`, { reason })
    ElMessage.success('已拒绝')
    load()
  } catch {}
}

onMounted(load)
</script>

<style scoped>
.page-wrap { padding: 4px; }
.card-hd { display: flex; justify-content: space-between; align-items: center; }
.settled { color: #a0aec0; font-size: 13px; }
</style>
