<template>
  <div class="commission-wrap">
    <div class="header-box">
      <h3>推广分佣订单</h3>
      <el-alert
        title="查看已完成订单产生的推广分佣明细；分佣池优先取自订单 platform_fee_amount。"
        type="info"
        show-icon
        :closable="false"
      />
    </div>

    <el-card class="summary-card" v-loading="loadingSummary">
      <el-row :gutter="16">
        <el-col :span="6"><div class="stat"><div class="label">订单数</div><div class="val">{{ summary.order_count }}</div></div></el-col>
        <el-col :span="6"><div class="stat"><div class="label">GMV</div><div class="val">¥{{ summary.total_gmv }}</div></div></el-col>
        <el-col :span="6"><div class="stat"><div class="label">分佣池</div><div class="val">¥{{ summary.total_commission_pool }}</div></div></el-col>
        <el-col :span="6"><div class="stat"><div class="label">已分佣</div><div class="val">¥{{ summary.total_commission_amount }}</div></div></el-col>
      </el-row>
    </el-card>

    <div class="toolbar">
      <el-select v-model="filterType" clearable placeholder="订单类型" style="width: 140px" @change="loadList">
        <el-option label="集市" value="market" />
        <el-option label="服务" value="service" />
        <el-option label="邻里帮帮" value="neighbor_assist" />
      </el-select>
      <el-input v-model="filterOrderId" placeholder="订单号" clearable style="width: 200px" @keyup.enter="loadList" />
      <el-button type="primary" @click="loadList">查询</el-button>
      <el-button @click="loadSummary">刷新汇总</el-button>
    </div>

    <el-table v-loading="loadingList" :data="list" border stripe>
      <el-table-column prop="order_id" label="订单号" min-width="160" show-overflow-tooltip />
      <el-table-column prop="order_type" label="类型" width="110" />
      <el-table-column prop="order_amount" label="订单金额" width="100">
        <template #default="{ row }">¥{{ row.order_amount }}</template>
      </el-table-column>
      <el-table-column prop="commission_pool" label="分佣池" width="100">
        <template #default="{ row }">¥{{ row.commission_pool }}</template>
      </el-table-column>
      <el-table-column prop="beneficiary_role" label="受益角色" width="100" />
      <el-table-column prop="beneficiary_user_id" label="用户ID" min-width="120" show-overflow-tooltip />
      <el-table-column prop="commission_amount" label="分佣" width="90">
        <template #default="{ row }">¥{{ row.commission_amount }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80" />
      <el-table-column prop="created_at" label="时间" min-width="160" />
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="showBreakdown(row.order_id)">明细</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      class="pager"
      @current-change="loadList"
    />

    <el-dialog v-model="bdVisible" title="订单分佣明细" width="520px">
      <div v-if="breakdown.order_id">
        <p>订单号：{{ breakdown.order_id }}</p>
        <p>订单金额：¥{{ breakdown.order_amount }} · 分佣池：¥{{ breakdown.commission_pool }}</p>
        <el-table :data="breakdown.breakdown || []" border size="small">
          <el-table-column prop="role" label="角色" />
          <el-table-column prop="beneficiary_user_id" label="用户" />
          <el-table-column prop="role_percentage" label="比例%" width="80" />
          <el-table-column prop="commission_amount" label="金额" width="90" />
          <el-table-column prop="status" label="状态" width="80" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loadingSummary = ref(false)
const loadingList = ref(false)
const summary = ref({
  order_count: 0,
  total_gmv: 0,
  total_commission_pool: 0,
  total_commission_amount: 0
})
const list = ref([])
const page = ref(1)
const pageSize = 20
const total = ref(0)
const filterType = ref('')
const filterOrderId = ref('')
const bdVisible = ref(false)
const breakdown = ref({})

async function loadSummary() {
  loadingSummary.value = true
  try {
    const params = {}
    if (filterType.value) params.order_type = filterType.value
    const res = await request.get('/admin/commission/summary', { params })
    summary.value = res.data || res
  } catch (e) {
    ElMessage.error(e.message || '汇总加载失败')
  } finally {
    loadingSummary.value = false
  }
}

async function loadList() {
  loadingList.value = true
  try {
    const params = { page: page.value, page_size: pageSize }
    if (filterType.value) params.order_type = filterType.value
    if (filterOrderId.value) params.order_id = filterOrderId.value
    const res = await request.get('/admin/commission/distributions', { params })
    const d = res.data || res
    list.value = d.list || []
    total.value = d.total || 0
  } catch (e) {
    ElMessage.error(e.message || '列表加载失败')
  } finally {
    loadingList.value = false
  }
}

async function showBreakdown(orderId) {
  try {
    const res = await request.get(`/admin/commission/orders/${encodeURIComponent(orderId)}/breakdown`)
    breakdown.value = res.data || res
    bdVisible.value = true
  } catch (e) {
    ElMessage.error(e.message || '明细加载失败')
  }
}

onMounted(() => {
  loadSummary()
  loadList()
})
</script>

<style scoped>
.commission-wrap { padding: 4px; }
.header-box { margin-bottom: 16px; }
.header-box h3 { margin: 0 0 12px; }
.summary-card { margin-bottom: 16px; }
.stat .label { color: #888; font-size: 13px; }
.stat .val { font-size: 22px; font-weight: 600; margin-top: 4px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
