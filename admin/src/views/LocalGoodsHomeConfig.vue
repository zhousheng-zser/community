<template>
  <div class="page-wrap">
    <div class="toolbar">
      <div class="board-title">{{ currentDef ? currentDef.name : '本地商城榜单' }}</div>
      <el-button type="primary" :disabled="!currentDef" @click="openCreate">新增商品</el-button>
    </div>

    <el-alert v-if="!currentDef" type="warning" :closable="false" show-icon title="当前榜单不存在，请从左侧重新选择。"/>
    <template v-else>
      <el-alert
        v-if="currentDef.safe_edit"
        type="info"
        :closable="false"
        show-icon
        title="该列表采用安全编辑：仅支持修改 goods_id / sort / status，模块名只读。"
        class="mb"
      />

      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="goods_id" label="商品ID" width="100" />
        <el-table-column prop="goods_name" label="商品名" min-width="180" show-overflow-tooltip />
        <el-table-column prop="shop_id" label="店铺ID" width="100" />
        <el-table-column prop="shop_name" label="店铺名" min-width="160" show-overflow-tooltip />
        <el-table-column prop="module_name" label="模块/分组" min-width="140" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">{{ Number(row.status) === 1 ? '启用' : '禁用' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
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
        layout="total, prev, pager, next"
        @current-change="load"
      />
    </template>

    <el-dialog v-model="visible" :title="isEdit ? '编辑榜单商品' : '新增榜单商品'" width="560px" destroy-on-close>
      <el-form :model="form" label-width="110px">
        <el-form-item label="商品" required>
          <div class="goods-picker">
            <el-input v-model="goodsKeyword" placeholder="输入商品名或货号搜索" @keyup.enter="doSearchGoods">
              <template #append>
                <el-button :loading="goodsSearching" @click="doSearchGoods">搜索</el-button>
              </template>
            </el-input>
            <el-select
              v-model="form.goods_id"
              filterable
              clearable
              style="width: 100%"
              placeholder="请先搜索，再选择商品"
            >
            <el-option
              v-for="item in goodsOptions"
              :key="item.id"
              :label="`${item.name}（ID:${item.id} / 店铺:${item.shop_name || item.shop_id}）`"
              :value="item.id"
            />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item v-if="showTabSelect" label="Tab分组" required>
          <el-select v-model="form.tab_id" style="width: 240px">
            <el-option v-for="t in tabs" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="showModuleSelect" label="模块分组" required>
          <el-select v-model="form.module_id" style="width: 240px" :disabled="isEdit">
            <el-option v-for="m in modules" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 180px">
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="禁用" />
          </el-select>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const route = useRoute()
const definitions = ref([])
const listKey = ref('')
const currentDef = ref(null)
const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const visible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const modules = ref([])
const tabs = ref([])
const goodsOptions = ref([])
const goodsSearching = ref(false)
const goodsKeyword = ref('')
const FALLBACK_DEFINITIONS = [
  { key: 'hot_zone', name: '爆款专区' },
  { key: 'gift_zone_all', name: '礼物专区（全量）' },
  { key: 'gift_elder', name: '礼物专区 > 送长辈' },
  { key: 'gift_friend', name: '礼物专区 > 送朋友' },
  { key: 'gift_colleague', name: '礼物专区 > 送同事' },
  { key: 'gift_partner', name: '礼物专区 > 送伴侣' },
  { key: 'pick_zone_all', name: '本地商城甄选（全量）' },
  { key: 'pick_food', name: '商城甄选 > 食品生鲜' },
  { key: 'pick_home', name: '商城甄选 > 家居百货' },
  { key: 'pick_beauty', name: '商城甄选 > 美妆洗护' },
  { key: 'pick_fashion', name: '商城甄选 > 服装箱包' },
  { key: 'pick_digital', name: '商城甄选 > 数码配件' },
  { key: 'pick_mother', name: '商城甄选 > 母婴系列' },
  { key: 'pick_craft', name: '商城甄选 > 传统工艺' },
  { key: 'pick_other', name: '商城甄选 > 其他' },
  { key: 'high_comm_zone', name: '高佣专区' },
  { key: 'brand_goods', name: '品牌好货' },
  { key: 'jiuzhou_haoshi', name: '九州好食' },
  { key: 'jiuzhou_haowu', name: '九州好物' },
  { key: 'jiuzhou_haowei', name: '九州好味' },
  { key: 'autumn_winter', name: '秋冬好物' },
  { key: 'daily_news', name: '每日上新（首页）', safe_edit: true },
  { key: 'top_sales', name: '热卖TOP榜（首页）', safe_edit: true },
  { key: 'periodic_today', name: '周期榜单 > 今日主推', safe_edit: true },
  { key: 'periodic_weekly', name: '周期榜单 > 本周甄选', safe_edit: true },
  { key: 'feed_high_comm_first', name: 'Feed > 高佣推荐（首屏）', safe_edit: true },
  { key: 'feed_hot_shop_first', name: 'Feed > 热门好店（首屏）', safe_edit: true },
  { key: 'feed_you_like_first', name: 'Feed > 你可能喜欢（首屏）', safe_edit: true },
  { key: 'feed_high_comm_paged', name: 'Feed > 高佣推荐（翻页）', safe_edit: true },
  { key: 'feed_hot_shop_paged', name: 'Feed > 热门好店（翻页）', safe_edit: true },
  { key: 'feed_you_like_paged', name: 'Feed > 你可能喜欢（翻页）', safe_edit: true }
]

const form = reactive({
  goods_id: null,
  sort: 0,
  status: 1,
  module_id: null,
  tab_id: null
})

const showModuleSelect = computed(() => currentDef.value && ['periodic_modules', 'feed_modules', 'feed_products_paged'].includes(currentDef.value.key))
const showTabSelect = computed(() => currentDef.value && currentDef.value.key === 'jiuzhou_haowu_multi_tab')

function resetForm() {
  form.goods_id = null
  form.sort = 0
  form.status = 1
  form.module_id = null
  form.tab_id = null
  editId.value = null
}

async function remoteSearchGoods(keyword) {
  goodsSearching.value = true
  try {
    const res = await request.get('/admin/local-goods-home/goods/search', {
      params: { keyword: String(keyword || '').trim(), limit: 30 }
    })
    goodsOptions.value = res.data || []
  } catch (e) {
    ElMessage.error(e.message || '搜索商品失败')
  } finally {
    goodsSearching.value = false
  }
}

function doSearchGoods() {
  const kw = String(goodsKeyword.value || '').trim()
  if (!kw) {
    ElMessage.warning('请先输入商品名或货号')
    return
  }
  remoteSearchGoods(kw)
}

async function loadDefinitions() {
  try {
    const res = await request.get('/admin/local-goods-home/definitions')
    definitions.value = res.data || []
  } catch (e) {
    definitions.value = FALLBACK_DEFINITIONS
    ElMessage.warning(`榜单定义接口异常，已使用本地兜底配置：${e.message || '未知错误'}`)
  }
  const fromRoute = String(route.params.listKey || '').trim()
  const hit = fromRoute ? definitions.value.find((d) => d.key === fromRoute) : null
  listKey.value = hit ? hit.key : ''
  currentDef.value = hit || null
}

async function load() {
  if (!listKey.value) return
  loading.value = true
  try {
    const res = await request.get('/admin/local-goods-home/items', {
      params: { list_key: listKey.value, page: page.value, limit: limit.value }
    })
    rows.value = res.data || []
    total.value = res.total || 0
    const meta = res.meta || {}
    modules.value = meta.modules || []
    tabs.value = meta.tabs || []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEdit.value = false
  resetForm()
  goodsKeyword.value = ''
  goodsOptions.value = []
  visible.value = true
}

function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  form.goods_id = Number(row.goods_id) || null
  form.sort = Number(row.sort) || 0
  form.status = Number(row.status) === 0 ? 0 : 1
  form.module_id = row.module_id ? Number(row.module_id) : null
  form.tab_id = row.tab_id ? Number(row.tab_id) : null
  goodsOptions.value = [{
    id: Number(row.goods_id),
    name: row.goods_name || `商品${row.goods_id}`,
    goods_no: '',
    shop_id: Number(row.shop_id),
    shop_name: row.shop_name || ''
  }]
  goodsKeyword.value = row.goods_name || ''
  visible.value = true
}

async function submit() {
  if (!listKey.value) return
  if (!form.goods_id) {
    ElMessage.warning('请填写商品ID')
    return
  }
  if (showModuleSelect.value && !form.module_id) {
    ElMessage.warning('请选择模块分组')
    return
  }
  if (showTabSelect.value && !form.tab_id) {
    ElMessage.warning('请选择Tab分组')
    return
  }

  saving.value = true
  try {
    const payload = {
      list_key: listKey.value,
      goods_id: Number(form.goods_id),
      sort: Number(form.sort) || 0,
      status: Number(form.status) === 0 ? 0 : 1
    }
    if (form.module_id) payload.module_id = Number(form.module_id)
    if (form.tab_id) payload.tab_id = Number(form.tab_id)
    if (isEdit.value && editId.value) {
      await request.put(`/admin/local-goods-home/items/${editId.value}`, payload)
    } else {
      await request.post('/admin/local-goods-home/items', payload)
    }
    ElMessage.success('保存成功')
    visible.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function onDelete(row) {
  ElMessageBox.confirm('确认删除该条配置？', '提示', { type: 'warning' })
    .then(async () => {
      await request.delete(`/admin/local-goods-home/items/${row.id}`, { params: { list_key: listKey.value } })
      ElMessage.success('已删除')
      await load()
    })
    .catch(() => {})
}

onMounted(async () => {
  await loadDefinitions()
  if (listKey.value) {
    await load()
  }
})

watch(
  () => route.params.listKey,
  async (v) => {
    const key = String(v || '').trim()
    if (definitions.value.length === 0) return
    const hit = key ? definitions.value.find((d) => d.key === key) : null
    currentDef.value = hit || null
    listKey.value = hit ? hit.key : ''
    rows.value = []
    total.value = 0
    modules.value = []
    tabs.value = []
    if (!hit) return
    page.value = 1
    await load()
  }
)
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
  justify-content: space-between;
}
.board-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}
.mb {
  margin-bottom: 12px;
}
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
.goods-picker {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
