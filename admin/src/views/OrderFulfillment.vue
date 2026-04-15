<template>
  <div class="page-wrap">
    <el-form :inline="true" class="filter">
      <el-form-item label="状态">
        <el-select v-model="statuses" multiple collapse-tags style="width: 240px" @change="load">
          <el-option label="已支付" value="paid" />
          <el-option label="配送中" value="delivering" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">刷新</el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="order_no" label="订单号" min-width="170" />
      <el-table-column label="店铺" min-width="120">
        <template #default="{ row }">{{ row.shop?.name || row.shop_id }}</template>
      </el-table-column>
      <el-table-column prop="order_status" label="状态" width="100" />
      <el-table-column prop="payable_amount" label="金额" width="90" />
      <el-table-column prop="created_at" label="时间" width="170" />
      <el-table-column label="履约动作" min-width="260">
        <template #default="{ row }">
          <el-button size="small" @click="doAction(row, 'accept')" :disabled="row.order_status !== 'paid'">接单</el-button>
          <el-button size="small" type="warning" @click="doAction(row, 'reject')" :disabled="row.order_status !== 'paid'">拒单</el-button>
          <el-button size="small" @click="doAction(row, 'prepare')">备货</el-button>
          <el-button size="small" type="primary" @click="doAction(row, 'deliver')" :disabled="row.order_status !== 'delivering'">配送</el-button>
          <el-button size="small" type="success" @click="doAction(row, 'complete')" :disabled="row.order_status !== 'delivering'">完成</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const rows = ref([])
const statuses = ref(['paid', 'delivering'])

async function load() {
  loading.value = true
  try {
    const res = await request.get('/admin/order-fulfillment', {
      params: { statuses: statuses.value.join(',') }
    })
    rows.value = res.data || []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function doAction(row, action) {
  ElMessageBox.prompt('可选备注', `确认执行 ${action} ?`, {
    inputValue: '',
    showCancelButton: true
  })
    .then(async ({ value }) => {
      await request.post(`/admin/market-orders/${encodeURIComponent(row.order_no)}/actions`, { action, note: value || '' })
      ElMessage.success('操作成功')
      await load()
    })
    .catch(() => {})
}

onMounted(load)
</script>

<style scoped>
.page-wrap { background: #fff; padding: 16px; border-radius: 8px; }
.filter { margin-bottom: 12px; }
</style>
