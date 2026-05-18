<template>
  <div>
    <el-page-header @back="$router.push('/goods')" content="新建商品" />
    <el-form :model="form" label-width="100px" class="mt form-card" style="max-width: 640px">
      <el-form-item label="名称" required>
        <el-input v-model="form.name" placeholder="商品名称" />
      </el-form-item>
      <el-form-item label="店内分类 key">
        <el-input v-model="form.category_key" placeholder="默认 local，与店铺类目配置一致" />
      </el-form-item>
      <el-form-item label="价格" required>
        <el-input v-model="form.price" placeholder="0.00" />
      </el-form-item>
      <el-form-item label="库存">
        <el-input-number v-model="form.stock" :min="0" />
      </el-form-item>
      <el-form-item label="安全库存">
        <el-input-number v-model="form.safe_stock" :min="0" />
      </el-form-item>
      <el-form-item label="主图 URL">
        <el-input v-model="form.main_image" placeholder="/uploads/..." />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" rows="4" />
      </el-form-item>
      <el-form-item label="创建后上架">
        <el-switch v-model="form.on_shelf" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="submit">创建商品</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const saving = ref(false)
const form = reactive({
  name: '',
  category_key: 'local',
  price: '',
  stock: 0,
  safe_stock: 0,
  main_image: '',
  description: '',
  on_shelf: false
})

async function submit() {
  if (!form.name.trim()) {
    ElMessage.warning('请填写名称')
    return
  }
  saving.value = true
  try {
    const { data } = await request.post('/market/merchant/goods', {
      name: form.name,
      category_key: form.category_key || 'local',
      price: form.price,
      stock: form.stock,
      safe_stock: form.safe_stock,
      main_image: form.main_image,
      description: form.description,
      on_shelf: form.on_shelf
    })
    if (data.code !== 0 && data.errno !== 0) {
      ElMessage.error(data.msg || data.errmsg || '创建失败')
      return
    }
    ElMessage.success('已创建')
    const g = (data.data && data.data.goods) || {}
    if (g.id) router.replace('/goods/' + g.id)
    else router.push('/goods')
  } finally {
    saving.value = false
  }
}
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
