<template>
  <div v-loading="loading">
    <el-page-header @back="$router.push('/goods')" content="编辑商品" />
    <el-form v-if="form" :model="form" label-width="100px" class="mt form-card" style="max-width: 640px">
      <el-form-item label="名称">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item label="价格">
        <el-input v-model="form.price" />
      </el-form-item>
      <el-form-item label="库存">
        <el-input-number v-model="form.stock" :min="0" />
      </el-form-item>
      <el-form-item label="安全库存">
        <el-input-number v-model="form.safe_stock" :min="0" />
      </el-form-item>
      <el-form-item label="主图 URL">
        <el-input v-model="form.main_image" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" rows="4" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const loading = ref(false)
const form = reactive({
  title: '',
  price: '',
  stock: 0,
  safe_stock: 0,
  main_image: '',
  description: ''
})

async function load() {
  loading.value = true
  try {
    const { data } = await request.get('/market/merchant/goods/' + route.params.id)
    if (data.code !== 0 && data.errno !== 0) {
      ElMessage.error(data.msg || data.errmsg)
      return
    }
    const g = (data.data && data.data.goods) || {}
    form.title = g.title || g.name || ''
    form.price = g.price != null ? String(g.price) : ''
    form.stock = g.stock != null ? Number(g.stock) : 0
    form.safe_stock = g.safe_stock != null ? Number(g.safe_stock) : 0
    form.main_image = g.main_image || ''
    form.description = g.description || ''
  } finally {
    loading.value = false
  }
}

async function save() {
  const { data } = await request.patch('/market/merchant/goods/' + route.params.id, {
    title: form.title,
    price: form.price,
    stock: form.stock,
    safe_stock: form.safe_stock,
    main_image: form.main_image,
    description: form.description
  })
  if (data.code !== 0 && data.errno !== 0) {
    ElMessage.error(data.msg || data.errmsg || '保存失败')
    return
  }
  ElMessage.success('已保存')
}

onMounted(load)
</script>

<style scoped>
.mt {
  margin-top: 20px;
}
.form-card {
  background: #fff;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
</style>
