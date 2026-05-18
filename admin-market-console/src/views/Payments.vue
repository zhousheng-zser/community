<template>
  <div class="merchant-page">
    <div class="page-intro merchant-card">
      <h1 class="merchant-page-title">支付流水</h1>
      <p class="merchant-page-desc" style="margin-bottom: 0">
        本店订单关联的微信支付记录，可按订单号跳转核对订单详情，便于日终对账。
      </p>
    </div>
    <el-table v-loading="loading" :data="list" stripe class="table-card merchant-card">
      <el-table-column prop="order_no" label="订单号" min-width="168">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push('/orders/' + row.order_no)">{{ row.order_no }}</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="out_trade_no" label="商户单号" min-width="200" />
      <el-table-column prop="pay_status" label="状态" width="100" />
      <el-table-column prop="amount" label="金额" width="100" />
      <el-table-column label="支付时间" width="170">
        <template #default="{ row }">{{ formatTime(row.paid_at || row.created_at) }}</template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="page"
      :page-size="limit"
      :total="total"
      layout="total, prev, pager, next"
      class="mt"
      @current-change="load"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)

function formatTime(v) {
  if (!v) return ''
  return new Date(v).toLocaleString('zh-CN')
}

async function load() {
  loading.value = true
  try {
    const { data } = await request.get('/market/merchant/payments', {
      params: { page: page.value, limit: limit.value }
    })
    if (data.code !== 0 && data.errno !== 0) {
      ElMessage.error(data.msg || data.errmsg || '加载失败')
      return
    }
    const d = data.data || {}
    list.value = d.list || []
    total.value = d.total || 0
  } catch (_) {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page-intro {
  padding: 20px 22px;
  margin-bottom: 16px;
}
.table-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}
.mt {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
