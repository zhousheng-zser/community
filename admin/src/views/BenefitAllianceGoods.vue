<template>
  <div class="page-wrap">
    <div class="toolbar">
      <el-select v-model="filterPlatform" placeholder="全部平台" clearable style="width: 140px" @change="loadList">
        <el-option label="京东联盟" value="jd" />
        <el-option label="拼多多" value="pdd" />
        <el-option label="淘宝" value="taobao" />
        <el-option label="美团" value="meituan" />
        <el-option label="品牌餐饮" value="brand" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 120px" @change="loadList">
        <el-option label="上架" value="active" />
        <el-option label="下架" value="inactive" />
      </el-select>
      <el-input v-model="filterKeyword" placeholder="标题/描述" clearable style="width: 180px" @keyup.enter="loadList" />
      <el-button type="primary" :icon="Plus" @click="openCreate">新增推广</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column label="平台" width="100">
        <template #default="{ row }">
          <el-tag :type="platformTagType(row.platform)">{{ platformLabel(row.platform) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="主图" width="80">
        <template #default="{ row }">
          <el-image
            :src="row.image_url"
            fit="cover"
            style="width: 48px; height: 48px; border-radius: 4px"
            :preview-src-list="[row.image_url]"
            preview-teleported
          />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
      <el-table-column prop="subtitle" label="副标题" min-width="140" show-overflow-tooltip />
      <el-table-column label="价格" width="100">
        <template #default="{ row }">
          <div v-if="row.coupon_price && Number(row.coupon_price) > 0">
            <div style="color:#e74c3c;font-weight:600;">券后￥{{ row.coupon_price }}</div>
            <div style="color:#999;font-size:12px;text-decoration:line-through;">￥{{ row.price }}</div>
          </div>
          <div v-else-if="row.price && Number(row.price) > 0">￥{{ row.price }}</div>
          <div v-else style="color:#999;font-size:12px;">—</div>
        </template>
      </el-table-column>
      <el-table-column prop="rebate_amount" label="返利" width="80">
        <template #default="{ row }">
          <span v-if="row.rebate_amount && Number(row.rebate_amount) > 0" style="color:#27ae60;">￥{{ row.rebate_amount }}</span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="72" />
      <el-table-column label="状态" width="88">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '上架' : '下架' }}
          </el-tag>
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
      :title="isEdit ? '编辑推广商品' : '新增推广商品'"
      width="600px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="平台" prop="platform">
          <el-select v-model="form.platform" placeholder="选择平台" style="width: 100%" :disabled="isEdit">
            <el-option label="京东联盟" value="jd" />
            <el-option label="拼多多" value="pdd" />
            <el-option label="淘宝" value="taobao" />
            <el-option label="美团" value="meituan" />
            <el-option label="品牌餐饮" value="brand" />
          </el-select>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="商品或活动标题" />
        </el-form-item>
        <el-form-item label="副标题" prop="subtitle">
          <el-input v-model="form.subtitle" type="textarea" :rows="2" placeholder="描述/副标题" />
        </el-form-item>
        <el-form-item label="主图 URL" prop="image_url">
          <el-input v-model="form.image_url" type="textarea" :rows="2" placeholder="图片地址，如 /uploads/benefit_alliance/xxx.png" />
        </el-form-item>

        <!-- 京东字段 -->
        <template v-if="form.platform === 'jd'">
          <el-form-item label="SKU ID" prop="sku_id">
            <el-input v-model="form.sku_id" placeholder="京东 SKU" />
          </el-form-item>
        </template>

        <!-- 拼多多/淘宝字段 -->
        <template v-if="form.platform === 'pdd' || form.platform === 'taobao'">
          <el-form-item label="商品 ID" prop="goods_id">
            <el-input v-model="form.goods_id" placeholder="商品 ID" />
          </el-form-item>
          <el-form-item label="券后价" prop="coupon_price">
            <el-input v-model="form.coupon_price" placeholder="可选" />
          </el-form-item>
        </template>

        <!-- 品牌餐饮字段 -->
        <template v-if="form.platform === 'brand'">
          <el-form-item label="关键词" prop="keyword">
            <el-input v-model="form.keyword" placeholder="如：肯德基、麦当劳" />
          </el-form-item>
        </template>

        <el-form-item label="原价" prop="price">
          <el-input v-model="form.price" placeholder="可选" />
        </el-form-item>
        <el-form-item label="返利金额" prop="rebate_amount">
          <el-input v-model="form.rebate_amount" placeholder="可选" />
        </el-form-item>
        <el-form-item label="推广链接" prop="spread_url">
          <el-input v-model="form.spread_url" type="textarea" :rows="2" placeholder="推广 URL" />
        </el-form-item>
        <el-form-item label="小程序路径" prop="mini_path">
          <el-input v-model="form.mini_path" placeholder="可选，跳转小程序路径" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" :max="99999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">上架</el-radio>
            <el-radio label="inactive">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="场景" prop="scene">
          <el-input v-model="form.scene" placeholder="默认 benefit_card" />
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
const filterPlatform = ref('')
const filterStatus = ref('')
const filterKeyword = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)

const form = reactive({
  platform: 'jd',
  title: '',
  subtitle: '',
  image_url: '',
  price: '',
  coupon_price: '',
  rebate_amount: '',
  sku_id: '',
  goods_id: '',
  spread_url: '',
  mini_path: '',
  keyword: '',
  sort_order: 0,
  status: 'active',
  scene: 'benefit_card'
})

const rules = {
  platform: [{ required: true, message: '必填', trigger: 'change' }],
  title: [{ required: true, message: '必填', trigger: 'blur' }],
  image_url: [{ required: true, message: '必填', trigger: 'blur' }],
  status: [{ required: true, message: '必填', trigger: 'change' }]
}

function platformLabel(p) {
  const map = { jd: '京东', pdd: '拼多多', taobao: '淘宝', meituan: '美团', brand: '品牌' }
  return map[p] || p
}

function platformTagType(p) {
  const map = { jd: 'danger', pdd: 'warning', taobao: 'primary', meituan: 'success', brand: '' }
  return map[p] || ''
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (filterPlatform.value) params.platform = filterPlatform.value
    if (filterStatus.value) params.status = filterStatus.value
    if (filterKeyword.value) params.keyword = filterKeyword.value

    const res = await request.get('/admin/benefit-alliance-goods', { params })
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
  form.platform = 'jd'
  form.title = ''
  form.subtitle = ''
  form.image_url = ''
  form.price = ''
  form.coupon_price = ''
  form.rebate_amount = ''
  form.sku_id = ''
  form.goods_id = ''
  form.spread_url = ''
  form.mini_path = ''
  form.keyword = ''
  form.sort_order = 0
  form.status = 'active'
  form.scene = 'benefit_card'
  editId.value = null
  formRef.value?.resetFields?.()
}

function openCreate() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  form.platform = row.platform
  form.title = row.title
  form.subtitle = row.subtitle || ''
  form.image_url = row.image_url || ''
  form.price = row.price || ''
  form.coupon_price = row.coupon_price || ''
  form.rebate_amount = row.rebate_amount || ''
  form.sku_id = row.sku_id || ''
  form.goods_id = row.goods_id || ''
  form.spread_url = row.spread_url || ''
  form.mini_path = row.mini_path || ''
  form.keyword = row.keyword || ''
  form.sort_order = row.sort_order
  form.status = row.status
  form.scene = row.scene || 'benefit_card'
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const body = {
      platform: form.platform,
      title: form.title,
      subtitle: form.subtitle,
      image_url: form.image_url,
      price: form.price,
      coupon_price: form.coupon_price,
      rebate_amount: form.rebate_amount,
      sku_id: form.sku_id,
      goods_id: form.goods_id,
      spread_url: form.spread_url,
      mini_path: form.mini_path,
      keyword: form.keyword,
      sort_order: form.sort_order,
      status: form.status,
      scene: form.scene
    }
    if (isEdit.value && editId.value) {
      await request.put(`/admin/benefit-alliance-goods/${editId.value}`, body)
      ElMessage.success('已保存')
    } else {
      await request.post('/admin/benefit-alliance-goods', body)
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
      await request.delete(`/admin/benefit-alliance-goods/${row.id}`)
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
