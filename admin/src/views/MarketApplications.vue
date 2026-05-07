<template>
  <div class="page-wrap">
    <el-radio-group v-model="status" class="toolbar" @change="load">
      <el-radio-button label="">全部</el-radio-button>
      <el-radio-button label="pending">待审核</el-radio-button>
      <el-radio-button label="approved">已通过</el-radio-button>
      <el-radio-button label="rejected">已驳回</el-radio-button>
    </el-radio-group>
    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="shop_name" label="店铺名" min-width="120" />
      <el-table-column prop="contact_name" label="联系人" width="100" />
      <el-table-column prop="phone" label="电话" width="120" />
      <el-table-column prop="category" label="类目" width="100" />
      <el-table-column prop="entity_name" label="主体名称" min-width="160" />
      <el-table-column prop="credit_code" label="统一社会信用代码" min-width="170" />
      <el-table-column prop="status" label="状态" width="90" />
      <el-table-column prop="created_at" label="申请时间" width="170" />
      <el-table-column label="操作" width="210" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openDetail(row)">详情</el-button>
          <template v-if="row.status === 'pending'">
            <el-button type="success" link @click="setStatus(row, 'approved')">通过</el-button>
            <el-button type="danger" link @click="setStatus(row, 'rejected')">驳回</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="pager"
      v-model:current-page="page"
      v-model:page-size="limit"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="load"
    />

    <el-dialog v-model="detailVisible" title="入驻申请详情" width="920px" destroy-on-close>
      <template v-if="current">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请ID">{{ current.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ current.status || '-' }}</el-descriptions-item>
          <el-descriptions-item label="店铺名">{{ current.shop_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="类目">{{ current.category || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ current.contact_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ current.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="主体名称">{{ current.entity_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="法人/经营者">{{ current.legal_person || '-' }}</el-descriptions-item>
          <el-descriptions-item label="统一社会信用代码" :span="2">
            {{ current.credit_code || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="推广员ID">{{ current.promoter_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="推广员姓名">{{ current.promoter_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="小区ID">{{ current.community_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ current.created_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="详细地址" :span="2">{{ current.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="商家简介" :span="2">{{ current.description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="images-wrap">
          <div class="img-block">
            <div class="img-title">店铺 Logo</div>
            <img v-if="current.logo_url" class="img" :src="toAbsoluteUrl(current.logo_url)" alt="logo" />
            <div v-else class="img-empty">未上传</div>
          </div>
          <div class="img-block">
            <div class="img-title">商家背景图</div>
            <img v-if="current.background_url" class="img" :src="toAbsoluteUrl(current.background_url)" alt="background" />
            <div v-else class="img-empty">未上传</div>
          </div>
          <div class="img-block">
            <div class="img-title">执照图/资质图</div>
            <img v-if="current.license_url" class="img" :src="toAbsoluteUrl(current.license_url)" alt="license" />
            <div v-else class="img-empty">未上传</div>
          </div>
        </div>

        <div class="place-photos">
          <div class="img-title">执照照片/入驻实地照</div>
          <div v-if="placePhotos.length" class="gallery">
            <img
              v-for="(u, idx) in placePhotos"
              :key="`${u}-${idx}`"
              class="thumb"
              :src="toAbsoluteUrl(u)"
              alt="place-photo"
            />
          </div>
          <div v-else class="img-empty">未上传</div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const status = ref('pending')
const detailVisible = ref(false)
const current = ref(null)

function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const s = url.trim()
  if (!s) return ''
  return s.replace(/^https?:\/\/[^/]+/i, '')
}

const placePhotos = computed(() => {
  const value = current.value?.place_photo_url
  if (!value) return []
  const reserved = new Set([
    normalizeUrl(current.value?.logo_url),
    normalizeUrl(current.value?.background_url),
    normalizeUrl(current.value?.license_url)
  ].filter(Boolean))

  const filterDup = (arr) => {
    const seen = new Set()
    return arr
      .filter((u) => typeof u === 'string' && u.trim())
      .filter((u) => {
        const key = normalizeUrl(u)
        if (!key || reserved.has(key) || seen.has(key)) return false
        seen.add(key)
        return true
      })
  }

  if (Array.isArray(value)) return filterDup(value)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? filterDup(parsed) : []
    } catch (_) {
      return filterDup([value])
    }
  }
  return []
})

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    if (status.value) params.status = status.value
    const res = await request.get('/admin/market-applications', { params })
    rows.value = res.data || []
    total.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function setStatus(row, st) {
  ElMessageBox.confirm(`确定将入驻申请 #${row.id} 标记为 ${st}？`, '确认', { type: 'warning' })
    .then(async () => {
      await request.put(`/admin/market-applications/${row.id}`, { status: st })
      ElMessage.success('已更新')
      await load()
    })
    .catch(() => {})
}

function openDetail(row) {
  current.value = row
  detailVisible.value = true
}

function toAbsoluteUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`
}

onMounted(load)
</script>

<style scoped>
.page-wrap {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}
.toolbar {
  margin-bottom: 12px;
}
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
.images-wrap {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.img-block {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px;
}
.img-title {
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}
.img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}
.img-empty {
  color: #909399;
  font-size: 13px;
}
.place-photos {
  margin-top: 14px;
  border-top: 1px solid #f2f3f5;
  padding-top: 14px;
}
.gallery {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.thumb {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}
</style>
