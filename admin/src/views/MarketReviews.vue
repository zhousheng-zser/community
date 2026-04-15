<template>
  <div class="page-wrap">
    <el-form :inline="true" class="filter" @submit.prevent="search">
      <el-form-item label="店铺 ID">
        <el-input v-model="shopId" clearable placeholder="可选" style="width: 120px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="shop_id" label="店铺" width="90" />
      <el-table-column prop="user_id" label="用户" width="90" />
      <el-table-column prop="rating" label="分" width="60" />
      <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
      <el-table-column prop="created_at" label="时间" width="170" />
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button type="danger" link @click="onDelete(row)">删除</el-button>
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
const shopId = ref('')

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    if (shopId.value) params.shop_id = shopId.value
    const res = await request.get('/admin/market-shop-reviews', { params })
    rows.value = res.data || []
    total.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function onDelete(row) {
  ElMessageBox.confirm('删除该评价？', '确认', { type: 'warning' })
    .then(async () => {
      await request.delete(`/admin/market-shop-reviews/${row.id}`)
      ElMessage.success('已删除')
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
.filter {
  margin-bottom: 12px;
}
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
