<template>
  <div class="steward-container">
    <div class="header-box">
      <h3>🏠 小区管家入驻审核</h3>
      <el-alert title="审核通过后用户可进入小区管家工作台；驳回时需填写原因。" type="info" show-icon />
    </div>

    <el-tabs v-model="activeName" @tab-change="onTabChange">
      <el-tab-pane label="待审核" name="pending">
        <el-table :data="list" border stripe v-loading="loading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="phone" label="手机号" width="140" />
          <el-table-column prop="community_name" label="服务社区" min-width="160" />
          <el-table-column prop="gender" label="性别" width="80" />
          <el-table-column prop="created_at" label="提交时间" width="170">
            <template #default="scope">{{ fmt(scope.row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="openDetail(scope.row)">查看详情</el-button>
              <el-button type="success" size="small" @click="handleApprove(scope.row)">通过</el-button>
              <el-button type="danger" size="small" plain @click="openReject(scope.row)">驳回</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="已通过" name="approved">
        <el-table :data="list" border stripe v-loading="loading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="phone" label="手机号" width="140" />
          <el-table-column prop="community_name" label="服务社区" min-width="160" />
          <el-table-column prop="reviewed_at" label="审核时间" width="170">
            <template #default="scope">{{ fmt(scope.row.reviewed_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="openDetail(scope.row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="已驳回" name="rejected">
        <el-table :data="list" border stripe v-loading="loading" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="phone" label="手机号" width="140" />
          <el-table-column prop="reject_reason" label="驳回原因" min-width="200" show-overflow-tooltip />
          <el-table-column prop="reviewed_at" label="审核时间" width="170">
            <template #default="scope">{{ fmt(scope.row.reviewed_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="openDetail(scope.row)">查看详情</el-button>
              <el-button type="success" size="small" @click="handleApprove(scope.row)">改通过</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      layout="prev, pager, next, sizes, total"
      :page-sizes="[10, 20, 50]"
      @current-change="fetch"
      @size-change="fetch"
      style="margin-top: 16px"
    />

    <el-dialog v-model="detailVisible" title="申请详情" width="560px">
      <el-descriptions :column="1" border v-if="detailRow">
        <el-descriptions-item label="姓名">{{ detailRow.name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailRow.phone }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ detailRow.gender || '-' }}</el-descriptions-item>
        <el-descriptions-item label="服务社区">{{ detailRow.community_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ detailRow.id_card || '-' }}</el-descriptions-item>
        <el-descriptions-item label="自我介绍">{{ detailRow.intro || '-' }}</el-descriptions-item>
        <el-descriptions-item label="证件照">
          <el-image v-if="detailRow.id_card_url" :src="img(detailRow.id_card_url)" style="max-width:200px" fit="contain" />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">{{ detailRow.status }}</el-descriptions-item>
        <el-descriptions-item v-if="detailRow.reject_reason" label="驳回原因">{{ detailRow.reject_reason }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="rejectVisible" title="驳回申请" width="480px">
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请填写驳回原因" />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const activeName = ref('pending')
const loading = ref(false)
const list = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const detailVisible = ref(false)
const detailRow = ref(null)
const rejectVisible = ref(false)
const rejectReason = ref('')
const rejectRow = ref(null)

function fmt(d) {
  if (!d) return '-'
  const s = new Date(d).toLocaleString('zh-CN', { hour12: false })
  return s === 'Invalid Date' ? String(d) : s
}

function img(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const base = import.meta.env.VITE_API_BASE || '/api/v1'
  const host = base.replace(/\/api\/v1$/, '')
  return host + url
}

async function fetch() {
  loading.value = true
  try {
    const res = await request.get('/steward/applications', {
      params: { status: activeName.value, page: page.value, pageSize: pageSize.value }
    })
    const data = res.data || {}
    list.value = data.list || []
    total.value = data.total || 0
    page.value = data.page || 1
    pageSize.value = data.pageSize || 20
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function onTabChange() {
  page.value = 1
  fetch()
}

function openDetail(row) {
  detailRow.value = row
  detailVisible.value = true
}

function handleApprove(row) {
  ElMessageBox.confirm(`确认通过【${row.name}】的小区管家入驻申请？`, '二次确认', {
    confirmButtonText: '确认通过',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await request.post(`/steward/applications/${row.id}/review`, { status: 'approved' })
    ElMessage.success('已通过')
    fetch()
  }).catch(() => {})
}

function openReject(row) {
  rejectRow.value = row
  rejectReason.value = row.reject_reason || ''
  rejectVisible.value = true
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  try {
    await request.post(`/steward/applications/${rejectRow.value.id}/review`, {
      status: 'rejected',
      reject_reason: rejectReason.value.trim()
    })
    ElMessage.success('已驳回')
    rejectVisible.value = false
    fetch()
  } catch (e) {
    ElMessage.error(e.message || '驳回失败')
  }
}

onMounted(() => {
  fetch()
})
</script>

<style scoped>
.steward-container {
  background: white;
  padding: 20px 30px;
  border-radius: 8px;
  min-height: calc(100vh - 120px);
}
.header-box { margin-bottom: 25px; }
.header-box h3 { margin-top: 0; color: #303133; }
</style>
