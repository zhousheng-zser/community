<template>
  <div class="page-wrap">
    <el-form :inline="true" class="filter">
      <el-form-item label="店铺 ID">
        <el-input v-model="shopId" placeholder="必填" style="width: 120px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :disabled="!shopId" @click="load">加载商品</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="success" :disabled="!shopId" @click="openCreate">新建商品</el-button>
      </el-form-item>
      <el-form-item label="低库存阈值">
        <el-input-number v-model="lowStockThreshold" :min="1" :max="9999" />
      </el-form-item>
      <el-form-item>
        <el-button :disabled="!shopId" @click="loadLowStock">低库存预警</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="warning" :disabled="multipleSelection.length===0" @click="batchSetStatus('off_sale')">批量下架</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :disabled="multipleSelection.length===0" @click="batchSetStatus('on_sale')">批量上架</el-button>
      </el-form-item>
    </el-form>
    <el-alert
      v-if="!shopId"
      title="请先输入店铺 ID（可在「本地集市·店铺」列表查看）"
      type="info"
      show-icon
      :closable="false"
      class="mb"
    />
    <el-table v-loading="loading" :data="rows" border stripe @selection-change="onSelectionChange">
      <el-table-column type="selection" width="48" />
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="goods_no" label="货号" width="160" show-overflow-tooltip />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column prop="category_key" label="店内分类" width="110" />
      <el-table-column prop="price" label="价" width="80" />
      <el-table-column prop="stock" label="库存" width="72" />
      <el-table-column prop="status" label="状态" width="90" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
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

    <el-dialog v-model="visible" :title="isEdit ? '编辑商品' : '新建商品'" width="520px" destroy-on-close @closed="resetForm">
      <el-form :model="form" label-width="100px">
        <el-form-item v-if="!isEdit" label="店铺 ID">
          <el-input v-model="form.shop_id" disabled />
        </el-form-item>
        <el-form-item label="分类 key" required>
          <el-input v-model="form.category_key" placeholder="如 hot" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="价格" required>
          <el-input-number v-model="form.price" :min="0" :step="0.01" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="主图 URL">
          <el-input v-model="form.main_image" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 160px">
            <el-option label="在售" value="on_sale" />
            <el-option label="下架" value="off_sale" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const shopId = ref('')
const visible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const multipleSelection = ref([])
const lowStockThreshold = ref(10)

const form = reactive({
  shop_id: '',
  category_key: '',
  name: '',
  price: 0,
  stock: 0,
  main_image: '',
  status: 'on_sale',
  sort_order: 0
})

function resetForm() {
  form.shop_id = shopId.value
  form.category_key = ''
  form.name = ''
  form.price = 0
  form.stock = 0
  form.main_image = ''
  form.status = 'on_sale'
  form.sort_order = 0
  editId.value = null
}

async function load() {
  if (!shopId.value) return
  loading.value = true
  try {
    const res = await request.get('/admin/market-goods', {
      params: { shop_id: shopId.value, page: page.value, limit: limit.value }
    })
    rows.value = res.data || []
    total.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function onSelectionChange(arr) {
  multipleSelection.value = Array.isArray(arr) ? arr : []
}

function openCreate() {
  if (!shopId.value) return
  isEdit.value = false
  resetForm()
  form.shop_id = shopId.value
  visible.value = true
}

function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  form.category_key = row.category_key
  form.name = row.name
  form.price = Number(row.price)
  form.stock = row.stock
  form.main_image = row.main_image || ''
  form.status = row.status
  form.sort_order = row.sort_order ?? 0
  visible.value = true
}

async function submit() {
  if (!form.category_key || !form.name) {
    ElMessage.warning('请填写分类与名称')
    return
  }
  saving.value = true
  try {
    if (isEdit.value && editId.value) {
      await request.put(`/admin/market-goods/${editId.value}`, {
        category_key: form.category_key,
        name: form.name,
        price: form.price,
        stock: form.stock,
        main_image: form.main_image,
        status: form.status,
        sort_order: form.sort_order
      })
      ElMessage.success('已保存')
    } else {
      await request.post('/admin/market-goods', {
        shop_id: Number(shopId.value),
        category_key: form.category_key,
        name: form.name,
        price: form.price,
        stock: form.stock,
        main_image: form.main_image,
        status: form.status,
        sort_order: form.sort_order
      })
      ElMessage.success('已创建')
    }
    visible.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function batchSetStatus(status) {
  try {
    const ids = multipleSelection.value.map(i => i.id)
    await request.post('/admin/market-goods/batch-update', { ids, changes: { status } })
    ElMessage.success('批量更新成功')
    await load()
  } catch (e) {
    ElMessage.error(e.message || '批量更新失败')
  }
}

async function loadLowStock() {
  try {
    const res = await request.get('/admin/market-goods/low-stock', { params: { threshold: lowStockThreshold.value } })
    const all = res.data || []
    rows.value = all.filter(i => String(i.shop_id) === String(shopId.value))
    total.value = rows.value.length
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}
</script>

<style scoped>
.page-wrap {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}
.filter {
  margin-bottom: 8px;
}
.mb {
  margin-bottom: 12px;
}
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
