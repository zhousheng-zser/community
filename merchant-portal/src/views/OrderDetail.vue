<template>
  <div v-loading="loading" class="page">
    <el-page-header @back="$router.push('/orders')" content="订单详情" />
    <template v-if="order">
      <el-card class="card" shadow="never">
        <template #header>
          <span>订单 {{ order.order_no }}</span>
          <el-tag class="ml" type="info">{{ order.order_status_text }}</el-tag>
          <el-tag class="ml" type="success" v-if="order.pay_status === 'paid'">已支付</el-tag>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="实付金额">¥{{ order.payable_amount }}</el-descriptions-item>
          <el-descriptions-item label="商品金额">¥{{ order.goods_amount }}</el-descriptions-item>
          <el-descriptions-item label="配送费">¥{{ order.delivery_fee }}</el-descriptions-item>
          <el-descriptions-item label="配送方式">{{ order.delivery_mode === 'pickup' ? '自提' : '快递/配送' }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ order.receiver_name }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ order.receiver_phone }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ order.receiver_address || '—' }}</el-descriptions-item>
          <el-descriptions-item label="买家">{{ order.buyer_nickname || '—' }} {{ order.buyer_phone_masked }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ order.remark || '—' }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatTime(order.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ formatTime(order.paid_at) || '—' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="card" shadow="never">
        <template #header>商品明细</template>
        <el-table :data="items" size="small">
          <el-table-column label="图" width="72">
            <template #default="{ row }">
              <el-image v-if="row.image" :src="row.image" style="width: 48px; height: 48px" fit="cover" />
            </template>
          </el-table-column>
          <el-table-column prop="goods_name" label="名称" min-width="140" />
          <el-table-column prop="quantity" label="数量" width="70" />
          <el-table-column prop="unit_price" label="单价" width="90" />
          <el-table-column prop="amount" label="小计" width="90" />
        </el-table>
      </el-card>

      <el-card v-if="payments.length" class="card" shadow="never">
        <template #header>支付记录</template>
        <el-table :data="payments" size="small">
          <el-table-column prop="out_trade_no" label="商户单号" min-width="160" />
          <el-table-column prop="pay_status" label="状态" width="100" />
          <el-table-column prop="amount" label="金额" width="90" />
          <el-table-column label="支付时间" width="170">
            <template #default="{ row }">{{ formatTime(row.paid_at || row.created_at) }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="card" shadow="never">
        <template #header>进度追踪</template>
        <el-timeline>
          <el-timeline-item v-for="(ev, idx) in timeline" :key="idx" :timestamp="formatTime(ev.at)">
            {{ ev.title }}
            <span v-if="ev.detail" class="sub"> — {{ ev.detail }}</span>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <div class="actions">
        <template v-if="order.order_status === 'pending_accept' && order.pay_status === 'paid'">
          <el-button type="primary" :loading="acting" @click="doAction('accept')">接单</el-button>
          <el-button type="danger" plain :loading="acting" @click="openReject">拒单</el-button>
        </template>
        <template v-if="order.order_status === 'pending_service'">
          <el-button type="primary" :loading="acting" @click="doAction('dispatch')">标记已发货 / 出餐完成</el-button>
        </template>
        <template v-if="order.order_status === 'pending_receipt'">
          <el-button :loading="acting" @click="doAction('complete')">确认完成（顾客已收货）</el-button>
        </template>
      </div>
    </template>

    <el-dialog v-model="rejectVisible" title="拒单原因" width="400px">
      <el-input v-model="rejectNote" type="textarea" rows="3" placeholder="选填，将展示在订单关闭原因中" />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="acting" @click="confirmReject">确认拒单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const loading = ref(false)
const acting = ref(false)
const raw = ref(null)
const rejectVisible = ref(false)
const rejectNote = ref('')

const order = computed(() => (raw.value && raw.value.order) || null)
const items = computed(() => (raw.value && raw.value.items) || [])
const payments = computed(() => (raw.value && raw.value.payments) || [])
const timeline = computed(() => (raw.value && raw.value.timeline) || [])

function formatTime(v) {
  if (!v) return ''
  return new Date(v).toLocaleString('zh-CN')
}

async function load() {
  loading.value = true
  try {
    const { data } = await request.get('/market/merchant/orders/' + encodeURIComponent(route.params.orderNo))
    if (data.code !== 0 && data.errno !== 0) {
      ElMessage.error(data.msg || data.errmsg || '加载失败')
      return
    }
    raw.value = data.data || {}
  } finally {
    loading.value = false
  }
}

async function doAction(action) {
  acting.value = true
  try {
    const { data } = await request.post(
      '/market/merchant/orders/' + encodeURIComponent(route.params.orderNo) + '/action',
      { action }
    )
    if (data.code !== 0 && data.errno !== 0) {
      ElMessage.error(data.msg || data.errmsg || '操作失败')
      return
    }
    ElMessage.success('已更新')
    load()
  } finally {
    acting.value = false
  }
}

function openReject() {
  rejectNote.value = ''
  rejectVisible.value = true
}

async function confirmReject() {
  acting.value = true
  try {
    const { data } = await request.post(
      '/market/merchant/orders/' + encodeURIComponent(route.params.orderNo) + '/action',
      { action: 'reject', note: rejectNote.value }
    )
    if (data.code !== 0 && data.errno !== 0) {
      ElMessage.error(data.msg || data.errmsg || '操作失败')
      return
    }
    ElMessage.success('已拒单')
    rejectVisible.value = false
    load()
  } finally {
    acting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  max-width: 960px;
}
.ml {
  margin-left: 8px;
}
.card {
  margin-top: 16px;
  border-radius: 10px;
}
.sub {
  color: #909399;
  font-size: 13px;
}
.actions {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
