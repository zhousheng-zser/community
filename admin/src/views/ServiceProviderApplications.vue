<template>
  <div class="page-wrap">
    <el-radio-group v-model="status" class="toolbar" @change="load">
      <el-radio-button label="">全部</el-radio-button>
      <el-radio-button label="pending">待审核</el-radio-button>
      <el-radio-button label="approved">已通过</el-radio-button>
      <el-radio-button label="rejected">已驳回</el-radio-button>
    </el-radio-group>
    <el-table :data="rows" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="shop_name" label="店名" min-width="140" />
      <el-table-column prop="contact_name" label="联系人" width="100" />
      <el-table-column prop="phone" label="电话" width="120" />
      <el-table-column label="申请人" min-width="120">
        <template #default="{ row }">
          {{ row.user?.nickname || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" />
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

    <el-dialog v-model="detailVisible" title="服务商入驻详情" width="960px" destroy-on-close>
      <template v-if="current">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请ID">{{ current.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ current.status || '-' }}</el-descriptions-item>
          <el-descriptions-item label="店名">{{ current.shop_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ current.contact_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ current.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请人ID">{{ current.user_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请人昵称">{{ current.user?.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ current.created_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ current.note || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="images-wrap">
          <div class="img-block">
            <div class="img-title">店铺门头</div>
            <img v-if="current.shop_front_url" class="img" :src="toAbsoluteUrl(current.shop_front_url)" alt="shop-front" />
            <div v-else class="img-empty">未上传</div>
          </div>
          <div class="img-block">
            <div class="img-title">环境照片</div>
            <img v-if="current.environment_url" class="img" :src="toAbsoluteUrl(current.environment_url)" alt="environment" />
            <div v-else class="img-empty">未上传</div>
          </div>
          <div class="img-block">
            <div class="img-title">营业执照</div>
            <img v-if="current.license_url" class="img" :src="toAbsoluteUrl(current.license_url)" alt="license" />
            <div v-else class="img-empty">未上传</div>
          </div>
          <div class="img-block">
            <div class="img-title">身份证照片</div>
            <img v-if="current.id_card_url" class="img" :src="toAbsoluteUrl(current.id_card_url)" alt="id-card" />
            <div v-else class="img-empty">未上传</div>
          </div>
          <div class="img-block">
            <div class="img-title">资质证明</div>
            <img v-if="current.certificate_url" class="img" :src="toAbsoluteUrl(current.certificate_url)" alt="certificate" />
            <div v-else class="img-empty">未上传</div>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    if (status.value) params.status = status.value
    const res = await request.get('/admin/service-provider-applications', { params })
    rows.value = res.data || []
    total.value = res.total || 0
  } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false }
}

function setStatus(row, st) {
  ElMessageBox.confirm(`确定将服务商入驻申请 #${row.id} 标记为 ${st}？`, '确认', { type: 'warning' })
    .then(async () => {
      await request.put(`/admin/service-provider-applications/${row.id}`, { status: st })
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
.page-wrap { background: #fff; padding: 16px; border-radius: 8px; }
.toolbar { margin-bottom: 12px; }
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
</style>
