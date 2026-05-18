<template>
  <div v-loading="loading" class="analytics-page">
    <div class="hero sp-card">
      <div>
        <h1 class="title">销售数据分析</h1>
        <p class="sub">与「工作台」共享数据：仪表盘 KPI + 近 30 日已完成订单的实收趋势（按完成日汇总）。</p>
      </div>
      <el-button type="primary" round @click="refresh">刷新</el-button>
    </div>

    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="k in kpis" :key="k.label">
        <div class="kpi sp-card">
          <div class="kpi-label">{{ k.label }}</div>
          <div class="kpi-val">{{ k.val }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="14">
        <div class="panel sp-card">
          <div class="panel-head">近 30 日完成单 · 日实收（元）</div>
          <div ref="lineRef" class="chart-box" />
        </div>
      </el-col>
      <el-col :xs="24" :lg="10">
        <div class="panel sp-card">
          <div class="panel-head">当前履约结构</div>
          <div ref="pieRef" class="chart-box" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useSpConsoleStore } from '../stores/spConsole'

const store = useSpConsoleStore()
const lineRef = ref()
const pieRef = ref()
let lineChart
let pieChart
const loading = ref(false)

const dash = computed(() => store.dashboard || {})

const kpis = computed(() => {
  const x = dash.value
  return [
    { label: '7 日已付金额', val: `¥${fmt(x.paid_amount_7d)}` },
    { label: '今日新单', val: String(x.orders_today ?? '—') },
    { label: '近 7 日完成', val: String(x.orders_completed_7d ?? '—') },
    { label: '累计订单', val: String(x.orders_total ?? '—') }
  ]
})

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return '0.00'
  return Number(n).toFixed(2)
}

function disposeAll() {
  lineChart?.dispose()
  pieChart?.dispose()
  lineChart = pieChart = null
}

function sortedDaily() {
  const rows = store.incomeDaily || []
  return [...rows].sort((a, b) => {
    const da = String(a.date || a.d || '')
    const db = String(b.date || b.d || '')
    return da.localeCompare(db)
  })
}

function renderLine() {
  if (!lineRef.value) return
  const rows = sortedDaily()
  if (!lineChart) lineChart = echarts.init(lineRef.value)
  const dates = rows.map((r) => String(r.date || r.d || '').slice(0, 10))
  const amounts = rows.map((r) => Number(r.total_amount != null ? r.total_amount : r.total || 0))
  lineChart.setOption({
    color: ['#0d9488'],
    tooltip: { trigger: 'axis' },
    grid: { left: 52, right: 20, top: 28, bottom: 28 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { rotate: dates.length > 12 ? 40 : 0, fontSize: 11 }
    },
    yAxis: { type: 'value', name: '元', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      {
        name: '实收',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(13,148,136,0.35)' },
            { offset: 1, color: 'rgba(13,148,136,0.02)' }
          ])
        },
        data: amounts
      }
    ]
  })
}

function renderPie() {
  if (!pieRef.value) return
  const x = dash.value
  const pieData = [
    { name: '待接单', value: Number(x.pending_accept || 0) },
    { name: '服务中', value: Number(x.in_service || 0) },
    { name: '待用户确认', value: Number(x.pending_user_confirm || 0) }
  ].filter((i) => i.value > 0)
  if (!pieChart) pieChart = echarts.init(pieRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['34%', '58%'],
        center: ['50%', '44%'],
        data: pieData.length ? pieData : [{ name: '暂无在途', value: 1 }],
        label: { formatter: '{b}\n{c}' },
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 }
      }
    ],
    color: ['#f59e0b', '#0d9488', '#6366f1', '#94a3b8']
  })
}

function renderCharts() {
  renderLine()
  renderPie()
}

async function refresh() {
  loading.value = true
  try {
    await Promise.all([store.fetchDashboard(true), store.fetchIncomeDaily(true)])
    renderCharts()
  } finally {
    loading.value = false
  }
}

function onResize() {
  lineChart?.resize()
  pieChart?.resize()
}

onMounted(async () => {
  window.addEventListener('resize', onResize)
  await refresh()
})

watch(
  () => [store.dashboard, store.incomeDaily],
  () => renderCharts(),
  { deep: true }
)

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  disposeAll()
})
</script>

<style scoped>
.analytics-page {
  max-width: 1280px;
}
.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  margin-bottom: 18px;
  background: linear-gradient(125deg, #0f766e 0%, #0d9488 50%, #115e59 100%);
  color: #fff;
  border: none;
}
.title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 800;
}
.sub {
  margin: 0;
  font-size: 13px;
  opacity: 0.92;
  max-width: 640px;
  line-height: 1.5;
}
.kpi-row {
  margin-bottom: 16px;
}
.kpi {
  padding: 16px 18px;
  margin-bottom: 12px;
  border-left: 4px solid #0d9488;
}
.kpi-label {
  font-size: 12px;
  color: var(--sp-muted);
}
.kpi-val {
  font-size: 22px;
  font-weight: 800;
  color: var(--sp-text);
  margin-top: 6px;
}
.chart-row {
  margin-bottom: 16px;
}
.panel {
  padding: 14px 16px 8px;
  margin-bottom: 12px;
}
.panel-head {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 6px;
  color: var(--sp-text);
}
.chart-box {
  height: 320px;
  width: 100%;
}
</style>
