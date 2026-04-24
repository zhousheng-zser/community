<template>
  <div class="page-wrap">
    <div class="toolbar">
      <el-input v-model="filterCommunityId" placeholder="小区 ID 筛选" clearable style="width: 140px" />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button :icon="Plus" @click="openCreate">新增精选</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="community_id" label="小区" width="88" />
      <el-table-column prop="market_good_id" label="集市商品ID" width="120" />
      <el-table-column prop="sort_order" label="排序" width="80" />
      <el-table-column label="商品名" min-width="160">
        <template #default="{ row }">{{ row.goods?.name || '—' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="onDel(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="dlg" :title="editId ? '编辑' : '新增'" width="480px" @closed="reset">
      <el-form :model="form" label-width="120px">
        <el-form-item label="小区 community_id" required>
          <el-input v-model.number="form.community_id" type="number" />
        </el-form-item>
        <el-form-item label="集市商品 ID" required>
          <el-input v-model.number="form.market_good_id" type="number" :disabled="!!editId" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlg = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const filterCommunityId = ref('')
const dlg = ref(false)
const editId = ref(null)
const form = reactive({ community_id: null, market_good_id: null, sort_order: 0, status: 1 })

async function load() {
  loading.value = true
  try {
    const params = {}
    if (filterCommunityId.value) params.community_id = filterCommunityId.value
    const res = await request.get('/admin/community-featured-goods', { params })
    rows.value = res.data?.list || []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function reset() {
  editId.value = null
  form.community_id = null
  form.market_good_id = null
  form.sort_order = 0
  form.status = 1
}

function openCreate() {
  reset()
  dlg.value = true
}

function openEdit(row) {
  editId.value = row.id
  form.community_id = row.community_id
  form.market_good_id = row.market_good_id
  form.sort_order = row.sort_order
  form.status = row.status
  dlg.value = true
}

async function save() {
  if (!form.community_id || !form.market_good_id) {
    ElMessage.warning('请填写小区与商品 ID')
    return
  }
  saving.value = true
  try {
    if (editId.value) {
      await request.put(`/admin/community-featured-goods/${editId.value}`, {
        sort_order: form.sort_order,
        status: form.status
      })
    } else {
      await request.post('/admin/community-featured-goods', { ...form })
    }
    ElMessage.success('已保存')
    dlg.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '失败')
  } finally {
    saving.value = false
  }
}

function onDel(row) {
  ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' })
    .then(async () => {
      await request.delete(`/admin/community-featured-goods/${row.id}`)
      ElMessage.success('已删除')
      await load()
    })
    .catch(() => {})
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
