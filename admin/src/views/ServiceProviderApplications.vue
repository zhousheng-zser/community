<template>
  <div class="page-wrap">
    <el-radio-group v-model="status" class="toolbar" @change="load">
      <el-radio-button label="">全部</el-radio-button>
      <el-radio-button label="pending">待审核</el-radio-button>
      <el-radio-button label="approved">已通过</el-radio-button>
      <el-radio-button label="rejected">已驳回</el-radio-button>
    </el-radio-group>
    <el-table :data="rows" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="shop_name" label="店名" min-width="140" />
      <el-table-column prop="contact_name" label="联系人" width="100" />
      <el-table-column prop="phone" label="电话" width="120" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="success" v-if="row.status==='pending'" @click="setStatus(row,'approved')">通过</el-button>
          <el-button link type="danger" v-if="row.status==='pending'" @click="setStatus(row,'rejected')">驳回</el-button>
          <span v-else>—</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
const loading = ref(false)
const rows = ref([])
const status = ref('pending')
async function load() {
  loading.value = true
  try {
    const params = {}
    if (status.value) params.status = status.value
    const res = await request.get('/admin/service-provider-applications', { params })
    rows.value = res.data || []
  } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false }
}
async function setStatus(row, st) {
  try {
    await request.put(`/admin/service-provider-applications/${row.id}`, { status: st })
    ElMessage.success('已更新')
    await load()
  } catch (e) { ElMessage.error(e.message || '失败') }
}
onMounted(load)
</script>

<style scoped>
.page-wrap { background: #fff; padding: 16px; border-radius: 8px; }
.toolbar { margin-bottom: 12px; }
</style>
