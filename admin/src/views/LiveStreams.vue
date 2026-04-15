<template>
  <div class="page-wrap">
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增场次</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="id" label="ID" width="64" />
      <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" width="110" />
      <el-table-column prop="finder_username" label="视频号 ID" width="140" show-overflow-tooltip />
      <el-table-column prop="sort_order" label="排序" width="72" />
      <el-table-column label="上架" width="80">
        <template #default="{ row }">{{ row.is_active ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="pager"
      v-model:current-page="page"
      v-model:page-size="limit"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      @size-change="load"
      @current-change="load"
    />

    <el-dialog v-model="visible" :title="isEdit ? '编辑直播场次' : '新增直播场次'" width="640px" destroy-on-close @closed="reset">
      <el-form ref="formRef" :model="form" label-width="120px">
        <el-form-item label="分类" required>
          <el-input v-model="form.category" />
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="视频号 finder_username" required>
          <el-input v-model="form.finder_username" />
        </el-form-item>
        <el-form-item label="feed_id">
          <el-input v-model="form.feed_id" />
        </el-form-item>
        <el-form-item label="头像 URL">
          <el-input v-model="form.avatar_url" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="品牌 LOGO">
          <el-input v-model="form.brand_logo" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="封面图">
          <el-input v-model="form.cover_image" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="返利文案">
          <el-input v-model="form.rebate_info" />
        </el-form-item>
        <el-form-item label="推广人数">
          <el-input-number v-model="form.promoters_count" :min="0" />
        </el-form-item>
        <el-form-item label="热卖商品 JSON">
          <el-input v-model="hotGoodsJson" type="textarea" :rows="4" placeholder='例如 [] 或 [{"name":"x"}]' />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" />
        </el-form-item>
        <el-form-item label="上架">
          <el-switch v-model="form.is_active" :active-value="1" :inactive-value="0" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const visible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)
const hotGoodsJson = ref('[]')

const form = reactive({
  category: '热推直播间',
  title: '',
  finder_username: '',
  feed_id: '',
  avatar_url: '',
  brand_logo: '',
  cover_image: '',
  rebate_info: '10%',
  promoters_count: 0,
  sort_order: 0,
  is_active: 1
})

async function load() {
  loading.value = true
  try {
    const res = await request.get('/admin/live-streams', {
      params: { page: page.value, limit: limit.value }
    })
    rows.value = res.data || []
    total.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function reset() {
  form.category = '热推直播间'
  form.title = ''
  form.finder_username = ''
  form.feed_id = ''
  form.avatar_url = ''
  form.brand_logo = ''
  form.cover_image = ''
  form.rebate_info = '10%'
  form.promoters_count = 0
  form.sort_order = 0
  form.is_active = 1
  hotGoodsJson.value = '[]'
  editId.value = null
}

function openCreate() {
  isEdit.value = false
  reset()
  visible.value = true
}

function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  form.category = row.category
  form.title = row.title
  form.finder_username = row.finder_username
  form.feed_id = row.feed_id || ''
  form.avatar_url = row.avatar_url || ''
  form.brand_logo = row.brand_logo || ''
  form.cover_image = row.cover_image || ''
  form.rebate_info = row.rebate_info || '10%'
  form.promoters_count = row.promoters_count ?? 0
  form.sort_order = row.sort_order ?? 0
  form.is_active = row.is_active ? 1 : 0
  try {
    hotGoodsJson.value = JSON.stringify(row.hot_goods || [], null, 2)
  } catch {
    hotGoodsJson.value = '[]'
  }
  visible.value = true
}

async function submit() {
  let hot_goods
  try {
    hot_goods = JSON.parse(hotGoodsJson.value || '[]')
    if (!Array.isArray(hot_goods)) throw new Error('热卖商品须为 JSON 数组')
  } catch (e) {
    ElMessage.error(e.message || '热卖商品 JSON 无效')
    return
  }
  saving.value = true
  try {
    const body = {
      ...form,
      hot_goods
    }
    if (isEdit.value && editId.value) {
      await request.put(`/admin/live-streams/${editId.value}`, body)
      ElMessage.success('已保存')
    } else {
      await request.post('/admin/live-streams', body)
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

function onDelete(row) {
  ElMessageBox.confirm(`删除场次「${row.title}」？`, '确认', { type: 'warning' })
    .then(async () => {
      await request.delete(`/admin/live-streams/${row.id}`)
      ElMessage.success('已删除')
      await load()
    })
    .catch(() => {})
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
</style>
