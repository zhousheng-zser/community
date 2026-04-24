<template>
  <div class="page-wrap">
    <div class="toolbar">
      <el-select v-model="scene" style="width: 160px" @change="loadList">
        <el-option label="benefit_card" value="benefit_card" />
      </el-select>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增</el-button>
    </div>
    <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column label="主图" width="88">
        <template #default="{ row }">
          <el-image :src="row.image_url" style="width: 48px; height: 48px" fit="cover" />
        </template>
      </el-table-column>
      <el-table-column prop="link_key" label="link_key" width="120" show-overflow-tooltip />
      <el-table-column prop="title" label="标题" min-width="140" />
      <el-table-column prop="price" label="价" width="72" />
      <el-table-column prop="coupon_price" label="券后" width="72" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      class="mt"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadList"
    />
    <el-dialog v-model="visible" :title="editId ? '编辑拼多多' : '新增拼多多'" width="520px" @closed="reset">
      <el-form :model="form" label-width="100px">
        <el-form-item label="link_key" required>
          <el-input v-model="form.link_key" :disabled="!!editId" />
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="主图 URL" required>
          <el-input v-model="form.image_url" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="推广 URL" required>
          <el-input v-model="form.spread_url" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="小程序路径">
          <el-input v-model="form.mini_path" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">上架</el-radio>
            <el-radio :label="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
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
const scene = ref('benefit_card')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const tableData = ref([])
const visible = ref(false)
const editId = ref(null)
const form = reactive({
  link_key: '',
  title: '',
  image_url: '',
  spread_url: '',
  mini_path: '',
  sort_order: 0,
  status: 1
})

async function loadList() {
  loading.value = true
  try {
    const res = await request.get('/admin/pdd-benefit-goods', {
      params: { page: page.value, pageSize: pageSize.value, scene: scene.value }
    })
    const d = res.data || {}
    tableData.value = d.list || []
    total.value = d.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function reset() {
  editId.value = null
  form.link_key = ''
  form.title = ''
  form.image_url = ''
  form.spread_url = ''
  form.mini_path = ''
  form.sort_order = 0
  form.status = 1
}

function openCreate() {
  reset()
  visible.value = true
}

function openEdit(row) {
  editId.value = row.id
  form.link_key = row.link_key
  form.title = row.title
  form.image_url = row.image_url
  form.spread_url = row.spread_url
  form.mini_path = row.mini_path || ''
  form.sort_order = row.sort_order
  form.status = row.status
  visible.value = true
}

async function save() {
  if (!form.link_key || !form.title || !form.image_url || !form.spread_url) {
    ElMessage.warning('请填写必填项')
    return
  }
  saving.value = true
  try {
    const body = { ...form, scene: scene.value }
    if (editId.value) {
      await request.put(`/admin/pdd-benefit-goods/${editId.value}`, body)
    } else {
      await request.post('/admin/pdd-benefit-goods', body)
    }
    ElMessage.success('已保存')
    visible.value = false
    await loadList()
  } catch (e) {
    ElMessage.error(e.message || '失败')
  } finally {
    saving.value = false
  }
}

function onDelete(row) {
  ElMessageBox.confirm(`删除「${row.title}」？`, '确认', { type: 'warning' })
    .then(async () => {
      await request.delete(`/admin/pdd-benefit-goods/${row.id}`)
      ElMessage.success('已删除')
      await loadList()
    })
    .catch(() => {})
}

onMounted(loadList)
</script>

<style scoped>
.page-wrap {
  padding: 8px 0;
}
.toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}
.mt {
  margin-top: 12px;
}
</style>
