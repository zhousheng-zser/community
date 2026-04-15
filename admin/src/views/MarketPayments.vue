<template>
  <div class="page-wrap">
    <el-form :inline="true" class="filter" @submit.prevent="search">
      <el-form-item label="订单号">
        <el-input v-model="filters.order_no" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.pay_status" clearable placeholder="全部" style="width: 140px">
          <el-option label="已创建" value="created" />
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
          <el-option label="关闭" value="closed" />
          <el-option label="已退款" value="refunded" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="order_no" label="订单号" min-width="150" show-overflow-tooltip />
      <el-table-column prop="out_trade_no" label="商户单号" min-width="160" show-overflow-tooltip />
      <el-table-column prop="transaction_id" label="微信单号" min-width="140" show-overflow-tooltip />
      <el-table-column prop="amount" label="金额" width="90" />
      <el-table-column prop="pay_status" label="状态" width="100" />
      <el-table-column prop="notify_count" label="回调次数" width="100" />
      <el-table-column prop="created_at" label="创建时间" width="170" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const filters = reactive({ order_no: '', pay_status: '' })

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    if (filters.order_no) params.order_no = filters.order_no
    if (filters.pay_status) params.pay_status = filters.pay_status
    const res = await request.get('/admin/market-payments', { params })
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
