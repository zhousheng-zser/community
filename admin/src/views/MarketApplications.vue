<template>
  <div class="page-wrap">
    <el-radio-group v-model="status" class="toolbar" @change="load">
      <el-radio-button label="">全部</el-radio-button>
      <el-radio-button label="pending">待审核</el-radio-button>
      <el-radio-button label="approved">已通过</el-radio-button>
      <el-radio-button label="rejected">已驳回</el-radio-button>
    </el-radio-group>
    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="shop_name" label="店铺名" min-width="120" />
      <el-table-column prop="contact_name" label="联系人" width="100" />
      <el-table-column prop="phone" label="电话" width="120" />
      <el-table-column prop="category" label="类目" width="100" />
      <el-table-column prop="status" label="状态" width="90" />
      <el-table-column prop="created_at" label="申请时间" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button type="success" link @click="setStatus(row, 'approved')">通过</el-button>
            <el-button type="danger" link @click="setStatus(row, 'rejected')">驳回</el-button>
          </template>
          <span v-else>—</span>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const status = ref('pending')

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    if (status.value) params.status = status.value
    const res = await request.get('/admin/market-applications', { params })
    rows.value = res.data || []
    total.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function setStatus(row, st) {
  ElMessageBox.confirm(`确定将入驻申请 #${row.id} 标记为 ${st}？`, '确认', { type: 'warning' })
    .then(async () => {
      await request.put(`/admin/market-applications/${row.id}`, { status: st })
      ElMessage.success('已更新')
      await load()
    })
    .catch(() => {})
}

onMounted(load)
</script>

<style scoped>
.page-wrap {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}
.toolbar {
  margin-bottom: 12px;
}
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
