<template>
  <div class="page-wrap">
    <el-card shadow="never">
      <template #header>
        <div class="card-hd">
          <span>商品管理</span>
          <div class="toolbar">
            <el-radio-group v-model="shelfFilter" size="small" @change="onShelfFilter">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="on">已上架</el-radio-button>
              <el-radio-button label="off">已下架</el-radio-button>
            </el-radio-group>
            <el-button type="primary" @click="openCreate">+ 新增商品</el-button>
          </div>
        </div>
      </template>

      <el-alert type="info" show-icon :closable="false" class="tip-alert"
        title="「已上架」与小程序列表一致：状态为在售且已发布；修改后立即写入数据库。" />

      <el-table :data="list" border stripe v-loading="loading" style="width:100%" class="goods-table">
        <el-table-column prop="id" label="ID" width="65" />
        <el-table-column label="图片" width="75">
          <template #default="s">
            <el-image v-if="s.row.main_image" :src="imgUrl(s.row.main_image)"
              style="width:52px;height:52px;border-radius:6px" fit="cover" />
            <span v-else class="empty">无图</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="150" />
        <el-table-column label="价格" width="110">
          <template #default="s">
            <span>¥{{ s.row.price }}</span>
            <span v-if="s.row.original_price" class="original-price">¥{{ s.row.original_price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="sales_count" label="销量" width="70" />
        <el-table-column label="上架状态" width="120">
          <template #default="s">
            <el-tag v-if="isListed(s.row)" type="success" size="small">小程序可见</el-tag>
            <template v-else>
              <el-tag type="info" size="small">未上架</el-tag>
              <div v-if="s.row.status === 'on_sale' && Number(s.row.is_published) !== 1" class="sub-hint">仅未发布</div>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="s">
            <el-button size="small" type="primary" @click="openEdit(s.row)">编辑</el-button>
            <el-button size="small" :type="isListed(s.row) ? 'warning' : 'success'" @click="toggleShelf(s.row)">
              {{ isListed(s.row) ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" @click="openRestock(s.row)">补货</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" layout="prev, pager, next, total" style="margin-top:14px"
        @current-change="load" @size-change="load" />
    </el-card>

    <!-- 新增/编辑商品 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑商品' : '新增商品'" width="540px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="商品名称" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="售价(元)" required><el-input v-model="form.price" type="number" /></el-form-item>
        <el-form-item label="原价(元)"><el-input v-model="form.original_price" type="number" /></el-form-item>
        <el-form-item label="库存" required><el-input v-model="form.stock" type="number" /></el-form-item>
        <el-form-item label="安全库存"><el-input v-model="form.safe_stock" type="number" placeholder="库存低于此值时预警" /></el-form-item>
        <el-form-item label="主图URL"><el-input v-model="form.main_image" placeholder="https://..." /></el-form-item>
        <el-form-item label="商品描述">
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

    <!-- 补货 -->
    <el-dialog v-model="restockVisible" title="补货" width="380px">
      <el-form label-width="100px">
        <el-form-item label="补货数量">
          <el-input-number v-model="restockQty" :min="1" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="restockVisible = false">取消</el-button>
        <el-button type="primary" @click="doRestock">确认补货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request.js'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const shelfFilter = ref('all')
const dialogVisible = ref(false)
const editing = ref(null)
const form = ref({})
const restockVisible = ref(false)
const restockTarget = ref(null)
const restockQty = ref(1)

function imgUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return (import.meta.env.VITE_API_BASE || '/api/v1').replace(/\/api\/v1$/, '') + url
}

/** 与集市小程序列表一致：在售 + 已发布 */
function isListed(row) {
  return row.status === 'on_sale' && Number(row.is_published) === 1
}

function onShelfFilter() {
  page.value = 1
  load()
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, limit: pageSize.value }
    if (shelfFilter.value === 'on' || shelfFilter.value === 'off') params.shelf = shelfFilter.value
    const res = await request.get('/merchant/goods', { params })
    const d = res.data || {}
    list.value = d.list ?? d.data ?? []
    total.value = d.total || 0
  } catch (e) { ElMessage.error(e.message) }
  finally { loading.value = false }
}

function openCreate() {
  editing.value = null
  form.value = { name: '', price: '', original_price: '', stock: '', safe_stock: 5, main_image: '', description: '', is_published: 1 }
  dialogVisible.value = true
}
function openEdit(row) {
  editing.value = row
  form.value = { ...row }
  dialogVisible.value = true
}

async function save() {
  if (!form.value.name) return ElMessage.warning('请填写商品名称')
  if (!form.value.price) return ElMessage.warning('请填写售价')
  try {
    if (editing.value) {
      await request.patch(`/merchant/goods/${editing.value.id}`, form.value)
      ElMessage.success('已更新')
    } else {
      await request.post('/merchant/goods', form.value)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    load()
  } catch (e) { ElMessage.error(e.message) }
}

async function toggleShelf(row) {
  try {
    const toOn = !isListed(row)
    await request.post(`/merchant/goods/${row.id}/shelf`, { status: toOn ? 'on_sale' : 'off_sale' })
    ElMessage.success(toOn ? '已上架（小程序可见）' : '已下架')
    load()
  } catch (e) { ElMessage.error(e.message) }
}

function openRestock(row) {
  restockTarget.value = row
  restockQty.value = 1
  restockVisible.value = true
}
async function doRestock() {
  try {
    await request.post(`/merchant/goods/${restockTarget.value.id}/restock`, { qty: restockQty.value })
    ElMessage.success(`已补货 ${restockQty.value} 件`)
    restockVisible.value = false
    load()
  } catch (e) { ElMessage.error(e.message) }
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
.original-price { font-size: 11px; color: #a0aec0; text-decoration: line-through; margin-left: 4px; }
</style>
