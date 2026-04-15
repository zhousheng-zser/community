<template>
  <div class="page-wrap">
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane label="待派单总览" name="queue">
        <div class="toolbar">
          <el-button type="primary" :loading="loadingQueue" @click="loadQueue">刷新</el-button>
        </div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="never" header="到家服务 · 待派单">
              <el-table v-loading="loadingQueue" :data="queueService" border stripe size="small" max-height="420">
                <el-table-column prop="id" label="ID" width="72" />
                <el-table-column label="服务" min-width="140">
                  <template #default="{ row }">{{ row.service?.title || '-' }}</template>
                </el-table-column>
                <el-table-column label="用户" min-width="120">
                  <template #default="{ row }">
                    <div>{{ row.buyer?.nickname || '-' }}</div>
                    <div class="muted">{{ row.buyer?.phone || '' }}</div>
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="金额" width="88" />
                <el-table-column prop="community_id" label="小区" width="80" />
                <el-table-column label="时间" width="150">
                  <template #default="{ row }">{{ fmtTime(row) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="88" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" link @click="openAssign('service', row)">派单</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" header="邻里帮帮 · 待派单">
              <el-table v-loading="loadingQueue" :data="queueNeighbor" border stripe size="small" max-height="420">
                <el-table-column prop="id" label="ID" width="72" />
                <el-table-column prop="assist_type" label="类型" width="88" />
                <el-table-column label="用户" min-width="120">
                  <template #default="{ row }">
                    <div>{{ row.buyer?.nickname || '-' }}</div>
                    <div class="muted">{{ row.buyer?.phone || '' }}</div>
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="金额" width="88" />
                <el-table-column prop="community_id" label="小区" width="80" />
                <el-table-column label="时间" width="150">
                  <template #default="{ row }">{{ fmtTime(row) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="88" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" link @click="openAssign('neighbor', row)">派单</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="到家服务订单" name="service">
        <div class="toolbar">
          <el-select v-model="svcStatus" clearable placeholder="状态" style="width: 200px" @change="loadServiceList">
            <el-option label="全部" value="" />
            <el-option label="待支付" value="pending_pay" />
            <el-option label="待派单" value="paid_pending_dispatch" />
            <el-option label="已派单" value="dispatched" />
            <el-option label="服务中" value="in_service" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-input v-model="svcCommunityId" clearable placeholder="小区 ID" style="width: 120px" @keyup.enter="loadServiceList" />
          <el-button type="primary" :loading="loadingSvc" @click="loadServiceList">查询</el-button>
        </div>
        <el-table v-loading="loadingSvc" :data="serviceRows" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="status" label="状态" width="150" />
          <el-table-column prop="pay_status" label="支付" width="100" />
          <el-table-column label="服务" min-width="160">
            <template #default="{ row }">{{ row.service?.title || '-' }}</template>
          </el-table-column>
          <el-table-column label="用户" min-width="130">
            <template #default="{ row }">
              <div>{{ row.buyer?.nickname || '-' }}</div>
              <div class="muted">{{ row.buyer?.phone || '' }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="90" />
          <el-table-column prop="community_id" label="小区" width="80" />
          <el-table-column label="技工" min-width="120">
            <template #default="{ row }">
              <span v-if="row.assigned_worker_id">{{ row.assignedWorker?.nickname || `#${row.assigned_worker_id}` }}</span>
              <span v-else class="muted">未派</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="168">
            <template #default="{ row }">{{ fmtTime(row) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="88" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                :disabled="row.status !== 'paid_pending_dispatch' || !!row.assigned_worker_id"
                @click="openAssign('service', row)"
              >派单</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="邻里帮帮订单" name="neighbor">
        <div class="toolbar">
          <el-select v-model="nbStatus" clearable placeholder="状态" style="width: 200px" @change="loadNeighborList">
            <el-option label="全部" value="" />
            <el-option label="待支付" value="pending_pay" />
            <el-option label="待派单" value="paid_pending_dispatch" />
            <el-option label="已派单" value="dispatched" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-input v-model="nbAssistType" clearable placeholder="类型 take/child…" style="width: 140px" @keyup.enter="loadNeighborList" />
          <el-input v-model="nbCommunityId" clearable placeholder="小区 ID" style="width: 120px" @keyup.enter="loadNeighborList" />
          <el-button type="primary" :loading="loadingNb" @click="loadNeighborList">查询</el-button>
        </div>
        <el-table v-loading="loadingNb" :data="neighborRows" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="assist_type" label="类型" width="96" />
          <el-table-column prop="status" label="状态" width="150" />
          <el-table-column prop="pay_status" label="支付" width="100" />
          <el-table-column label="用户" min-width="130">
            <template #default="{ row }">
              <div>{{ row.buyer?.nickname || '-' }}</div>
              <div class="muted">{{ row.buyer?.phone || '' }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="90" />
          <el-table-column prop="community_id" label="小区" width="80" />
          <el-table-column label="起点/终点" min-width="100">
            <template #default="{ row }">
              <el-popover placement="left" :width="360" trigger="click">
                <template #reference>
                  <el-button link type="primary">查看地址</el-button>
                </template>
                <pre class="json-pre">{{ pretty(row.origin_address_snapshot) }}</pre>
                <pre class="json-pre">{{ pretty(row.destination_address_snapshot) }}</pre>
              </el-popover>
            </template>
          </el-table-column>
          <el-table-column label="技工" min-width="120">
            <template #default="{ row }">
              <span v-if="row.assigned_worker_id">{{ row.assignedWorker?.nickname || `#${row.assigned_worker_id}` }}</span>
              <span v-else class="muted">未派</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="168">
            <template #default="{ row }">{{ fmtTime(row) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="88" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                :disabled="row.status !== 'paid_pending_dispatch' || !!row.assigned_worker_id"
                @click="openAssign('neighbor', row)"
              >派单</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="assignVisible" title="指派技工" width="520px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="订单">
          <span v-if="assignKind === 'service'">到家服务 #{{ assignRow?.id }}</span>
          <span v-else>帮帮 #{{ assignRow?.id }}（{{ assignRow?.assist_type }}）</span>
        </el-form-item>
        <el-form-item label="技工">
          <el-select v-model="assignWorkerId" filterable placeholder="选择技工（用户 ID）" style="width: 100%">
            <el-option
              v-for="w in workers"
              :key="w.id"
              :label="`${w.name} / ${w.industry || '—'} / ${w.phone || '无手机'} (#${w.id})`"
              :value="w.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" :loading="assigning" @click="submitAssign">确认指派</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const activeTab = ref('queue')
const loadingQueue = ref(false)
const loadingSvc = ref(false)
const loadingNb = ref(false)
const queueService = ref([])
const queueNeighbor = ref([])

const svcStatus = ref('')
const svcCommunityId = ref('')
const serviceRows = ref([])

const nbStatus = ref('')
const nbAssistType = ref('')
const nbCommunityId = ref('')
const neighborRows = ref([])

const workers = ref([])
const assignVisible = ref(false)
const assignKind = ref('service')
const assignRow = ref(null)
const assignWorkerId = ref(null)
const assigning = ref(false)

function fmtTime(row) {
  const t = row.created_at || row.createdAt
  if (!t) return '-'
  try {
    const d = new Date(t)
    if (Number.isNaN(d.getTime())) return String(t)
    return d.toLocaleString('zh-CN', { hour12: false })
  } catch {
    return String(t)
  }
}

function pretty(obj) {
  try {
    return JSON.stringify(obj ?? {}, null, 2)
  } catch {
    return String(obj)
  }
}

async function loadWorkers() {
  const res = await request.get('/admin/housekeeping/workers')
  const data = res.data != null ? res.data : res
  workers.value = Array.isArray(data) ? data : []
}

async function loadQueue() {
  loadingQueue.value = true
  try {
    const res = await request.get('/admin/dispatch-queue')
    const box = res.data && typeof res.data === 'object' ? res.data : {}
    queueService.value = Array.isArray(box.service_orders) ? box.service_orders : []
    queueNeighbor.value = Array.isArray(box.neighbor_assist_orders) ? box.neighbor_assist_orders : []
  } catch (e) {
    ElMessage.error(e.message || '加载待派单失败')
  } finally {
    loadingQueue.value = false
  }
}

async function loadServiceList() {
  loadingSvc.value = true
  try {
    const params = { limit: 200 }
    if (svcStatus.value) params.status = svcStatus.value
    if (svcCommunityId.value) params.community_id = svcCommunityId.value
    const res = await request.get('/admin/service-orders', { params })
    serviceRows.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loadingSvc.value = false
  }
}

async function loadNeighborList() {
  loadingNb.value = true
  try {
    const params = { limit: 200 }
    if (nbStatus.value) params.status = nbStatus.value
    if (nbCommunityId.value) params.community_id = nbCommunityId.value
    if (nbAssistType.value) params.assist_type = nbAssistType.value
    const res = await request.get('/admin/neighbor-assist/orders', { params })
    neighborRows.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loadingNb.value = false
  }
}

function onTabChange(name) {
  if (name === 'service') loadServiceList()
  if (name === 'neighbor') loadNeighborList()
}

function openAssign(kind, row) {
  assignKind.value = kind
  assignRow.value = row
  assignWorkerId.value = row.assigned_worker_id || null
  assignVisible.value = true
}

async function submitAssign() {
  if (!assignRow.value?.id) return
  if (!assignWorkerId.value) {
    ElMessage.warning('请选择技工')
    return
  }
  assigning.value = true
  try {
    if (assignKind.value === 'service') {
      await request.post(`/admin/service-orders/${assignRow.value.id}/assign`, { worker_id: assignWorkerId.value })
    } else {
      await request.post(`/admin/neighbor-assist/orders/${assignRow.value.id}/assign`, { worker_id: assignWorkerId.value })
    }
    ElMessage.success('指派成功')
    assignVisible.value = false
    await loadQueue()
    if (activeTab.value === 'service') await loadServiceList()
    if (activeTab.value === 'neighbor') await loadNeighborList()
  } catch (e) {
    ElMessage.error(e.message || '指派失败')
  } finally {
    assigning.value = false
  }
}

onMounted(async () => {
  await loadWorkers()
  await loadQueue()
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
  flex-wrap: wrap;
}
.muted {
  color: #909399;
  font-size: 12px;
}
.json-pre {
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  margin: 0 0 8px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
