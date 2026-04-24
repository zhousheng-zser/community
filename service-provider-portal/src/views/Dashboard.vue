<template>
  <div class="dash">
    <section class="hero sp-card">
      <div class="hero-bg" />
      <div class="hero-inner">
        <div>
          <p class="hero-label">当前店铺</p>
          <h2 class="hero-title">{{ d.shop_name || '—' }}</h2>
          <p class="hero-meta">
            <el-tag size="small" type="success" effect="dark" round>已入驻</el-tag>
            <span v-if="d.community_id != null" class="hero-comm">服务小区 ID：{{ d.community_id }}</span>
            <span v-else class="hero-comm muted">未绑定小区（以订单为准）</span>
          </p>
        </div>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="$router.push('/orders?status=pending_accept')">
            <el-icon class="mr"><Bell /></el-icon>
            待接单
          </el-button>
          <el-button size="large" @click="$router.push('/services/new')">
            <el-icon class="mr"><Plus /></el-icon>
            发布服务
          </el-button>
        </div>
      </div>
    </section>

    <el-row :gutter="16" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="8" :xl="6">
        <div class="stat-card sp-card stat-warn">
          <div class="stat-icon"><el-icon><Clock /></el-icon></div>
          <div class="stat-body">
            <div class="stat-k">待接单</div>
            <div class="stat-v">{{ d.pending_accept ?? '—' }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8" :xl="6">
        <div class="stat-card sp-card stat-run">
          <div class="stat-icon"><el-icon><Loading /></el-icon></div>
          <div class="stat-body">
            <div class="stat-k">服务中</div>
            <div class="stat-v">{{ d.in_service ?? '—' }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8" :xl="6">
        <div class="stat-card sp-card stat-wait">
          <div class="stat-icon"><el-icon><User /></el-icon></div>
          <div class="stat-body">
            <div class="stat-k">待用户确认</div>
            <div class="stat-v">{{ d.pending_user_confirm ?? '—' }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8" :xl="6">
        <div class="stat-card sp-card">
          <div class="stat-icon plain"><el-icon><Calendar /></el-icon></div>
          <div class="stat-body">
            <div class="stat-k">今日新单</div>
            <div class="stat-v">{{ d.orders_today ?? '—' }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8" :xl="6">
        <div class="stat-card sp-card stat-ok">
          <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-body">
            <div class="stat-k">近7日完成</div>
            <div class="stat-v">{{ d.orders_completed_7d ?? '—' }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8" :xl="6">
        <div class="stat-card sp-card">
          <div class="stat-icon plain"><el-icon><Money /></el-icon></div>
          <div class="stat-body">
            <div class="stat-k">7日已付金额(元)</div>
            <div class="stat-v">{{ fmt(d.paid_amount_7d) }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8" :xl="6">
        <div class="stat-card sp-card">
          <div class="stat-icon plain"><el-icon><Goods /></el-icon></div>
          <div class="stat-body">
            <div class="stat-k">服务项目数</div>
            <div class="stat-v">{{ d.services_count ?? '—' }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8" :xl="6">
        <div class="stat-card sp-card">
          <div class="stat-icon plain"><el-icon><DataLine /></el-icon></div>
          <div class="stat-body">
            <div class="stat-k">累计订单</div>
            <div class="stat-v">{{ d.orders_total ?? '—' }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="block-row">
      <el-col :xs="24" :lg="14">
        <div class="panel sp-card">
          <div class="panel-head">
            <span class="panel-title">近期订单</span>
            <el-button text type="primary" @click="$router.push('/orders')">全部订单 →</el-button>
          </div>
          <el-table v-loading="recentLoading" :data="recentRows" stripe empty-text="暂无订单">
            <el-table-column prop="order_no" label="订单号" min-width="140" show-overflow-tooltip />
            <el-table-column prop="service_title" label="服务" min-width="100" show-overflow-tooltip />
            <el-table-column prop="amount" label="金额" width="88" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ row.status_text }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="88" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="$router.push('/orders/' + row.id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :xs="24" :lg="10">
        <div class="panel sp-card shortcuts">
          <div class="panel-head">
            <span class="panel-title">快捷入口</span>
          </div>
          <div class="short-grid">
            <button type="button" class="short-item" @click="$router.push('/orders?status=pending_accept')">
              <el-icon><Clock /></el-icon>
              <span>待接单</span>
            </button>
            <button type="button" class="short-item" @click="$router.push('/orders?status=in_service')">
              <el-icon><Loading /></el-icon>
              <span>服务中</span>
            </button>
            <button type="button" class="short-item" @click="$router.push('/services')">
              <el-icon><Goods /></el-icon>
              <span>服务列表</span>
            </button>
            <button type="button" class="short-item" @click="$router.push('/shop')">
              <el-icon><OfficeBuilding /></el-icon>
              <span>店铺资料</span>
            </button>
          </div>
          <el-divider />
          <p class="tip">
            履约流程：用户支付 → 您接单 → 上门打卡 → 上传服务前/后照片 → 完成服务 → 用户确认。打包单以订单内服务为准。
          </p>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Bell,
  Plus,
  Clock,
  Loading,
  User,
  Calendar,
  CircleCheck,
  Money,
  Goods,
  DataLine,
  OfficeBuilding
} from '@element-plus/icons-vue'
import request from '../utils/request'

const d = ref({})
const recentRows = ref([])
const recentLoading = ref(false)

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return Number(n).toFixed(2)
}

function statusType(st) {
  const m = {
    pending_accept: 'warning',
    in_service: 'primary',
    pending_user_confirm: 'info',
    completed: 'success',
    cancelled: 'info'
  }
  return m[st] || ''
}

async function loadDash() {
  const res = await request.get('/service-provider-portal/dashboard')
  d.value = res.data || {}
}

async function loadRecent() {
  recentLoading.value = true
  try {
    const res = await request.get('/service-provider-portal/orders', {
      params: { page: 1, limit: 8 }
    })
    recentRows.value = res.data?.list || []
  } finally {
    recentLoading.value = false
  }
}

function loadAll() {
  loadDash()
  loadRecent()
}

onMounted(() => {
  loadAll()
  window.addEventListener('sp-portal-refresh', loadAll)
})
onUnmounted(() => {
  window.removeEventListener('sp-portal-refresh', loadAll)
})
</script>

<style scoped>
.dash {
  max-width: 1280px;
}
.hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
  padding: 0;
  border: none;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 42%, #115e59 100%);
  opacity: 1;
}
.hero-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 45%);
}
.hero-inner {
  position: relative;
  z-index: 1;
  padding: 28px 28px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  color: #fff;
}
.hero-label {
  margin: 0 0 6px;
  font-size: 12px;
  opacity: 0.85;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.hero-title {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.hero-meta {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.hero-comm {
  opacity: 0.92;
}
.hero-comm.muted {
  opacity: 0.75;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.hero-actions :deep(.el-button) {
  --el-button-bg-color: #fff;
  --el-button-border-color: #fff;
  --el-button-text-color: #0f766e;
  --el-button-hover-bg-color: #ecfdf5;
  --el-button-hover-border-color: #ecfdf5;
}
.hero-actions :deep(.el-button--primary) {
  --el-button-bg-color: #fbbf24;
  --el-button-border-color: #fbbf24;
  --el-button-text-color: #0f172a;
  --el-button-hover-bg-color: #fcd34d;
  --el-button-hover-border-color: #fcd34d;
}
.mr {
  margin-right: 6px;
  vertical-align: middle;
}
.stat-row {
  margin-bottom: 8px !important;
}
.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 18px;
  margin-bottom: 16px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
  color: #0f766e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.stat-icon.plain {
  background: #f1f5f9;
  color: #64748b;
}
.stat-warn .stat-icon {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #b45309;
}
.stat-run .stat-icon {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
}
.stat-wait .stat-icon {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4338ca;
}
.stat-ok .stat-icon {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #047857;
}
.stat-k {
  font-size: 13px;
  color: var(--sp-muted);
}
.stat-v {
  font-size: 26px;
  font-weight: 800;
  color: var(--sp-text);
  letter-spacing: -0.03em;
  margin-top: 4px;
  line-height: 1.2;
}
.block-row {
  margin-top: 8px !important;
}
.panel {
  padding: 0;
  margin-bottom: 16px;
  overflow: hidden;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--sp-border);
  background: linear-gradient(180deg, #fafafa 0%, #fff 100%);
}
.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--sp-text);
}
.panel :deep(.el-table) {
  --el-table-header-bg-color: #f8fafc;
}
.panel :deep(.el-table__inner-wrapper) {
  border-radius: 0;
}
.shortcuts {
  padding-bottom: 8px;
}
.short-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 16px 20px 8px;
}
.short-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid var(--sp-border);
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: var(--sp-text);
  transition: border-color 0.15s, background 0.15s;
}
.short-item:hover {
  border-color: #99f6e4;
  background: #f0fdfa;
}
.short-item .el-icon {
  font-size: 18px;
  color: var(--sp-primary);
}
.tip {
  margin: 0 20px 20px;
  font-size: 12px;
  color: var(--sp-muted);
  line-height: 1.65;
}
</style>
