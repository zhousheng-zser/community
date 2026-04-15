<template>
  <div class="page-wrap">
    <el-tabs v-model="tab">
      <el-tab-pane label="操作日志" name="ops">
        <el-table :data="ops" v-loading="loadingOps" border stripe>
          <el-table-column prop="created_at" label="时间" width="170" />
          <el-table-column prop="admin_username" label="管理员" width="120" />
          <el-table-column prop="action" label="动作" width="160" />
          <el-table-column prop="target_type" label="对象类型" width="140" />
          <el-table-column prop="target_id" label="对象ID" width="120" />
          <el-table-column prop="ip" label="IP" width="140" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="审批轨迹" name="approval">
        <el-table :data="approvals" v-loading="loadingApprovals" border stripe>
          <el-table-column prop="created_at" label="时间" width="170" />
          <el-table-column prop="biz_type" label="业务" width="180" />
          <el-table-column prop="biz_id" label="业务ID" width="140" />
          <el-table-column prop="from_status" label="原状态" width="120" />
          <el-table-column prop="to_status" label="新状态" width="120" />
          <el-table-column prop="operator" label="操作人" width="120" />
          <el-table-column prop="note" label="备注" min-width="160" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const tab = ref('ops')
const ops = ref([])
const approvals = ref([])
const loadingOps = ref(false)
const loadingApprovals = ref(false)

async function loadOps() {
  loadingOps.value = true
  try {
    const res = await request.get('/admin/operation-logs')
    ops.value = res.data || []
  } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loadingOps.value = false }
}
async function loadApprovals() {
  loadingApprovals.value = true
  try {
    const res = await request.get('/admin/approval-records')
    approvals.value = res.data || []
  } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loadingApprovals.value = false }
}
onMounted(async () => { await loadOps(); await loadApprovals() })
</script>

<style scoped>
.page-wrap { background: #fff; padding: 16px; border-radius: 8px; }
</style>
