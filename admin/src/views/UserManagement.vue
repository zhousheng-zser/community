<template>
  <div class="page-wrap">
    <el-form :inline="true" class="toolbar" @submit.prevent="search">
      <el-form-item label="关键词">
        <el-input
          v-model="keyword"
          clearable
          placeholder="昵称 / 手机 / OpenID / 用户ID"
          style="width: 280px"
          @clear="search"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column prop="nickname" label="昵称" min-width="120" show-overflow-tooltip />
      <el-table-column prop="phone" label="手机" width="120" />
      <el-table-column prop="role" label="角色" width="88" />
      <el-table-column prop="community_id" label="小区" width="88" />
      <el-table-column prop="balance" label="余额" width="100" />
      <el-table-column prop="createdAt" label="注册时间" width="170" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openDetail(row)">详情</el-button>
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

    <el-drawer v-model="drawer" title="用户详情" size="420px">
      <template v-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="openid">{{ detail.openid || '—' }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detail.nickname || '—' }}</el-descriptions-item>
          <el-descriptions-item label="手机">{{ detail.phone || '—' }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ detail.role || '—' }}</el-descriptions-item>
          <el-descriptions-item label="小区ID">{{ detail.community_id ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="余额">{{ detail.balance ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ detail.address || '—' }}</el-descriptions-item>
          <el-descriptions-item label="注册">{{ detail.createdAt || '—' }}</el-descriptions-item>
          <el-descriptions-item label="更新">{{ detail.updatedAt || '—' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const keyword = ref('')
const drawer = ref(false)
const detail = ref(null)

async function load() {
  loading.value = true
  try {
    const res = await request.get('/admin/users', {
      params: {
        page: page.value,
        limit: limit.value,
        keyword: keyword.value || undefined
      }
    })
    rows.value = res.data || []
    total.value = res.total ?? 0
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

async function openDetail(row) {
  drawer.value = true
  detail.value = null
  try {
    const res = await request.get(`/admin/users/${row.id}`)
    detail.value = res.data || null
  } catch {
    detail.value = row
  }
}

onMounted(load)
</script>

<style scoped>
.page-wrap {
  padding: 0 4px;
}
.toolbar {
  margin-bottom: 16px;
}
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
