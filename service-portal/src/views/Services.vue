<template>
  <div class="page-wrap">
    <el-card shadow="never">
      <template #header>
        <div class="card-hd">
          <span>服务项目管理</span>
          <div class="toolbar">
            <el-radio-group v-model="shelfFilter" size="small" @change="onShelfFilter">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="on">已上架</el-radio-button>
              <el-radio-button label="off">已下架</el-radio-button>
            </el-radio-group>
            <el-button type="primary" @click="openCreate">+ 新增服务</el-button>
          </div>
        </div>
      </template>

      <el-alert type="info" show-icon :closable="false" class="tip-alert"
        title="「已上架」与小程序可售态一致：在售且已发布；上下架会同步写入数据库。" />

      <el-table :data="list" border stripe v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="65" />
        <el-table-column label="封面" width="75">
          <template #default="s">
            <el-image v-if="s.row.cover_image" :src="imgUrl(s.row.cover_image)"
              style="width:52px;height:52px;border-radius:6px" fit="cover" />
            <span v-else class="empty">无图</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="服务名称" min-width="140" />
        <el-table-column prop="sub_title" label="副标题" min-width="120" show-overflow-tooltip />
        <el-table-column label="价格" width="100">
          <template #default="s">¥{{ s.row.price }} / {{ s.row.unit || '次' }}</template>
        </el-table-column>
        <el-table-column prop="category_key" label="分类" width="100" />
        <el-table-column label="上架状态" width="120">
          <template #default="s">
            <el-tag v-if="isListed(s.row)" type="success" size="small">小程序可见</el-tag>
            <template v-else>
              <el-tag type="info" size="small">未上架</el-tag>
              <div v-if="s.row.status === 'on_sale' && Number(s.row.is_published) !== 1" class="sub-hint">仅未发布</div>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="s">
            <el-button size="small" type="primary" @click="openEdit(s.row)">编辑</el-button>
            <el-button size="small" :type="isListed(s.row) ? 'warning' : 'success'" @click="toggleShelf(s.row)">
              {{ isListed(s.row) ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" type="danger" plain @click="del(s.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑服务' : '新增服务'" width="520px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="服务名称" required><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="副标题"><el-input v-model="form.sub_title" /></el-form-item>
        <el-form-item label="价格(元)" required><el-input v-model="form.price" type="number" /></el-form-item>
        <el-form-item label="计价单位"><el-input v-model="form.unit" placeholder="次/平米/小时" /></el-form-item>
        <el-form-item label="分类Key"><el-input v-model="form.category_key" placeholder="clean/repair/green…" /></el-form-item>
        <el-form-item label="封面图URL"><el-input v-model="form.cover_image" placeholder="https://..." /></el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="立即上架">
          <el-switch v-model="form.is_published" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request.js'

const loading = ref(false)
const list = ref([])
const shelfFilter = ref('all')
const dialogVisible = ref(false)
const editing = ref(null)
const form = ref({})

function imgUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const base = import.meta.env.VITE_API_BASE || '/api/v1'
  return base.replace(/\/api\/v1$/, '') + url
}

function isListed(row) {
  return row.status === 'on_sale' && Number(row.is_published) === 1
}

function onShelfFilter() {
  load()
}

async function load() {
  loading.value = true
  try {
    const params = {}
    if (shelfFilter.value === 'on' || shelfFilter.value === 'off') params.shelf = shelfFilter.value
    const res = await request.get('/service-provider/services', { params })
    const d = res.data || {}
    list.value = d.list ?? d.data ?? (Array.isArray(d) ? d : [])
  } catch (e) { ElMessage.error(e.message) }
  finally { loading.value = false }
}

function openCreate() {
  editing.value = null
  form.value = { title: '', sub_title: '', price: '', unit: '次', category_key: 'general', cover_image: '', description: '', is_published: 1 }
  dialogVisible.value = true
}
function openEdit(row) {
  editing.value = row
  form.value = { ...row }
  dialogVisible.value = true
}

async function save() {
  if (!form.value.title) return ElMessage.warning('请填写服务名称')
  if (!form.value.price) return ElMessage.warning('请填写价格')
  try {
    if (editing.value) {
      await request.patch(`/service-provider/services/${editing.value.id}`, form.value)
      ElMessage.success('已更新')
    } else {
      await request.post('/service-provider/services', form.value)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    load()
  } catch (e) { ElMessage.error(e.message) }
}

async function toggleShelf(row) {
  try {
    const toOn = !isListed(row)
    await request.post(`/service-provider/services/${row.id}/shelf`, {
      status: toOn ? 'on_sale' : 'off_sale'
    })
    ElMessage.success(toOn ? '已上架（小程序可见）' : '已下架')
    load()
  } catch (e) { ElMessage.error(e.message) }
}

async function del(row) {
  try {
    await ElMessageBox.confirm(`确认下架【${row.title}】？`, '确认', { type: 'warning' })
    await request.post(`/service-provider/services/${row.id}/shelf`, { status: 'off_sale' })
    ElMessage.success('已下架')
    load()
  } catch {}
}

onMounted(load)
</script>

<style scoped>
.page-wrap { padding: 4px; }
.card-hd { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.tip-alert { margin-bottom: 12px; }
.sub-hint { font-size: 11px; color: #909399; margin-top: 2px; }
.empty { color: #ccc; font-size: 12px; }
</style>
