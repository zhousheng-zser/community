<template>
  <div class="home-display-container">
    <div class="header-box">
      <h3>首页展示管理</h3>
      <el-alert title="管理小程序首页展示的技工、服务项目和服务商，支持排序和启停控制。" type="info" show-icon />
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="首页技工" name="worker">
        <div class="toolbar">
          <el-button type="primary" @click="openAddDialog('worker')">+ 添加技工到首页</el-button>
          <el-button @click="fetchItems">刷新</el-button>
        </div>
        <el-table :data="workerItems" border stripe v-loading="loading" style="width:100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="target_id" label="技工ID" width="90" />
          <el-table-column prop="title" label="展示标题" min-width="180" show-overflow-tooltip />
          <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip />
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '启用' : '禁用' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" :type="row.status ? 'warning' : 'success'" @click="toggleStatus(row)">{{ row.status ? '禁用' : '启用' }}</el-button>
              <el-button size="small" type="danger" plain @click="removeItem(row)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="首页服务" name="service">
        <div class="toolbar">
          <el-button type="primary" @click="openAddDialog('service')">+ 添加服务到首页</el-button>
          <el-button @click="fetchItems">刷新</el-button>
        </div>
        <el-table :data="serviceItems" border stripe v-loading="loading" style="width:100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="target_id" label="服务ID" width="90" />
          <el-table-column prop="title" label="展示标题" min-width="180" show-overflow-tooltip />
          <el-table-column prop="cover" label="封面" width="90">
            <template #default="{ row }">
              <el-image v-if="row.cover" :src="imgUrl(row.cover)" style="width:55px;height:55px;border-radius:4px" fit="cover" />
              <span v-else style="color:#ccc;font-size:12px">无图</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip />
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '启用' : '禁用' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" :type="row.status ? 'warning' : 'success'" @click="toggleStatus(row)">{{ row.status ? '禁用' : '启用' }}</el-button>
              <el-button size="small" type="danger" plain @click="removeItem(row)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="首页服务商" name="service_provider">
        <div class="toolbar">
          <el-button type="primary" @click="openAddDialog('service_provider')">+ 添加服务商到首页</el-button>
          <el-button @click="fetchItems">刷新</el-button>
        </div>
        <el-table :data="providerItems" border stripe v-loading="loading" style="width:100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="target_id" label="服务商ID" width="100" />
          <el-table-column prop="title" label="展示标题" min-width="180" show-overflow-tooltip />
          <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip />
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '启用' : '禁用' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" :type="row.status ? 'warning' : 'success'" @click="toggleStatus(row)">{{ row.status ? '禁用' : '启用' }}</el-button>
              <el-button size="small" type="danger" plain @click="removeItem(row)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加弹窗 -->
    <el-dialog v-model="addDialogVisible" :title="addDialogTitle" width="600px">
      <div class="search-bar">
        <el-input v-model="searchKeyword" placeholder="搜索名称/手机号…" clearable style="width:300px" @keyup.enter="doSearch" />
        <el-button type="primary" @click="doSearch">搜索</el-button>
      </div>
      <el-table :data="searchResults" border stripe style="margin-top:12px" max-height="360">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column :label="searchNameCol" min-width="200">
          <template #default="{ row }">{{ formatSearchName(row) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="confirmAdd(row)">添加</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑首页项" width="480px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="展示标题">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="封面图">
          <el-input v-model="editForm.cover" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="editForm.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="editForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request.js'

const activeTab = ref('worker')
const loading = ref(false)
const allItems = ref([])

const workerItems = computed(() => allItems.value.filter(i => i.kind === 'worker'))
const serviceItems = computed(() => allItems.value.filter(i => i.kind === 'service'))
const providerItems = computed(() => allItems.value.filter(i => i.kind === 'service_provider'))

function imgUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const base = import.meta.env.VITE_API_BASE || '/api/v1'
  return base.replace(/\/api\/v1$/, '') + url
}

async function fetchItems() {
  loading.value = true
  try {
    const res = await request.get('/admin/home-display/items', { params: { pageSize: 200 } })
    const d = res.data || res
    allItems.value = d.rows || []
  } catch (e) { ElMessage.error(e.message || '加载失败') }
  finally { loading.value = false }
}

// ---- 添加 ----
const addDialogVisible = ref(false)
const addKind = ref('worker')
const searchKeyword = ref('')
const searchResults = ref([])

const addDialogTitle = computed(() => {
  const m = { worker: '添加技工到首页', service: '添加服务到首页', service_provider: '添加服务商到首页' }
  return m[addKind.value] || '添加'
})
const searchNameCol = computed(() => {
  const m = { worker: '姓名/行业/手机', service: '服务名称/价格', service_provider: '店铺/联系人' }
  return m[addKind.value] || '名称'
})

function formatSearchName(row) {
  if (addKind.value === 'worker') return `${row.real_name || ''} | ${row.industry || ''} | ${row.phone || ''}`
  if (addKind.value === 'service') return `${row.title || ''} | ¥${row.price || 0}`
  return `${row.shop_name || ''} | ${row.contact_name || ''} | ${row.phone || ''}`
}

function openAddDialog(kind) {
  addKind.value = kind
  searchKeyword.value = ''
  searchResults.value = []
  addDialogVisible.value = true
  doSearch()
}

async function doSearch() {
  const endpointMap = {
    worker: '/admin/home-display/search/workers',
    service: '/admin/home-display/search/services',
    service_provider: '/admin/home-display/search/service-providers'
  }
  try {
    const res = await request.get(endpointMap[addKind.value], { params: { keyword: searchKeyword.value || undefined } })
    searchResults.value = (res.data || res) || []
  } catch (e) { ElMessage.error(e.message || '搜索失败') }
}

async function confirmAdd(row) {
  let title = '', cover = ''
  if (addKind.value === 'worker') { title = `${row.real_name} - ${row.industry || ''}` }
  else if (addKind.value === 'service') { title = row.title; cover = row.cover_image || '' }
  else { title = row.shop_name }

  try {
    await request.post('/admin/home-display/items', {
      kind: addKind.value,
      target_id: row.id,
      title,
      cover,
      sort: 0,
      status: 1
    })
    ElMessage.success('添加成功')
    addDialogVisible.value = false
    fetchItems()
  } catch (e) { ElMessage.error(e.message || '添加失败') }
}

// ---- 编辑 ----
const editDialogVisible = ref(false)
const editForm = ref({})
const editingId = ref(null)

function openEdit(row) {
  editingId.value = row.id
  editForm.value = { title: row.title, cover: row.cover, description: row.description, sort: row.sort, status: row.status }
  editDialogVisible.value = true
}

async function saveEdit() {
  try {
    await request.put(`/admin/home-display/items/${editingId.value}`, editForm.value)
    ElMessage.success('已更新')
    editDialogVisible.value = false
    fetchItems()
  } catch (e) { ElMessage.error(e.message || '更新失败') }
}

// ---- 删除 ----
async function removeItem(row) {
  try {
    await ElMessageBox.confirm(`确认从首页移除【${row.title}】？`, '确认', { type: 'warning' })
    await request.delete(`/admin/home-display/items/${row.id}`)
    ElMessage.success('已移除')
    fetchItems()
  } catch {}
}

// ---- 切换状态 ----
async function toggleStatus(row) {
  const newStatus = row.status ? 0 : 1
  try {
    await request.put(`/admin/home-display/items/${row.id}`, { status: newStatus })
    ElMessage.success(newStatus ? '已启用' : '已禁用')
    fetchItems()
  } catch (e) { ElMessage.error(e.message || '操作失败') }
}

onMounted(() => { fetchItems() })
</script>

<style scoped>
.home-display-container {
  background: white;
  padding: 20px 30px;
  border-radius: 8px;
  min-height: calc(100vh - 120px);
}
.header-box { margin-bottom: 20px; }
.header-box h3 { margin-top: 0; color: #303133; }
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.search-bar {
  display: flex;
  gap: 10px;
}
</style>
