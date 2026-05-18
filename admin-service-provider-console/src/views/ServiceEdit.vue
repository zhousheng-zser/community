<template>
  <div class="sp-page edit-page">
    <p class="sp-page-desc">{{ isNew ? '填写服务信息并上架，用户将在小程序首页服务商中看到。' : '修改服务内容与上下架状态。' }}</p>
    <div v-loading="loading" class="form-card sp-card">
      <el-form label-width="108px" class="form-inner" label-position="right">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="服务名称" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.sub_title" />
        </el-form-item>
        <el-form-item label="类目">
          <el-select v-model="form.category_id" clearable placeholder="选择类目" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" required>
          <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item label="封面图 URL">
          <el-input v-model="form.cover_image" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="详情描述">
          <el-input v-model="form.description" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="上架">
          <el-switch v-model="form.is_published" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="saving" @click="save">{{ isNew ? '创建并上架' : '保存修改' }}</el-button>
          <el-button size="large" @click="router.push('/services')">返回列表</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const categories = ref([])

const isNew = computed(() => route.name === 'ServiceCreate' || route.params.id === 'new')

const form = reactive({
  title: '',
  sub_title: '',
  category_id: null,
  price: 0,
  cover_image: '',
  description: '',
  is_published: true
})

async function loadCats() {
  const res = await request.get('/service-provider-portal/categories')
  categories.value = res.data.list || []
}

async function loadOne() {
  if (isNew.value) return
  loading.value = true
  try {
    const res = await request.get(`/service-provider-portal/services/${route.params.id}`)
    const s = res.data.service
    form.title = s.title || ''
    form.sub_title = s.sub_title || ''
    form.category_id = s.category_id || null
    form.price = Number(s.price) || 0
    form.cover_image = s.cover_image || ''
    form.description = s.description || ''
    form.is_published = !!s.is_published
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!form.title || form.price == null) {
    ElMessage.warning('请填写标题与价格')
    return
  }
  saving.value = true
  try {
    const body = {
      title: form.title,
      sub_title: form.sub_title || null,
      category_id: form.category_id,
      price: form.price,
      cover_image: form.cover_image,
      description: form.description,
      is_published: form.is_published
    }
    if (isNew.value) {
      await request.post('/service-provider-portal/services', body)
      ElMessage.success('已创建')
    } else {
      await request.patch(`/service-provider-portal/services/${route.params.id}`, body)
      ElMessage.success('已保存')
    }
    router.push('/services')
  } catch (e) {
    ElMessage.error(e.message || '失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadCats()
  await loadOne()
})
</script>

<style scoped>
.edit-page {
  padding-top: 0;
}
.form-card {
  padding: 28px 32px 32px;
  max-width: 720px;
}
.form-inner {
  max-width: 640px;
}
</style>
