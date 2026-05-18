<template>
  <div class="sp-page svc-page">
    <p class="sp-page-desc">维护上架服务、价格与类目；用户端「首页服务商」展示以已上架服务为准。</p>

    <div class="toolbar sp-card">
      <div class="toolbar-row">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="关键词">
            <el-input
              v-model="keyword"
              clearable
              placeholder="标题 / 副标题"
              style="width: 220px"
              @clear="search"
              @keyup.enter="search"
            />
          </el-form-item>
          <el-form-item label="上架状态">
            <el-select v-model="published" clearable placeholder="全部" style="width: 130px" @change="search">
              <el-option label="已上架" value="1" />
              <el-option label="未上架" value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="search">查询</el-button>
            <el-button @click="reset">重置</el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" size="large" @click="$router.push('/services/new')">
          <el-icon class="mr"><Plus /></el-icon>
          发布服务
        </el-button>
      </div>
    </div>

    <div class="table-wrap sp-card">
      <el-table v-loading="loading" :data="rows" stripe class="data-table" empty-text="暂无服务，点击「发布服务」上架">
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column label="封面" width="72">
          <template #default="{ row }">
            <el-image
              v-if="row.cover_image"
              :src="row.cover_image"
              fit="cover"
              class="thumb"
              :preview-src-list="[row.cover_image]"
              preview-teleported
            />
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
        <el-table-column prop="category_name" label="类目" width="120" show-overflow-tooltip />
        <el-table-column prop="price" label="价格(元)" width="100" />
        <el-table-column label="上架" width="96">
          <template #default="{ row }">
            <el-tag :type="row.is_published ? 'success' : 'info'" size="small" effect="plain">
              {{ row.is_published ? '已上架' : '未上架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sales_count" label="销量" width="80" />
        <el-table-column prop="order_count" label="订单数" width="88" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push('/services/' + row.id)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="load"
          @size-change="search"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const keyword = ref('')
const published = ref('')

async function load() {
  loading.value = true
  try {
    const res = await request.get('/service-provider-portal/services', {
      params: {
        page: page.value,
        limit: limit.value,
        keyword: keyword.value || undefined,
        published: published.value || undefined
      }
    })
    rows.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function reset() {
  keyword.value = ''
  published.value = ''
  search()
}

onMounted(load)
</script>

<style scoped>
.svc-page {
  padding-top: 0;
}
.toolbar {
  padding: 18px 20px;
  margin-bottom: 16px;
}
.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.filter-form {
  margin: 0;
  flex: 1;
}
.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.mr {
  margin-right: 6px;
  vertical-align: middle;
}
.table-wrap {
  padding: 0;
  overflow: hidden;
}
.thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
}
.muted {
  color: var(--sp-muted);
  font-size: 12px;
}
.pager-wrap {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--sp-border);
  background: #fafafa;
}
</style>
