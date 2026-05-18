<template>
  <div class="merchant-page">
    <div class="page-head merchant-card">
      <div>
        <h1 class="merchant-page-title">商品管理</h1>
        <p class="merchant-page-desc" style="margin-bottom: 0">
          维护 SKU、库存与上下架状态；低库存会在经营概览中预警。支持按名称搜索与状态筛选。
        </p>
      </div>
      <div class="head-btns">
        <el-button type="primary" size="large" @click="$router.push('/goods/new')">
          发布商品
        </el-button>
        <el-button size="large" @click="load">刷新列表</el-button>
      </div>
    </div>

    <div class="filter-bar merchant-card">
      <el-input
        v-model="keyword"
        clearable
        placeholder="搜索商品名称"
        class="kw"
        @clear="onFilterChange"
        @keyup.enter="onFilterChange"
      >
        <template #prefix>
          <span class="search-ico">🔍</span>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="上架状态" clearable class="sel" @change="onFilterChange">
        <el-option label="全部" value="" />
        <el-option label="在售" value="on_sale" />
        <el-option label="下架" value="off_sale" />
      </el-select>
      <el-checkbox v-model="needRestock" border @change="onFilterChange">仅看需补货</el-checkbox>
      <el-button type="primary" link @click="onFilterChange">应用筛选</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="list"
      stripe
      class="table-wrap merchant-card"
      empty-text="暂无商品，点击「发布商品」开始上架"
    >
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column label="主图" width="88">
        <template #default="{ row }">
          <el-image v-if="row.main_image" :src="row.main_image" class="g-img" fit="cover" />
          <div v-else class="g-ph">无图</div>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="商品名称" min-width="160" show-overflow-tooltip />
      <el-table-column label="单价" width="100">
        <template #default="{ row }">
          <span class="price">¥{{ row.price }}</span>
        </template>
      </el-table-column>
      <el-table-column label="库存" width="88">
        <template #default="{ row }">
          <span :class="{ warn: Number(row.stock) <= Number(row.safe_stock) }">{{ row.stock }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="safe_stock" label="安全库存" width="96" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_published ? 'success' : 'info'" effect="plain" round size="small">
            {{ row.is_published ? '在售' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push('/goods/' + row.id)">编辑</el-button>
          <el-button link @click="openRestock(row)">补货</el-button>
          <el-button link type="warning" @click="toggleShelf(row)">
            {{ row.is_published ? '下架' : '上架' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="limit"
      :total="total"
      layout="total, prev, pager, next, jumper"
      class="pagination"
      @current-change="load"
    />

    <el-dialog v-model="restockVisible" title="补货入库" width="400px" align-center>
      <p class="dlg-tip">为「{{ restockRow?.title }}」增加库存数量</p>
      <el-input-number v-model="restockQty" :min="1" :max="99999" size="large" class="full-num" />
      <template #footer>
        <el-button @click="restockVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRestock">确定入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const needRestock = ref(false)
const keyword = ref('')
const statusFilter = ref('')
const restockVisible = ref(false)
const restockQty = ref(1)
const restockRow = ref(null)

function onFilterChange() {
  page.value = 1
  load()
}

async function load() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      limit: limit.value,
      need_restock: needRestock.value ? '1' : undefined,
      keyword: keyword.value.trim() || undefined,
      status: statusFilter.value || undefined
    }
    const { data } = await request.get('/market/merchant/goods', { params })
    if (data.code !== 0 && data.errno !== 0) {
      ElMessage.error(data.msg || data.errmsg || '加载失败')
      return
    }
    const d = data.data || {}
    list.value = d.list || []
    total.value = d.total || 0
  } catch (_) {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

function openRestock(row) {
  restockRow.value = row
  restockQty.value = 1
  restockVisible.value = true
}

async function submitRestock() {
  if (!restockRow.value) return
  const { data } = await request.post(`/market/merchant/goods/${restockRow.value.id}/restock`, {
    quantity: restockQty.value
  })
  if (data.code !== 0 && data.errno !== 0) {
    ElMessage.error(data.msg || data.errmsg || '失败')
    return
  }
  ElMessage.success('已补货')
  restockVisible.value = false
  load()
}

async function toggleShelf(row) {
  const { data } = await request.post(`/market/merchant/goods/${row.id}/shelf`, {
    published: !row.is_published
  })
  if (data.code !== 0 && data.errno !== 0) {
    ElMessage.error(data.msg || data.errmsg || '失败')
    return
  }
  ElMessage.success('已更新')
  load()
}

onMounted(load)
</script>

<style scoped>
.page-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 22px 24px;
  margin-bottom: 16px;
}
.head-btns {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
}
.kw {
  width: 240px;
  max-width: 100%;
}
.sel {
  width: 140px;
}
.search-ico {
  opacity: 0.5;
  margin-left: 4px;
}
.table-wrap {
  padding: 4px 4px 12px;
  overflow: hidden;
}
.g-img {
  width: 52px;
  height: 52px;
  border-radius: 8px;
}
.g-ph {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: #f5f7fa;
  font-size: 11px;
  color: #c0c4cc;
  display: flex;
  align-items: center;
  justify-content: center;
}
.price {
  font-weight: 600;
  color: #cda05b;
}
.warn {
  color: #f56c6c;
  font-weight: 600;
}
.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
.dlg-tip {
  margin: 0 0 12px;
  color: #606266;
  font-size: 14px;
}
.full-num {
  width: 100%;
}
</style>
