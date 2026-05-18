<template>
  <div v-loading="store.dashboardLoading" class="analytics-page">
    <div class="hero merchant-card">
      <div>
        <h1 class="title">销售数据分析</h1>
        <p class="sub">与「工作台」共用实时数据：近 7 日营收趋势、近 30 日订单状态、TOP 商品表现。</p>
      </div>
      <el-button type="primary" round @click="refresh">刷新数据</el-button>
    </div>

    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="k in kpis" :key="k.label">
        <div class="kpi merchant-card">
          <div class="kpi-label">{{ k.label }}</div>
          <div class="kpi-val">{{ k.val }}</div>
          <div class="kpi-hint">{{ k.hint }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="14">
        <div class="panel merchant-card">
          <div class="panel-head">近 7 日实收趋势</div>
          <div ref="lineRef" class="chart-box" />
        </div>
      </el-col>
      <el-col :xs="24" :lg="10">
        <div class="panel merchant-card">
          <div class="panel-head">近 30 日订单状态分布</div>
          <div ref="pieRef" class="chart-box" />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="24">
        <div class="panel merchant-card">
          <div class="panel-head">累计销量 TOP 商品</div>
          <div ref="barRef" class="chart-box chart-tall" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useMarketConsoleStore } from '../stores/marketConsole'

const store = useMarketConsoleStore()
const lineRef = ref()
const pieRef = ref()
const barRef = ref()
let lineChart
let pieChart
let barChart

const d = computed(() => store.dashboard || {})

const kpis = computed(() => {
  const x = d.value
  return [
    { label: '今日实收', val: `¥${x.revenue_today || '0.00'}`, hint: x.revenue_dod_pct != null ? `环比昨日 ${x.revenue_dod_pct}%` : '昨日无成交则无环比' },
    { label: '近 7 日实收', val: `¥${x.revenue_7d || '0.00'}`, hint: `${x.paid_orders_7d || 0} 笔已付` },
    { label: '近 30 日实收', val: `¥${x.revenue_30d || '0.00'}`, hint: `客单 ¥${x.avg_ticket_30d || '0.00'}` },
    { label: '待办履约', val: String(x.todo_fulfillment ?? 0), hint: '待接单+备货+待收货' }
  ]
})

const STATUS_LABEL = {
  pending_payment: '待付款',
  pending_accept: '待接单',
  pending_service: '备货/出餐',
  pending_receipt: '待收货',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款'
}

function disposeAll() {
  lineChart?.dispose()
  pieChart?.dispose()
  barChart?.dispose()
  lineChart = pieChart = barChart = null
}

function renderLine() {
  if (!lineRef.value) return
  const chart7 = d.value.chart_7d || []
  if (!lineChart) lineChart = echarts.init(lineRef.value)
  lineChart.setOption({
    color: ['#cda05b'],
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 24, top: 32, bottom: 32 },
    xAxis: {
      type: 'category',
      data: chart7.map((c) => c.date),
      axisLine: { lineStyle: { color: '#909399' } }
    },
    yAxis: { type: 'value', name: '元', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      {
        name: '实收',
        type: 'line',
        smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(205,160,91,0.35)' }, { offset: 1, color: 'rgba(205,160,91,0.02)' }]) },
        data: chart7.map((c) => Number(c.revenue))
      }
    ]
  })
}

function renderPie() {
  if (!pieRef.value) return
  const br = d.value.status_breakdown_30d || {}
  const pieData = Object.keys(br).map((k) => ({ name: STATUS_LABEL[k] || k, value: br[k] }))
  if (!pieChart) pieChart = echarts.init(pieRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        type: 'pie',
        radius: ['36%', '62%'],
        center: ['50%', '46%'],
        data: pieData.length ? pieData : [{ name: '暂无', value: 1 }],
        label: { formatter: '{b}\n{c}' },
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 }
      }
    ],
    color: ['#cda05b', '#5b8ff9', '#61d9a8', '#65789b', '#f6bd42', '#7262fd', '#78d3f8']
  })
}

function renderBar() {
  if (!barRef.value) return
  const goods = d.value.top_goods || []
  if (!barChart) barChart = echarts.init(barRef.value)
  barChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 120, right: 32, top: 24, bottom: 24 },
    xAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: {
      type: 'category',
      data: goods.map((g) => g.name).reverse(),
      axisLabel: { width: 110, overflow: 'truncate' }
    },
    series: [
      {
        name: '销量',
        type: 'bar',
        data: goods.map((g) => g.sold_count).reverse(),
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#2d3548' },
            { offset: 1, color: '#cda05b' }
          ])
        }
      }
    ]
  })
}

function renderCharts() {
  renderLine()
  renderPie()
  renderBar()
}

async function refresh() {
  await store.fetchDashboard(true)
  renderCharts()
}

function onResize() {
  lineChart?.resize()
  pieChart?.resize()
  barChart?.resize()
}

onMounted(async () => {
  await store.fetchDashboard(false)
  renderCharts()
  window.addEventListener('resize', onResize)
})

watch(
  () => store.dashboard,
  () => {
    renderCharts()
  },
  { deep: true }
)

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  disposeAll()
})
</script>

<style scoped>
.analytics-page {
  padding-bottom: 24px;
}
.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 26px;
  margin-bottom: 18px;
  background: linear-gradient(125deg, #1e222d 0%, #2d3548 55%, #1a1d26 100%);
  color: #fff;
  border: 1px solid rgba(205, 160, 91, 0.25);
}
.title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
}
.sub {
  margin: 0;
  font-size: 13px;
  color: #a3b1c6;
  max-width: 640px;
  line-height: 1.5;
}
.kpi-row {
  margin-bottom: 16px;
}
.kpi {
  padding: 18px 20px;
  margin-bottom: 12px;
  border-left: 4px solid #cda05b;
}
.kpi-label {
  font-size: 13px;
  color: #909399;
}
.kpi-val {
  font-size: 24px;
  font-weight: 800;
  color: #303133;
  margin: 6px 0;
}
.kpi-hint {
  font-size: 12px;
  color: #c0c4cc;
}
.chart-row {
  margin-bottom: 16px;
}
.panel {
  padding: 16px 18px 8px;
  margin-bottom: 12px;
}
.panel-head {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 8px;
  color: #303133;
}
.chart-box {
  height: 300px;
  width: 100%;
}
.chart-tall {
  height: 340px;
}
</style>
