<template>
  <div class="page-wrap">
    <div class="toolbar">
      <el-select v-model="status" clearable placeholder="订单状态" style="width: 160px" @change="load">
        <el-option label="全部" value="" />
        <el-option label="待接单" value="pending" />
        <el-option label="已付款" value="paid" />
        <el-option label="已完成" value="completed" />
      </el-select>
      <el-button type="primary" @click="load">刷新</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="id" label="订单ID" width="90" />
      <el-table-column prop="order_no_display" label="订单号" min-width="150" />
      <el-table-column label="服务" min-width="220">
        <template #default="{ row }">
          <div>{{ row.service?.title || '-' }}</div>
          <div class="muted">{{ row.service?.category?.name || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="买家" min-width="150">
        <template #default="{ row }">
          <div>{{ row.buyer?.nickname || '-' }}</div>
          <div class="muted">{{ row.buyer?.phone || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="total_amount" label="金额" width="90" />
      <el-table-column prop="status" label="状态" width="110" />
      <el-table-column label="派单技工" min-width="180">
        <template #default="{ row }">
          <div v-if="row.latest_dispatch">
            {{ row.latest_dispatch.worker_name
            }}<span class="muted"> / {{ row.latest_dispatch.worker_industry || '未填行业' }}</span>
          </div>
          <span v-else class="muted">未派单</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="160" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openDispatch(row)">派单</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="pager"
      v-model:current-page="page"
      v-model:page-size="limit"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="load"
    />
    <el-dialog v-model="dispatchVisible" title="派单给技工" width="520px">
      <el-form label-width="90px">
        <el-form-item label="订单">
          <div>{{ currentOrder?.order_no_display }} / {{ currentOrder?.service?.title }}</div>
        </el-form-item>
        <el-form-item label="技工">
          <el-select v-model="dispatchWorkerId" filterable placeholder="选择技工" style="width: 100%">
            <el-option
              v-for="item in workers"
              :key="item.id"
              :label="`${item.name} / ${item.industry || '未填行业'} / ${item.phone || '无手机'}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="dispatchNote" type="textarea" :rows="3" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dispatchVisible = false">取消</el-button>
        <el-button type="primary" :loading="dispatching" @click="submitDispatch">确认派单</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const status = ref('')
const workers = ref([])
const dispatchVisible = ref(false)
const dispatchWorkerId = ref(null)
const dispatchNote = ref('')
const dispatching = ref(false)
const currentOrder = ref(null)

async function loadWorkers() {
  const res = await request.get('/admin/housekeeping/workers')
  workers.value = res.data || []
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    if (status.value) params.status = status.value
    const res = await request.get('/admin/housekeeping/orders', { params })
    rows.value = res.data || []
    total.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function openDispatch(row) {
  currentOrder.value = row
  dispatchWorkerId.value = row.latest_dispatch?.worker_id || null
  dispatchNote.value = ''
  dispatchVisible.value = true
}

async function submitDispatch() {
  if (!currentOrder.value?.id) return
  if (!dispatchWorkerId.value) {
    ElMessage.warning('请选择技工')
    return
  }
  dispatching.value = true
  try {
    await request.post(`/admin/housekeeping/orders/${currentOrder.value.id}/dispatch`, {
      worker_id: dispatchWorkerId.value,
      note: dispatchNote.value
    })
    ElMessage.success('派单成功')
    dispatchVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '派单失败')
  } finally {
    dispatching.value = false
  }
}

onMounted(async () => {
  await loadWorkers()
  await load()
})
</script>
<style scoped>
.page-wrap {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
.muted {
  color: #909399;
  font-size: 12px;
}
</style>
