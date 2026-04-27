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
      <el-table-column label="分类" width="120">
        <template #default="{ row }">{{ getCategoryLabel(row.category) }}</template>
      </el-table-column>
      <el-table-column label="营业" width="80">
        <template #default="{ row }">{{ row.is_open ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="上线" width="80">
        <template #default="{ row }">{{ row.is_active ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="72" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openGoods(row)">商品</el-button>
          <el-button type="primary" link @click="openReviews(row)">评价</el-button>
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="deleteShop(row)">删除</el-button>
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

    <el-dialog v-model="goodsVisible" :title="`商品管理 - ${currentShop.name || ''}`" width="980px" destroy-on-close>
      <div class="shop-sub-toolbar">
        <el-button type="success" @click="openCreateGood">新建商品</el-button>
      </div>
      <el-table v-loading="goodsLoading" :data="goodsRows" border stripe>
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="goods_no" label="货号" width="170" show-overflow-tooltip />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="分类" width="160">
          <template #default="{ row }">{{ getGoodsCategoryLabel(row.category_key) }}</template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="90" />
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="status" label="状态" width="90" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditGood(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pager"
        v-model:current-page="goodsPage"
        v-model:page-size="goodsLimit"
        :total="goodsTotal"
        layout="total, prev, pager, next"
        @current-change="loadGoods"
      />
    </el-dialog>

    <el-dialog v-model="goodEditorVisible" :title="isEditGood ? '编辑商品' : '新建商品'" width="560px" destroy-on-close @closed="resetGoodForm">
      <el-form :model="goodForm" label-width="100px">
        <el-form-item label="分类 key" required>
          <el-input v-model="goodForm.category_key" :placeholder="'如 fresh 或 in_0_1_1'">
            <template #append>
              <span class="category-hint">{{ getGoodsCategoryLabel(goodForm.category_key) }}</span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="goodForm.name" />
        </el-form-item>
        <el-form-item label="价格" required>
          <el-input-number v-model="goodForm.price" :min="0" :step="0.01" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="goodForm.stock" :min="0" />
        </el-form-item>
        <el-form-item label="主图 URL">
          <el-input v-model="goodForm.main_image" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="goodForm.status" style="width: 160px">
            <el-option label="在售" value="on_sale" />
            <el-option label="下架" value="off_sale" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="goodForm.sort_order" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="goodEditorVisible = false">取消</el-button>
        <el-button type="primary" :loading="goodSaving" @click="submitGood">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewVisible" :title="`评价管理 - ${currentShop.name || ''}`" width="980px" destroy-on-close>
      <el-table v-loading="reviewLoading" :data="reviewRows" border stripe>
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="user_id" label="用户ID" width="90" />
        <el-table-column prop="rating" label="评分" width="70" />
        <el-table-column prop="content" label="内容" min-width="260" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link @click="deleteReview(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pager"
        v-model:current-page="reviewPage"
        v-model:page-size="reviewLimit"
        :total="reviewTotal"
        layout="total, prev, pager, next"
        @current-change="loadReviews"
      />
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
const keyword = ref('')
const visible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const currentShop = reactive({ id: null, name: '' })
const goodsVisible = ref(false)
const goodsLoading = ref(false)
const goodsRows = ref([])
const goodsTotal = ref(0)
const goodsPage = ref(1)
const goodsLimit = ref(20)
const goodEditorVisible = ref(false)
const isEditGood = ref(false)
const editGoodId = ref(null)
const goodSaving = ref(false)
const reviewVisible = ref(false)
const reviewLoading = ref(false)
const reviewRows = ref([])
const reviewTotal = ref(0)
const reviewPage = ref(1)
const reviewLimit = ref(20)

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
const goodForm = reactive({
  category_key: '',
  name: '',
  price: 0,
  stock: 0,
  main_image: '',
  status: 'on_sale',
  sort_order: 0
})

const categoryCodeToName = {
  AAAA: '食品生鲜',
  AAAB: '美妆洗护',
  AAAC: '居家百货',
  AAAD: '服装箱包',
  AAAE: '母婴系列',
  AAAF: '家用电器',
  AAAG: '数码产品',
  AAAH: '珠宝饰品',
  AAAI: '旅游出行',
  AAAJ: '传统工艺'
}

function getCategoryLabel(code) {
  const raw = String(code || '').trim()
  return categoryCodeToName[raw] || raw || '-'
}

const goodsCategoryToName = {
  fresh: '食品生鲜',
  beauty: '美妆洗护',
  home: '居家百货',
  wear: '服装箱包',
  baby: '母婴系列',
  digital: '数码产品',
  appliance: '家用电器',
  jewel: '珠宝饰品',
  travel: '旅游出行',
  craft: '传统工艺',
  local: '本地特产'
}

const goodsMainCategoryNames = [
  '食品生鲜', '美妆洗护', '居家百货', '服装箱包', '母婴系列',
  '家用电器', '数码产品', '珠宝饰品', '旅游出行', '传统工艺'
]

const goodsSubCategoryNames = {
  0: { 1: '蔬菜', 2: '水果', 3: '肉禽蛋', 4: '水产海鲜', 5: '干货调料' },
  1: { 1: '护肤', 2: '彩妆', 3: '洗护', 4: '香水', 5: '个护工具' },
  2: { 1: '厨房用品', 2: '清洁用品', 3: '床上用品', 4: '整理收纳', 5: '家居装饰' },
  3: { 1: '上衣', 2: '裤装', 3: '外套', 4: '鞋包', 5: '配饰' },
  4: { 1: '奶粉辅食', 2: '尿裤湿巾', 3: '玩具', 4: '童装', 5: '孕产用品' },
  5: { 1: '大家电', 2: '小家电', 3: '厨房电器', 4: '生活电器', 5: '个护电器' },
  6: { 1: '手机通讯', 2: '电脑办公', 3: '配件', 4: '智能设备', 5: '影音娱乐' },
  7: { 1: '首饰', 2: '手表', 3: '配饰', 4: '礼品', 5: '文玩' },
  8: { 1: '旅游装备', 2: '行李箱包', 3: '配件', 4: '户外用品', 5: '车载用品' },
  9: { 1: '手工艺品', 2: '刺绣布艺',3 : '陶瓷', 4: '木雕竹编', 5: '民俗特产' }
}

function getGoodsCategoryLabel(key) {
  const raw = String(key || '').trim()
  if (!raw) return '-'
  if (goodsCategoryToName[raw]) return goodsCategoryToName[raw]
  const m = raw.match(/^in_(\d+)_(\d+)/)
  if (m) {
    const shopIdx = parseInt(m[1], 10)
    const subIdx = parseInt(m[2], 10)
    const mainName = goodsMainCategoryNames[shopIdx] || ''
    const subName = shopIdx in goodsSubCategoryNames && subIdx in goodsSubCategoryNames[shopIdx]
      ? goodsSubCategoryNames[shopIdx][subIdx] : ''
    return subName ? `${mainName} > ${subName}` : mainName || raw
  }
  return raw
}

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

function resetGoodForm() {
  goodForm.category_key = ''
  goodForm.name = ''
  goodForm.price = 0
  goodForm.stock = 0
  goodForm.main_image = ''
  goodForm.status = 'on_sale'
  goodForm.sort_order = 0
  editGoodId.value = null
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

async function deleteShop(row) {
  try {
    const { value: password } = await ElMessageBox.prompt(
      `确认删除店铺「${row.name}」及其全部商品？请输入管理员密码后继续。`,
      '删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        inputType: 'password',
        inputPlaceholder: '请输入管理员密码',
        inputValidator: (v) => (!!String(v || '').trim()) || '请输入管理员密码'
      }
    )
    await request.delete(`/admin/market-shops/${row.id}`, {
      data: { admin_password: String(password || '').trim() }
    })
    ElMessage.success('店铺及商品已删除')
    await load()
  } catch (e) {
    if (e === 'cancel' || e === 'close') return
    ElMessage.error(e.message || '删除失败')
  }
}

function openGoods(row) {
  currentShop.id = row.id
  currentShop.name = row.name
  goodsPage.value = 1
  goodsVisible.value = true
  loadGoods()
}

async function loadGoods() {
  if (!currentShop.id) return
  goodsLoading.value = true
  try {
    const res = await request.get('/admin/market-goods', {
      params: { shop_id: currentShop.id, page: goodsPage.value, limit: goodsLimit.value }
    })
    goodsRows.value = res.data || []
    goodsTotal.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载商品失败')
  } finally {
    goodsLoading.value = false
  }
}

function openCreateGood() {
  isEditGood.value = false
  resetGoodForm()
  goodEditorVisible.value = true
}

function openEditGood(row) {
  isEditGood.value = true
  editGoodId.value = row.id
  goodForm.category_key = row.category_key || ''
  goodForm.name = row.name || ''
  goodForm.price = Number(row.price) || 0
  goodForm.stock = Number(row.stock) || 0
  goodForm.main_image = row.main_image || ''
  goodForm.status = row.status || 'on_sale'
  goodForm.sort_order = row.sort_order ?? 0
  goodEditorVisible.value = true
}

async function submitGood() {
  if (!goodForm.category_key || !goodForm.name) {
    ElMessage.warning('请填写分类与名称')
    return
  }
  goodSaving.value = true
  try {
    if (isEditGood.value && editGoodId.value) {
      await request.put(`/admin/market-goods/${editGoodId.value}`, { ...goodForm })
    } else {
      await request.post('/admin/market-goods', {
        shop_id: Number(currentShop.id),
        ...goodForm
      })
    }
    ElMessage.success('商品已保存')
    goodEditorVisible.value = false
    await loadGoods()
  } catch (e) {
    ElMessage.error(e.message || '保存商品失败')
  } finally {
    goodSaving.value = false
  }
}

function openReviews(row) {
  currentShop.id = row.id
  currentShop.name = row.name
  reviewPage.value = 1
  reviewVisible.value = true
  loadReviews()
}

async function loadReviews() {
  if (!currentShop.id) return
  reviewLoading.value = true
  try {
    const res = await request.get('/admin/market-shop-reviews', {
      params: { shop_id: currentShop.id, page: reviewPage.value, limit: reviewLimit.value }
    })
    reviewRows.value = res.data || []
    reviewTotal.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载评价失败')
  } finally {
    reviewLoading.value = false
  }
}

function deleteReview(row) {
  ElMessageBox.confirm('删除该评价？', '确认', { type: 'warning' })
    .then(async () => {
      await request.delete(`/admin/market-shop-reviews/${row.id}`)
      ElMessage.success('评价已删除')
      await loadReviews()
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
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  align-items: center;
}
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
.shop-sub-toolbar {
  margin-bottom: 12px;
}
.category-hint {
  color: #999;
  font-size: 12px;
  padding: 0 8px;
  white-space: nowrap;
}
</style>
