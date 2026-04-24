<template>
  <div v-loading="loading" class="merchant-page dash">
    <div class="hero merchant-card">
      <div class="hero-text">
        <h1 class="merchant-page-title hero-title">经营概览</h1>
        <p class="hero-desc">
          营收、订单结构与商品表现均基于本店真实成交数据；「近 7 日」为含今日共 7 个自然日，「近 30 日」含今日共 30 天。
        </p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" size="large" round @click="$router.push('/orders')">订单与履约</el-button>
        <el-button size="large" round @click="$router.push('/goods')">商品管理</el-button>
        <el-button size="large" round plain @click="load">刷新数据</el-button>
      </div>
    </div>

    <!-- 核心营收 -->
    <h3 class="section-title">营收与客单</h3>
    <el-row :gutter="16" class="mb">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="rev-card merchant-card">
          <div class="rev-label">今日实收（已支付）</div>
          <div class="rev-num">¥{{ stats.revenue_today }}</div>
          <div v-if="stats.revenue_dod_pct != null" class="rev-sub" :class="{ up: Number(stats.revenue_dod_pct) >= 0 }">
            较昨日 {{ Number(stats.revenue_dod_pct) >= 0 ? '+' : '' }}{{ stats.revenue_dod_pct }}%
          </div>
          <div v-else class="rev-sub muted">昨日无成交，暂无环比</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="rev-card merchant-card">
          <div class="rev-label">昨日实收</div>
          <div class="rev-num muted-num">¥{{ stats.revenue_yesterday }}</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="rev-card merchant-card accent">
          <div class="rev-label">近 7 日实收</div>
          <div class="rev-num">¥{{ stats.revenue_7d }}</div>
          <div class="rev-sub">{{ stats.paid_orders_7d }} 笔 · 客单 ¥{{ stats.avg_ticket_7d }}</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="rev-card merchant-card">
          <div class="rev-label">近 30 日实收</div>
          <div class="rev-num">¥{{ stats.revenue_30d }}</div>
          <div class="rev-sub">{{ stats.paid_orders_30d }} 笔 · 客单 ¥{{ stats.avg_ticket_30d }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mb">
      <el-col :xs="24" :lg="14">
        <div class="panel merchant-card">
          <div class="panel-head">
            <span class="panel-title">近 7 日实收趋势</span>
            <span class="panel-hint">按订单创建日汇总已支付金额</span>
          </div>
          <div class="chart">
            <div v-for="(c, idx) in stats.chart_7d" :key="idx" class="chart-col">
              <div class="bar-wrap">
                <div class="bar" :style="{ height: (c.bar_pct || 0) + '%' }" />
              </div>
              <div class="chart-date">{{ c.date }}</div>
              <div class="chart-val">¥{{ c.revenue }}</div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="10">
        <div class="panel merchant-card">
          <div class="panel-head">
            <span class="panel-title">近 30 日订单状态分布</span>
            <span class="panel-hint">按当前状态计数</span>
          </div>
          <div class="tags-wrap">
            <el-tag v-for="(cnt, st) in stats.status_breakdown_30d" :key="st" class="tag-item" effect="plain">
              {{ statusLabel(st) }} · {{ cnt }}
            </el-tag>
            <span v-if="!hasStatus" class="empty-hint">暂无数据</span>
          </div>
          <el-divider />
          <div class="mini-metrics">
            <div><span class="m-label">完成订单</span><span class="m-val">{{ stats.completed_orders_30d }}</span></div>
            <div><span class="m-label">退款相关</span><span class="m-val warn">{{ stats.refund_orders_30d }}</span></div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 履约与库存 -->
    <h3 class="section-title">履约与商品</h3>
    <el-row :gutter="16" class="stat-row mb">
      <el-col :xs="24" :sm="12" :lg="8" v-for="item in statItems" :key="item.key">
        <div class="stat-box merchant-card" :class="item.tone">
          <div class="stat-icon">{{ item.icon }}</div>
          <div class="stat-body">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-num">{{ stats[item.key] }}</div>
            <div class="stat-hint">{{ item.hint }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mb">
      <el-col :xs="24" :lg="14">
        <div class="panel merchant-card">
          <div class="panel-head">
            <span class="panel-title">履约漏斗</span>
            <el-tag size="small" type="info">待办 {{ stats.todo_fulfillment }}</el-tag>
          </div>
          <div class="funnel">
            <div class="funnel-step">
              <span class="n">{{ stats.pending_accept }}</span>
              <span class="l">待接单</span>
            </div>
            <span class="arrow">→</span>
            <div class="funnel-step">
              <span class="n">{{ stats.pending_service }}</span>
              <span class="l">备货中</span>
            </div>
            <span class="arrow">→</span>
            <div class="funnel-step">
              <span class="n">{{ stats.pending_receipt }}</span>
              <span class="l">待收货</span>
            </div>
          </div>
          <el-alert
            v-if="stats.pending_accept > 0"
            title="有已付款订单待接单，请及时处理。"
            type="warning"
            :closable="false"
            show-icon
            class="mt-alert"
          />
        </div>
      </el-col>
      <el-col :xs="24" :lg="10">
        <div class="panel merchant-card tips-panel">
          <div class="panel-head">
            <span class="panel-title">经营提示</span>
          </div>
          <ul class="tips">
            <li>低库存 SKU <em>{{ stats.low_stock_goods }}</em> 个，在售 <em>{{ stats.on_sale_goods }}</em> 件。</li>
            <li>今日已支付订单 <em>{{ stats.today_paid_orders }}</em> 笔。</li>
          </ul>
        </div>
      </el-col>
    </el-row>

    <!-- 爆款与近期订单 -->
    <h3 class="section-title">商品与订单动态</h3>
    <el-row :gutter="16">
      <el-col :xs="24" :lg="10">
        <div class="panel merchant-card table-panel">
          <div class="panel-head">
            <span class="panel-title">累计销量 TOP5</span>
          </div>
          <el-table :data="stats.top_goods" size="small" empty-text="暂无商品数据">
            <el-table-column label="商品" min-width="120">
              <template #default="{ row }">
                <div class="goods-cell">
                  <el-image v-if="row.main_image" :src="row.main_image" class="g-thumb" fit="cover" />
                  <span class="g-name">{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="sold_count" label="销量" width="72" align="right" />
            <el-table-column prop="stock" label="库存" width="64" align="right" />
            <el-table-column label="单价" width="88" align="right">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :xs="24" :lg="14">
        <div class="panel merchant-card table-panel">
          <div class="panel-head">
            <span class="panel-title">近期订单</span>
            <el-button type="primary" link @click="$router.push('/orders')">全部订单</el-button>
          </div>
          <el-table :data="stats.recent_orders" size="small" empty-text="暂无订单">
            <el-table-column label="订单号" min-width="156">
              <template #default="{ row }">
                <el-button link type="primary" @click="$router.push('/orders/' + row.order_no)">
                  {{ row.order_no }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="order_status_text" label="状态" width="108" />
            <el-table-column prop="pay_status" label="支付" width="80" />
            <el-table-column label="金额" width="88" align="right">
              <template #default="{ row }">¥{{ row.payable_amount }}</template>
            </el-table-column>
            <el-table-column label="时间" width="158">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const stats = reactive({
  pending_accept: 0,
  pending_service: 0,
  pending_receipt: 0,
  todo_fulfillment: 0,
  low_stock_goods: 0,
  today_paid_orders: 0,
  on_sale_goods: 0,
  revenue_today: '0.00',
  revenue_yesterday: '0.00',
  revenue_7d: '0.00',
  revenue_30d: '0.00',
  revenue_dod_pct: null,
  paid_orders_7d: 0,
  paid_orders_30d: 0,
  avg_ticket_7d: '0.00',
  avg_ticket_30d: '0.00',
  completed_orders_30d: 0,
  refund_orders_30d: 0,
  chart_7d: [],
  status_breakdown_30d: {},
  top_goods: [],
  recent_orders: []
})

const statItems = computed(() => [
  { key: 'pending_accept', label: '待接单', hint: '已付款，等待确认', icon: '⏱', tone: 'tone-warn' },
  { key: 'pending_service', label: '备货 / 出餐', hint: '履约中', icon: '📦', tone: '' },
  { key: 'pending_receipt', label: '待收货', hint: '已发货', icon: '🚚', tone: '' },
  { key: 'todo_fulfillment', label: '待办合计', hint: '上三项之和', icon: '📋', tone: 'tone-primary' },
  { key: 'low_stock_goods', label: '低库存预警', hint: '库存≤安全库存', icon: '⚠️', tone: 'tone-danger' },
  { key: 'today_paid_orders', label: '今日已付单', hint: '笔数', icon: '✓', tone: 'tone-ok' },
  { key: 'on_sale_goods', label: '在售 SKU', hint: '上架中', icon: '🛒', tone: 'tone-success' }
])

const hasStatus = computed(() => Object.keys(stats.status_breakdown_30d || {}).length > 0)

const STATUS_MAP = {
  pending_payment: '待付款',
  pending_accept: '待接单',
  pending_service: '备货/出餐',
  pending_receipt: '待收货',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款'
}

function statusLabel(st) {
  return STATUS_MAP[st] || st
}

function formatTime(v) {
  if (!v) return ''
  return new Date(v).toLocaleString('zh-CN')
}

async function load() {
  loading.value = true
  try {
    const { data } = await request.get('/market/merchant/dashboard')
    if (data.code !== 0 && data.errno !== 0) {
      ElMessage.error(data.msg || data.errmsg || '加载失败')
      return
    }
    const d = data.data || {}
    Object.keys(stats).forEach((k) => {
      if (d[k] !== undefined) stats[k] = d[k]
    })
    if (!Array.isArray(d.chart_7d)) stats.chart_7d = []
    if (!d.status_breakdown_30d) stats.status_breakdown_30d = {}
    if (!Array.isArray(d.top_goods)) stats.top_goods = []
    if (!Array.isArray(d.recent_orders)) stats.recent_orders = []
  } catch (_) {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.dash {
  padding-bottom: 24px;
}
.mb {
  margin-bottom: 18px;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin: 8px 0 14px;
  padding-left: 4px;
  border-left: 4px solid #cda05b;
}
.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 26px 28px;
  margin-bottom: 20px;
  background: linear-gradient(120deg, #fff 0%, #faf6ef 45%, #f5efe4 100%);
  border: 1px solid rgba(205, 160, 91, 0.2);
}
.hero-title {
  margin-bottom: 10px;
}
.hero-desc {
  margin: 0;
  max-width: 720px;
  color: #606266;
  font-size: 14px;
  line-height: 1.65;
}
.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.rev-card {
  padding: 20px 18px;
  min-height: 128px;
  border-radius: var(--mp-radius);
}
.rev-card.accent {
  background: linear-gradient(135deg, #fffdf8 0%, #fff9ed 100%);
  border: 1px solid rgba(205, 160, 91, 0.25);
}
.rev-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}
.rev-num {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
}
.muted-num {
  color: #606266;
}
.rev-sub {
  margin-top: 8px;
  font-size: 12px;
  color: #67c23a;
}
.rev-sub.up {
  color: #67c23a;
}
.rev-sub:not(.up) {
  color: #f56c6c;
}
.rev-sub.muted {
  color: #c0c4cc;
}

.panel {
  padding: 18px 20px 22px;
  min-height: 200px;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.panel-title {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}
.panel-hint {
  font-size: 12px;
  color: #c0c4cc;
}

.chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 8px;
  min-height: 160px;
  padding: 8px 0 0;
}
.chart-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}
.bar-wrap {
  width: 100%;
  max-width: 48px;
  height: 120px;
  background: #f0f2f5;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.bar {
  width: 100%;
  background: linear-gradient(180deg, #cda05b, #a67c00);
  border-radius: 8px 8px 0 0;
  min-height: 4px;
  transition: height 0.3s;
}
.chart-date {
  margin-top: 8px;
  font-size: 11px;
  color: #909399;
}
.chart-val {
  font-size: 11px;
  color: #606266;
  margin-top: 2px;
  white-space: nowrap;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-item {
  margin: 0;
}
.empty-hint {
  font-size: 13px;
  color: #c0c4cc;
}
.mini-metrics {
  display: flex;
  gap: 32px;
  font-size: 14px;
}
.m-label {
  color: #909399;
  margin-right: 8px;
}
.m-val {
  font-weight: 700;
  color: #303133;
}
.m-val.warn {
  color: #e6a23c;
}

.stat-row {
  margin-bottom: 0;
}
.stat-box {
  display: flex;
  gap: 14px;
  padding: 18px 18px;
  margin-bottom: 16px;
  min-height: 108px;
  align-items: flex-start;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(30, 34, 45, 0.1);
}
.stat-icon {
  font-size: 26px;
  line-height: 1;
}
.stat-body {
  flex: 1;
  min-width: 0;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}
.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}
.stat-hint {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 6px;
}
.tone-warn .stat-num {
  color: #e6a23c;
}
.tone-primary .stat-num {
  color: #409eff;
}
.tone-danger .stat-num {
  color: #f56c6c;
}
.tone-success .stat-num {
  color: #67c23a;
}
.tone-ok .stat-num {
  color: #67c23a;
}

.funnel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 8px;
}
.funnel-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: #f5f7fa;
  border-radius: 10px;
  min-width: 88px;
}
.funnel-step .n {
  font-size: 22px;
  font-weight: 700;
}
.funnel-step .l {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.arrow {
  color: #dcdfe6;
}
.mt-alert {
  margin-top: 12px;
}
.tips-panel .tips {
  margin: 0;
  padding-left: 18px;
  color: #606266;
  font-size: 13px;
  line-height: 1.85;
}
.tips em {
  font-style: normal;
  font-weight: 700;
  color: #cda05b;
}

.table-panel {
  padding-bottom: 8px;
}
.goods-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.g-thumb {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  flex-shrink: 0;
}
.g-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
