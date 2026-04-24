<template>
  <div>
    <h2>服务订单</h2>
    <el-table v-loading="loading" :data="list" stripe @row-click="goDetail">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="service_title" label="服务" min-width="160" />
      <el-table-column prop="status_text" label="状态" width="100" />
      <el-table-column prop="amount" label="金额" width="100" />
      <el-table-column prop="created_at" label="下单时间" width="180">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="page"
      :page-size="limit"
      :total="total"
      layout="prev, pager, next"
      class="mt"
      @current-change="load"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)

function formatTime(v) {
  if (!v) return ''
  return new Date(v).toLocaleString('zh-CN')
}

async function load() {
  loading.value = true
  try {
    const { data } = await request.get('/worker/service-orders', {
      params: { page: page.value, limit: limit.value }
    })
    if (data.errno !== 0) {
      ElMessage.error(data.errmsg || '加载失败')
      return
    }
    list.value = data.data.list || []
    total.value = data.data.total || 0
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

function goDetail(row) {
  router.push('/orders/' + row.id)
}

onMounted(load)
</script>

<style scoped>
h2 { margin-top: 0; }
.mt { margin-top: 16px; }
</style>
