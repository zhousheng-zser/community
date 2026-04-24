<template>
  <div class="sp-page detail-page" v-loading="loading">
    <div v-if="order" class="detail-inner">
      <div class="top-bar">
        <el-button text type="primary" @click="$router.push('/orders')">
          <el-icon><ArrowLeft /></el-icon>
          返回订单列表
        </el-button>
      </div>

      <div class="hero sp-card">
        <div class="hero-main">
          <el-tag :type="statusTag(order.status)" size="large" effect="dark" round>{{ order.status_text }}</el-tag>
          <h2 class="oid">订单 #{{ order.id }}</h2>
          <p class="ono">{{ order.order_no || '—' }}</p>
        </div>
        <div class="hero-side">
          <div class="amt-label">订单金额</div>
          <div class="amt">￥{{ order.amount }}</div>
          <el-tag :type="order.pay_status === 'paid' ? 'success' : 'info'" effect="plain">{{ order.pay_status }}</el-tag>
        </div>
      </div>

      <div class="panel sp-card">
        <h3 class="sec-h">订单信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="服务">{{ order.service_title }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ order.created_at || '—' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ order.contact_name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ order.contact_phone || '—' }}</el-descriptions-item>
          <el-descriptions-item label="预约时间" :span="2">{{ order.appointment_time || '—' }}</el-descriptions-item>
          <el-descriptions-item label="地址 / 备注" :span="2">
            <pre class="pre">{{ addrText }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="order.buyer" class="panel sp-card">
        <h3 class="sec-h">用户</h3>
        <p class="buyer-line">
          <span>{{ order.buyer.nickname || '用户' }}</span>
          <span v-if="order.buyer.phone" class="muted"> · {{ order.buyer.phone }}</span>
        </p>
      </div>

      <div v-if="order.fulfillment_meta && metaKeys.length" class="panel sp-card">
        <h3 class="sec-h">履约追踪</h3>
        <div v-if="checkIns.length" class="block">
          <div class="sec-title">上门打卡</div>
          <ul class="list">
            <li v-for="(c, i) in checkIns" :key="i">{{ c.at }} · {{ c.latitude }}, {{ c.longitude }}</li>
          </ul>
        </div>
        <div v-if="evidence.before?.length || evidence.after?.length" class="block">
          <div class="sec-title">服务凭证</div>
          <p>服务前 {{ (evidence.before || []).length }} 张 · 服务后 {{ (evidence.after || []).length }} 张</p>
        </div>
      </div>

      <div class="panel sp-card actions-panel">
        <h3 class="sec-h">履约操作</h3>
        <el-space wrap size="large">
          <el-button
            v-if="order.status === 'pending_accept' && order.pay_status === 'paid'"
            type="primary"
            size="large"
            :loading="acting"
            @click="doAccept"
          >
            接单并开始服务
          </el-button>
          <el-button v-if="order.status === 'in_service'" size="large" :loading="acting" @click="doCheckIn">上门打卡</el-button>
          <el-button v-if="order.status === 'in_service'" size="large" :loading="acting" @click="doEvidence('before')">上传服务前照片</el-button>
          <el-button v-if="order.status === 'in_service'" size="large" :loading="acting" @click="doEvidence('after')">上传服务后照片</el-button>
          <el-button v-if="order.status === 'in_service'" type="success" size="large" :loading="acting" @click="doComplete">完成服务</el-button>
        </el-space>
        <p class="tip">打卡与凭证图片需为可访问的 https 链接；演示可填任意示例图 URL。</p>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="订单不存在或无权查看" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import request from '../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const loading = ref(false)
const acting = ref(false)
const order = ref(null)

const checkIns = computed(() => (order.value?.fulfillment_meta && order.value.fulfillment_meta.check_ins) || [])
const evidence = computed(() => (order.value?.fulfillment_meta && order.value.fulfillment_meta.evidence) || {})
const metaKeys = computed(() => {
  const m = order.value?.fulfillment_meta || {}
  return Object.keys(m).filter((k) => m[k] && (Array.isArray(m[k]) ? m[k].length : Object.keys(m[k]).length))
})

function statusTag(st) {
  const m = {
    pending_accept: 'warning',
    in_service: 'primary',
    pending_user_confirm: 'info',
    completed: 'success'
  }
  return m[st] || 'info'
}

const addrText = computed(() => {
  const s = order.value?.address_snapshot
  if (!s) return order.value?.remark || '—'
  return JSON.stringify(s, null, 2)
})

async function load() {
  loading.value = true
  try {
    const res = await request.get(`/service-provider-portal/orders/${route.params.id}`)
    order.value = res.data
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

async function doAccept() {
  acting.value = true
  try {
    await request.post(`/service-provider-portal/orders/${route.params.id}/accept`)
    ElMessage.success('已接单')
    await load()
  } catch (e) {
    ElMessage.error(e.message || '失败')
  } finally {
    acting.value = false
  }
}

async function doCheckIn() {
  acting.value = true
  try {
    await request.post(`/service-provider-portal/orders/${route.params.id}/check-in`, {
      latitude: 30.2741,
      longitude: 120.1551,
      accuracy: 20
    })
    ElMessage.success('已记录打卡')
    await load()
  } catch (e) {
    ElMessage.error(e.message || '失败')
  } finally {
    acting.value = false
  }
}

async function doEvidence(kind) {
  try {
    const { value } = await ElMessageBox.prompt('图片 URL（可多条用逗号分隔）', kind === 'before' ? '服务前' : '服务后', {
      inputPlaceholder: 'https://...'
    })
    const urls = String(value || '')
      .split(/[,，\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!urls.length) return
    acting.value = true
    await request.post(`/service-provider-portal/orders/${route.params.id}/evidence`, { kind, urls })
    ElMessage.success('已上传')
    await load()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '失败')
  } finally {
    acting.value = false
  }
}

async function doComplete() {
  acting.value = true
  try {
    await request.post(`/service-provider-portal/orders/${route.params.id}/complete`)
    ElMessage.success('已提交')
    await load()
  } catch (e) {
    ElMessage.error(e.message || '失败')
  } finally {
    acting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.detail-page {
  padding-top: 0;
  max-width: 960px;
}
.top-bar {
  margin-bottom: 14px;
}
.hero {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding: 24px 24px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #fff 100%);
}
.hero-main .oid {
  margin: 12px 0 4px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.ono {
  margin: 0;
  font-size: 13px;
  color: var(--sp-muted);
  font-family: ui-monospace, monospace;
}
.hero-side {
  text-align: right;
}
.amt-label {
  font-size: 12px;
  color: var(--sp-muted);
}
.amt {
  font-size: 28px;
  font-weight: 800;
  color: #0f766e;
  margin: 4px 0 8px;
}
.panel {
  padding: 20px 22px 22px;
  margin-bottom: 16px;
}
.sec-h {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 700;
  color: var(--sp-text);
}
.pre {
  margin: 0;
  white-space: pre-wrap;
  font-size: 13px;
  font-family: inherit;
}
.buyer-line {
  margin: 0;
  font-size: 14px;
}
.muted {
  color: var(--sp-muted);
}
.block {
  margin-bottom: 12px;
}
.sec-title {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
}
.list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: var(--sp-muted);
}
.actions-panel {
  padding-bottom: 24px;
}
.tip {
  font-size: 12px;
  color: var(--sp-muted);
  margin-top: 16px;
  line-height: 1.6;
}
</style>
