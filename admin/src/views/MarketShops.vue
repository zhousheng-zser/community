<template>
  <div class="page-wrap">
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="店名/编号" clearable style="width: 200px" @keyup.enter="search" />
      <el-button type="primary" @click="search">搜索</el-button>
      <el-button type="success" @click="openCreate">新建店铺</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="shop_no" label="编号" width="140" show-overflow-tooltip />
      <el-table-column prop="name" label="店名" min-width="140" />
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column label="营业" width="80">
        <template #default="{ row }">{{ row.is_open ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="上线" width="80">
        <template #default="{ row }">{{ row.is_active ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="72" />
      <el-table-column label="操作" width="120" fixed="right">
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

    <el-dialog v-model="visible" :title="isEdit ? '编辑店铺' : '新建店铺'" width="560px" destroy-on-close @closed="resetForm">
      <el-form :model="form" label-width="100px">
        <el-form-item label="店名" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-input v-model="form.category" placeholder="如 fresh" />
        </el-form-item>
        <el-form-item label="LOGO">
          <el-input v-model="form.logo_url" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="封面">
          <el-input v-model="form.cover_url" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="起送价">
          <el-input-number v-model="form.min_order_amount" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="配送费">
          <el-input-number v-model="form.delivery_fee" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact_name" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.contact_phone" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="公告">
          <el-input v-model="form.notice" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="营业中">
          <el-switch v-model="form.is_open" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="上线">
          <el-switch v-model="form.is_active" :active-value="1" :inactive-value="0" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const keyword = ref('')
const visible = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const form = reactive({
  name: '',
  category: '',
  logo_url: '',
  cover_url: '',
  min_order_amount: 0,
  delivery_fee: 0,
  contact_name: '',
  contact_phone: '',
  address: '',
  notice: '',
  is_open: 1,
  is_active: 1,
  sort_order: 0
})

function resetForm() {
  form.name = ''
  form.category = ''
  form.logo_url = ''
  form.cover_url = ''
  form.min_order_amount = 0
  form.delivery_fee = 0
  form.contact_name = ''
  form.contact_phone = ''
  form.address = ''
  form.notice = ''
  form.is_open = 1
  form.is_active = 1
  form.sort_order = 0
  editId.value = null
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    if (keyword.value) params.keyword = keyword.value
    const res = await request.get('/admin/market-shops', { params })
    rows.value = res.data || []
    total.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function openCreate() {
  isEdit.value = false
  resetForm()
  visible.value = true
}

function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  form.name = row.name
  form.category = row.category
  form.logo_url = row.logo_url || ''
  form.cover_url = row.cover_url || ''
  form.min_order_amount = Number(row.min_order_amount) || 0
  form.delivery_fee = Number(row.delivery_fee) || 0
  form.contact_name = row.contact_name || ''
  form.contact_phone = row.contact_phone || ''
  form.address = row.address || ''
  form.notice = row.notice || ''
  form.is_open = row.is_open ? 1 : 0
  form.is_active = row.is_active ? 1 : 0
  form.sort_order = row.sort_order ?? 0
  visible.value = true
}

async function submit() {
  if (!form.name || !form.category) {
    ElMessage.warning('请填写店名与分类')
    return
  }
  saving.value = true
  try {
    const body = { ...form }
    if (isEdit.value && editId.value) {
      await request.put(`/admin/market-shops/${editId.value}`, body)
      ElMessage.success('已保存')
    } else {
      await request.post('/admin/market-shops', body)
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

onMounted(load)
</script>

<style scoped>
.page-wrap {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  align-items: center;
}
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
