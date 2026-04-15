<template>
  <div class="page-wrap">
    <!-- 本地集市 - 动态数据流面板 -->
    <div class="tech-flow-panel">
      <div class="flow-header">
        <div class="glow-title">
          <el-icon class="spin-icon"><Connection /></el-icon>
          本地集市 · 实时交易链路流
        </div>
        <div class="dot-status"><span class="blink-dot"></span> LINK ACTIVE</div>
      </div>
      
      <div class="flow-canvas">
        <div class="node-box">
          <div class="node pulse-node color-blue">买家终端</div>
        </div>
        <div class="line horizontal">
          <div class="flowing-particle"></div>
        </div>
        <div class="node-box">
          <div class="node pulse-node color-purple">交易引擎</div>
        </div>
        <div class="line split array">
           <div class="sub-line"><div class="flowing-particle delay-1"></div></div>
           <div class="sub-line"><div class="flowing-particle delay-2"></div></div>
        </div>
        <div class="node-column">
          <div class="node mini-node color-green">支付平台</div>
          <div class="node mini-node color-orange">商户接单</div>
        </div>
      </div>
    </div>

    <!-- 数据表工具栏 -->
    <div class="content-box">
      <el-form :inline="true" class="filter tech-filter" @submit.prevent="search">
        <el-form-item label="订单号">
          <el-input v-model="filters.order_no" clearable placeholder="模糊搜索" style="width: 180px" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="filters.order_status" clearable placeholder="全状态" style="width: 140px">
            <el-option label="待支付" value="pending_payment" />
            <el-option label="已支付" value="paid" />
            <el-option label="配送中" value="delivering" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="filters.pay_status" clearable placeholder="全部" style="width: 140px">
            <el-option label="未付" value="unpaid" />
            <el-option label="已付" value="paid" />
            <el-option label="退款中" value="refund_pending" />
            <el-option label="已退款" value="refunded" />
            <el-option label="失败" value="pay_failed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search" class="glow-btn">执行查询指令</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="rows" border stripe @row-click="openDetail">
        <el-table-column prop="order_no" label="订单号" min-width="160" show-overflow-tooltip />
      <el-table-column label="店铺" min-width="120">
        <template #default="{ row }">{{ row.shop?.name || row.shop_id }}</template>
      </el-table-column>
      <el-table-column label="用户" width="120">
        <template #default="{ row }">{{ row.buyer?.nickname || row.user_id }}</template>
      </el-table-column>
      <el-table-column prop="payable_amount" label="应付" width="90" />
      <el-table-column prop="order_status" label="订单状态" width="100" />
      <el-table-column prop="pay_status" label="支付" width="100" />
      <el-table-column prop="created_at" label="创建时间" width="170" />
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click.stop="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
      <el-pagination
        class="pager tech-pager"
        v-model:current-page="page"
        v-model:page-size="limit"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="load"
      />
    </div>

    <el-drawer v-model="drawer" title="订单详情" size="50%">
      <template v-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ detail.order?.order_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.order?.order_status }} / {{ detail.order?.pay_status }}</el-descriptions-item>
          <el-descriptions-item label="金额">￥{{ detail.order?.payable_amount }}</el-descriptions-item>
          <el-descriptions-item label="收货">{{ detail.order?.receiver_name }} {{ detail.order?.receiver_phone }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ detail.order?.receiver_address }}</el-descriptions-item>
        </el-descriptions>
        <h4 class="mt">明细</h4>
        <el-table :data="detail.items" size="small" border>
          <el-table-column prop="goods_name_snapshot" label="商品" />
          <el-table-column prop="quantity" label="数量" width="70" />
          <el-table-column prop="unit_price_snapshot" label="单价" width="90" />
          <el-table-column prop="amount" label="小计" width="90" />
        </el-table>
        <h4 class="mt">支付流水</h4>
        <el-table :data="detail.payments" size="small" border>
          <el-table-column prop="out_trade_no" label="商户单号" show-overflow-tooltip />
          <el-table-column prop="pay_status" label="状态" width="90" />
          <el-table-column prop="amount" label="金额" width="90" />
          <el-table-column prop="created_at" label="时间" width="170" />
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Connection } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const filters = reactive({
  order_no: '',
  order_status: '',
  pay_status: ''
})
const drawer = ref(false)
const detail = ref(null)

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    if (filters.order_no) params.order_no = filters.order_no
    if (filters.order_status) params.order_status = filters.order_status
    if (filters.pay_status) params.pay_status = filters.pay_status
    const res = await request.get('/admin/market-orders', { params })
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

async function openDetail(row) {
  try {
    const res = await request.get(`/admin/market-orders/${encodeURIComponent(row.order_no)}`)
    detail.value = res.data || null
    drawer.value = true
  } catch (e) {
    ElMessage.error(e.message || '加载详情失败')
  }
}

onMounted(load)
</script>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 科技波动面板 */
.tech-flow-panel {
  background: linear-gradient(135deg, #2b2f3a, #1f232d);
  border-radius: 12px;
  padding: 24px;
  color: #fff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border: 1px solid rgba(255,255,255,0.05);
}
.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}
.glow-title {
  font-size: 16px;
  font-weight: 600;
  color: #a5b4fc;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 0 10px rgba(165,180,252,0.4);
}
.spin-icon {
  font-size: 20px;
  animation: spin 4s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

.dot-status {
  font-size: 12px;
  color: #34d399;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(16,185,129,0.1);
  padding: 4px 12px;
  border-radius: 20px;
}
.blink-dot { width: 8px; height: 8px; background: #34d399; border-radius: 50%; box-shadow: 0 0 8px #34d399; animation: blink 1s infinite alternate; }

/* 链路流动画 */
.flow-canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  gap: 20px;
}
.node {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
  position: relative;
}
.color-blue { background: rgba(59,130,246,0.15); border: 1px solid #3b82f6; color: #60a5fa; box-shadow: 0 0 15px rgba(59,130,246,0.2); }
.color-purple { background: rgba(139,92,246,0.15); border: 1px solid #8b5cf6; color: #a78bfa; box-shadow: 0 0 15px rgba(139,92,246,0.2); }
.color-green { background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #34d399; box-shadow: 0 0 10px rgba(16,185,129,0.2); margin-bottom: 20px; }
.color-orange { background: rgba(245,158,11,0.15); border: 1px solid #f59e0b; color: #fbbf24; box-shadow: 0 0 10px rgba(245,158,11,0.2); }

.pulse-node { animation: nodePulse 2s infinite alternate; }
@keyframes nodePulse { to { transform: scale(1.05); } }

.line {
  height: 2px;
  background: rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
}
.line.horizontal { width: 100px; }
.line.split { width: 100px; display: flex; flex-direction: column; justify-content: space-between; height: 60px; background: transparent; }
.sub-line { width: 100%; height: 2px; background: rgba(255,255,255,0.1); position: relative; overflow: hidden; }

.flowing-particle {
  position: absolute;
  top: 0; left: 0;
  width: 30px; height: 100%;
  background: linear-gradient(90deg, transparent, #fff, transparent);
  animation: flow 1.5s infinite linear;
}
.delay-1 { animation-delay: 0.5s; background: linear-gradient(90deg, transparent, #34d399, transparent); }
.delay-2 { animation-delay: 1s; background: linear-gradient(90deg, transparent, #fbbf24, transparent); }

@keyframes flow {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(300px); }
}

.content-box {
  background: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}

.filter {
  margin-bottom: 16px;
}
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
.mt {
  margin: 16px 0 8px;
}
.glow-btn {
  background: #1890ff;
  border: none;
  box-shadow: 0 4px 12px rgba(24,144,255,0.3);
  transition: all 0.3s;
}
.glow-btn:hover { box-shadow: 0 4px 20px rgba(24,144,255,0.5); }
</style>
