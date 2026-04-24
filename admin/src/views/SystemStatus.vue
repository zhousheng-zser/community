<template>
  <div class="page">
    <p v-if="err" class="err">{{ err }}</p>
    <el-descriptions v-loading="loading" :column="1" border title="运行环境（只读）">
      <el-descriptions-item label="Node">{{ info.node_version || '—' }}</el-descriptions-item>
      <el-descriptions-item label="运行时长">{{ uptimeText }}</el-descriptions-item>
      <el-descriptions-item label="堆内存 (MB)">{{ info.heap_used_mb ?? '—' }}</el-descriptions-item>
      <el-descriptions-item label="RSS (MB)">{{ info.rss_mb ?? '—' }}</el-descriptions-item>
      <el-descriptions-item label="平台">{{ info.platform || '—' }}</el-descriptions-item>
      <el-descriptions-item label="NODE_ENV">{{ info.env || '—' }}</el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../utils/request'

const loading = ref(true)
const err = ref('')
const info = ref({})

const uptimeText = computed(() => {
  const s = info.value.uptime_seconds
  if (s == null || Number.isNaN(Number(s))) return '—'
  const n = Number(s)
  const h = Math.floor(n / 3600)
  const m = Math.floor((n % 3600) / 60)
  const sec = n % 60
  if (h > 0) return `${h} 小时 ${m} 分`
  if (m > 0) return `${m} 分 ${sec} 秒`
  return `${sec} 秒`
})

async function load() {
  loading.value = true
  err.value = ''
  try {
    const res = await request.get('/admin/system/health')
    info.value = res.data || {}
  } catch (e) {
    err.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  max-width: 560px;
}
.err {
  color: #f5222d;
  margin-bottom: 12px;
}
</style>
