<template>
  <div class="page-wrap">
    <el-card shadow="never">
      <template #header><span>技工管理</span></template>
      <el-table :data="list" border stripe v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="65" />
        <el-table-column label="头像" width="70">
          <template #default="s">
            <el-avatar :src="imgUrl(s.row.avatar)" :size="40">{{ (s.row.name || '?')[0] }}</el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机" width="130" />
        <el-table-column prop="skill_tags" label="技能" min-width="140" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="s">
            <el-tag :type="s.row.status === 'active' ? 'success' : 'info'">
              {{ s.row.status === 'active' ? '在职' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="s">
            <el-button size="small" @click="viewStats(s.row)">统计</el-button>
            <el-button size="small" :type="s.row.status === 'active' ? 'danger' : 'success'"
              @click="toggleStatus(s.row)">
              {{ s.row.status === 'active' ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="statsVisible" title="技工工单统计" width="400px">
      <el-descriptions :column="1" border v-if="workerStats">
        <el-descriptions-item label="技工">{{ workerStats.name }}</el-descriptions-item>
        <el-descriptions-item label="总接单">{{ workerStats.total_orders ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="已完成">{{ workerStats.completed_orders ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="好评率">{{ workerStats.rating ?? '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request.js'

const loading = ref(false)
const list = ref([])
const statsVisible = ref(false)
const workerStats = ref(null)

function imgUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return (import.meta.env.VITE_API_BASE || '/api/v1').replace(/\/api\/v1$/, '') + url
}

async function load() {
  loading.value = true
  try {
    const res = await request.get('/service-provider/workers/list')
    const d = res.data || {}
    list.value = d.data || d.list || (Array.isArray(d) ? d : [])
  } catch (e) { ElMessage.error(e.message) }
  finally { loading.value = false }
}

async function viewStats(row) {
  try {
    const res = await request.get(`/service-provider/workers/${row.id}/stats`)
    workerStats.value = { ...row, ...(res.data || {}) }
    statsVisible.value = true
  } catch (e) { ElMessage.error(e.message) }
}

async function toggleStatus(row) {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  try {
    await request.post(`/service-provider/workers/${row.id}/status`, { status: newStatus })
    ElMessage.success(`已${newStatus === 'active' ? '启用' : '停用'}`)
    load()
  } catch (e) { ElMessage.error(e.message) }
}

onMounted(load)
</script>

<style scoped>
.page-wrap { padding: 4px; }
</style>
