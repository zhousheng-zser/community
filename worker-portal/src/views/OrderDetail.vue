<template>
  <div v-loading="loading">
    <el-page-header @back="$router.push('/orders')" content="订单详情" />
    <el-descriptions v-if="order" :column="1" border class="mt">
      <el-descriptions-item label="订单号">{{ order.id }}</el-descriptions-item>
      <el-descriptions-item label="状态">{{ order.status_text }} ({{ order.status }})</el-descriptions-item>
      <el-descriptions-item label="服务">{{ order.service_title }}</el-descriptions-item>
      <el-descriptions-item label="金额">{{ order.amount }}</el-descriptions-item>
      <el-descriptions-item label="预约时间">{{ order.appointment_time || '—' }}</el-descriptions-item>
      <el-descriptions-item label="用户手机（脱敏）">{{ order.buyer_phone_masked }}</el-descriptions-item>
      <el-descriptions-item label="地址">{{ addrText }}</el-descriptions-item>
    </el-descriptions>

    <div v-if="order" class="actions mt">
      <el-button v-if="order.status === 'dispatched'" type="primary" @click="doAccept">接单</el-button>
      <el-button v-if="order.status === 'dispatched'" type="danger" @click="showReject = true">拒单</el-button>
      <el-button v-if="order.status === 'dispatched' || order.status === 'in_service'" @click="doCheckIn">到达打卡</el-button>
      <el-button v-if="order.status === 'in_service'" type="success" @click="showEvidence = true">上传留证</el-button>
      <el-button v-if="order.status === 'in_service'" @click="showAddon = true">加项申请</el-button>
      <el-button v-if="order.status === 'in_service'" type="warning" @click="doComplete">完成服务</el-button>
    </div>

    <el-dialog v-model="showReject" title="拒单原因" width="400px">
      <el-input v-model="rejectReason" type="textarea" rows="3" />
      <template #footer>
        <el-button @click="showReject = false">取消</el-button>
        <el-button type="primary" @click="doReject">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEvidence" title="留证图片 URL（逗号分隔，可先上传再填 URL）" width="500px">
      <el-input v-model="evidenceUrls" type="textarea" rows="3" placeholder="https://...,https://..." />
      <el-radio-group v-model="evidenceKind" class="mt">
        <el-radio label="before">服务前</el-radio>
        <el-radio label="after">服务后</el-radio>
      </el-radio-group>
      <template #footer>
        <el-button @click="showEvidence = false">取消</el-button>
        <el-button type="primary" @click="doEvidence">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddon" title="加项说明" width="400px">
      <el-input v-model="addonRemark" type="textarea" rows="4" />
      <template #footer>
        <el-button @click="showAddon = false">取消</el-button>
        <el-button type="primary" @click="doAddon">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const loading = ref(false)
const order = ref(null)
const showReject = ref(false)
const rejectReason = ref('')
const showEvidence = ref(false)
const evidenceUrls = ref('')
const evidenceKind = ref('before')
const showAddon = ref(false)
const addonRemark = ref('')

const addrText = computed(() => {
  const s = order.value && order.value.address_snapshot
  if (!s) return '—'
  if (typeof s === 'string') return s
  return [s.contact, s.phone, s.detail || s.address].filter(Boolean).join(' ')
})

async function load() {
  loading.value = true
  try {
    const { data } = await request.get('/worker/service-orders/' + route.params.id)
    if (data.errno !== 0) {
      ElMessage.error(data.errmsg || '加载失败')
      return
    }
    order.value = data.data
  } finally {
    loading.value = false
  }
}

async function post(path, body) {
  const { data } = await request.post(path, body || {})
  if (data.errno !== 0) {
    ElMessage.error(data.errmsg || '操作失败')
    return false
  }
  ElMessage.success('成功')
  return true
}

const base = () => '/worker/service-orders/' + route.params.id

async function doAccept() {
  if (await post(base() + '/accept')) load()
}

async function doReject() {
  if (await post(base() + '/reject', { reason: rejectReason.value })) {
    showReject.value = false
    load()
  }
}

function doCheckIn() {
  if (!navigator.geolocation) {
    ElMessage.warning('浏览器不支持定位')
    return
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const ok = await post(base() + '/check-in', {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      })
      if (ok) load()
    },
    () => ElMessage.error('定位失败，请允许浏览器位置权限')
  )
}

async function doEvidence() {
  const urls = evidenceUrls.value.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean)
  if (!urls.length) {
    ElMessage.warning('请填写 URL')
    return
  }
  if (await post(base() + '/evidence', { kind: evidenceKind.value, urls })) {
    showEvidence.value = false
    load()
  }
}

async function doAddon() {
  if (await post(base() + '/addon-request', { remark: addonRemark.value })) {
    showAddon.value = false
    load()
  }
}

async function doComplete() {
  if (await post(base() + '/complete')) load()
}

onMounted(load)
</script>

<style scoped>
.mt { margin-top: 16px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
