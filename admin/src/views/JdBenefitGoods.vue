<template>
  <div class="page-wrap">
    <div class="toolbar">
      <el-select v-model="scene" placeholder="场景" style="width: 160px" @change="loadList">
        <el-option label="惠民卡 benefit_card" value="benefit_card" />
      </el-select>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增商品</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column label="主图" width="100">
        <template #default="{ row }">
          <el-image
            :src="row.image_url"
            fit="cover"
            style="width: 56px; height: 56px; border-radius: 4px"
            :preview-src-list="[row.image_url]"
            preview-teleported
          />
        </template>
      </el-table-column>
      <el-table-column prop="sku_id" label="SKU" width="130" show-overflow-tooltip />
      <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
      <el-table-column prop="price" label="价格" width="88" />
      <el-table-column prop="rebate_amount" label="返利" width="80" />
      <el-table-column prop="sort_order" label="排序" width="72" />
      <el-table-column label="状态" width="88">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="推广链接" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">
          <el-link :href="row.spread_url" target="_blank" type="primary">打开</el-link>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadList"
        @size-change="loadList"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑京东惠民卡商品' : '新增京东惠民卡商品'"
      width="560px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="场景" prop="scene">
          <el-input v-model="form.scene" placeholder="benefit_card" />
        </el-form-item>
        <el-form-item label="京东 SKU" prop="sku_id">
          <el-input v-model="form.sku_id" :disabled="isEdit" placeholder="字符串，勿用科学计数法" />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="主图 URL" prop="image_url">
          <el-input v-model="form.image_url" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="推广链接" prop="spread_url">
          <el-input v-model="form.spread_url" type="textarea" :rows="2" placeholder="京挑客推广 URL" />
        </el-form-item>
        <el-form-item label="展示价" prop="price">
          <el-input v-model="form.price" placeholder="可选" />
        </el-form-item>
        <el-form-item label="返利金额" prop="rebate_amount">
          <el-input v-model="form.rebate_amount" placeholder="可选" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" :max="99999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">上架</el-radio>
            <el-radio :label="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
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
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const scene = ref('benefit_card')

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)

const form = reactive({
  scene: 'benefit_card',
  sku_id: '',
  title: '',
  image_url: '',
  spread_url: '',
  price: '',
  rebate_amount: '',
  sort_order: 0,
  status: 1
})

const rules = {
  scene: [{ required: true, message: '必填', trigger: 'blur' }],
  sku_id: [{ required: true, message: '必填', trigger: 'blur' }],
  title: [{ required: true, message: '必填', trigger: 'blur' }],
  image_url: [{ required: true, message: '必填', trigger: 'blur' }],
  spread_url: [{ required: true, message: '必填', trigger: 'blur' }]
}

async function loadList() {
  loading.value = true
  try {
    const res = await request.get('/admin/jd-benefit-goods', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        scene: scene.value
      }
    })
    const payload = res.data || {}
    tableData.value = payload.list || []
    total.value = payload.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.scene = 'benefit_card'
  form.sku_id = ''
  form.title = ''
  form.image_url = ''
  form.spread_url = ''
  form.price = ''
  form.rebate_amount = ''
  form.sort_order = 0
  form.status = 1
  editId.value = null
  formRef.value?.resetFields?.()
}

function openCreate() {
  isEdit.value = false
  resetForm()
  form.scene = scene.value
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  form.scene = row.scene
  form.sku_id = row.sku_id
  form.title = row.title
  form.image_url = row.image_url
  form.spread_url = row.spread_url
  form.price = row.price || ''
  form.rebate_amount = row.rebate_amount || ''
  form.sort_order = row.sort_order
  form.status = row.status
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const body = {
      scene: form.scene,
      sku_id: form.sku_id,
      title: form.title,
      image_url: form.image_url,
      spread_url: form.spread_url,
      price: form.price,
      rebate_amount: form.rebate_amount,
      sort_order: form.sort_order,
      status: form.status
    }
    if (isEdit.value && editId.value) {
      await request.put(`/admin/jd-benefit-goods/${editId.value}`, body)
      ElMessage.success('已保存')
    } else {
      await request.post('/admin/jd-benefit-goods', body)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await loadList()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function onDelete(row) {
  ElMessageBox.confirm(`确定删除「${row.title}」？`, '确认删除', {
    type: 'warning'
  })
    .then(async () => {
      await request.delete(`/admin/jd-benefit-goods/${row.id}`)
      ElMessage.success('已删除')
      await loadList()
    })
    .catch(() => {})
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.page-wrap {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  min-height: 400px;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
