<template>
  <div class="sp-page orders-page">
    <p class="sp-page-desc">按状态筛选订单，点击行或「详情」进入履约操作（接单、打卡、凭证、完成）。</p>

    <div class="toolbar sp-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="status" clearable placeholder="全部" style="width: 170px" @change="search">
            <el-option label="待支付" value="pending_pay" />
            <el-option label="待接单" value="pending_accept" />
            <el-option label="服务中" value="in_service" />
            <el-option label="待用户确认" value="pending_user_confirm" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="keyword"
            clearable
            placeholder="订单号 / 服务名"
            style="width: 220px"
            @clear="search"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="includeAll" @change="search">含已取消/关闭</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-wrap sp-card">
      <el-table
        v-loading="loading"
        :data="rows"
        stripe
        class="data-table"
        empty-text="暂无订单，用户下单并支付后会出现在这里"
        @row-click="(row) => $router.push('/orders/' + row.id)"
      >
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="order_no" label="订单号" min-width="168" show-overflow-tooltip />
        <el-table-column prop="service_title" label="服务" min-width="130" show-overflow-tooltip />
        <el-table-column prop="amount" label="金额" width="96">
          <template #default="{ row }">￥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="tagType(row.status)" size="small">{{ row.status_text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pay_status" label="支付" width="88">
          <template #default="{ row }">
            <el-tag :type="row.pay_status === 'paid' ? 'success' : 'info'" size="small" effect="plain">
              {{ row.pay_status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="172" />
        <el-table-column label="操作" width="96" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="$router.push('/orders/' + row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="load"
          @size-change="search"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import request from '../utils/request'

const route = useRoute()
const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const status = ref('')
const keyword = ref('')
const includeAll = ref(false)

function tagType(st) {
  const m = {
    pending_pay: 'info',
    pending_accept: 'warning',
    in_service: 'primary',
    pending_user_confirm: '',
    completed: 'success',
    cancelled: 'info',
    closed: 'info'
  }
  return m[st] || 'info'
}

async function load() {
  loading.value = true
  try {
    const res = await request.get('/service-provider-portal/orders', {
      params: {
        page: page.value,
        limit: limit.value,
        status: status.value || undefined,
        keyword: keyword.value || undefined,
        include_all: includeAll.value ? '1' : undefined
      }
    })
    rows.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function reset() {
  status.value = ''
  keyword.value = ''
  includeAll.value = false
  search()
}

function applyQuery() {
  const q = route.query.status
  if (typeof q === 'string' && q) {
    status.value = q
  }
}

onMounted(() => {
  applyQuery()
  load()
})

watch(
  () => route.query.status,
  () => {
    applyQuery()
    search()
  }
)
</script>

<style scoped>
.orders-page {
  padding-top: 0;
}
.toolbar {
  padding: 18px 20px;
  margin-bottom: 16px;
}
.filter-form {
  margin: 0;
}
.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.table-wrap {
  padding: 0;
  overflow: hidden;
}
.data-table {
  width: 100%;
}
.data-table :deep(.el-table__row) {
  cursor: pointer;
}
.pager-wrap {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--sp-border);
  background: #fafafa;
}
</style>
