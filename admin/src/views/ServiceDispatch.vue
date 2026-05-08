<template>
  <div class="dispatch-wrap">
    <div class="header-box">
      <h3>到家服务 · 待派单队列</h3>
      <el-alert
        title="展示已支付且无指派技工的平台订单。填写技工用户 user_id（与技工微信登录账号一致，且须已通过入驻审核）后派单；派单后订单进入技工端列表。"
        type="info"
        show-icon
      />
    </div>
    <el-table :data="list" border stripe v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="订单ID" width="90" />
      <el-table-column prop="order_no" label="单号" min-width="160" show-overflow-tooltip />
      <el-table-column prop="service_title" label="服务" min-width="160" show-overflow-tooltip />
      <el-table-column prop="user_id" label="用户ID" width="90" />
      <el-table-column prop="contact_name" label="联系人" width="90" />
      <el-table-column prop="contact_phone" label="电话" width="120" />
      <el-table-column prop="pay_amount" label="金额" width="90" />
      <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
      <el-table-column prop="created_at" label="下单时间" width="170">
        <template #default="scope">{{ fmt(scope.row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="指派技工 user_id" width="200" fixed="right">
        <template #default="scope">
          <el-input
            v-model="assignInputs[scope.row.id]"
            size="small"
            placeholder="worker 用户 ID"
            style="width: 120px; margin-right: 6px"
          />
          <el-button type="primary" size="small" @click="assign(scope.row)">派单</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="toolbar">
      <el-button @click="load" :loading="loading">刷新</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request.js'

const list = ref([])
const loading = ref(false)
const assignInputs = reactive({})

function fmt(d) {
  if (!d) return '-'
  const s = new Date(d).toLocaleString('zh-CN', { hour12: false })
  return s === 'Invalid Date' ? String(d) : s
}

async function load() {
  loading.value = true
  try {
    const res = await request.get('/admin/dispatch-queue')
    const data = res.data || {}
    list.value = data.list || []
    list.value.forEach((row) => {
      if (!(row.id in assignInputs)) assignInputs[row.id] = ''
    })
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function assign(row) {
  const raw = String(assignInputs[row.id] || '').trim()
  const workerUserId = Number(raw)
  if (!workerUserId) {
    ElMessage.warning('请填写技工用户 ID')
    return
  }
  loading.value = true
  try {
    await request.post(`/admin/service-orders/${row.id}/assign`, { worker_user_id: workerUserId })
    ElMessage.success('派单成功')
    await load()
  } catch (e) {
    ElMessage.error(e.message || '派单失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.dispatch-wrap {
  padding: 0 4px;
}
.header-box {
  margin-bottom: 16px;
}
.header-box h3 {
  margin: 0 0 12px 0;
}
.toolbar {
  margin-top: 16px;
}
</style>
