<template>
  <div class="page-wrap">
    <div class="toolbar">
      <span>场景</span>
      <el-input v-model="scene" style="width: 160px" />
      <el-button type="primary" @click="load">拉取配置</el-button>
    </div>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never" header="京东">
          <el-form label-width="100px">
            <el-form-item label="头图 URL">
              <el-input v-model="jd.hero_image_url" type="textarea" :rows="2" />
            </el-form-item>
            <el-form-item label="主标题">
              <el-input v-model="jd.hero_title" />
            </el-form-item>
            <el-form-item label="副标题">
              <el-input v-model="jd.hero_subtitle" />
            </el-form-item>
            <el-button type="primary" :loading="saving" @click="saveOne('jd')">保存京东</el-button>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" header="拼多多">
          <el-form label-width="100px">
            <el-form-item label="头图 URL">
              <el-input v-model="pdd.hero_image_url" type="textarea" :rows="2" />
            </el-form-item>
            <el-form-item label="主标题">
              <el-input v-model="pdd.hero_title" />
            </el-form-item>
            <el-form-item label="副标题">
              <el-input v-model="pdd.hero_subtitle" />
            </el-form-item>
            <el-button type="primary" :loading="saving" @click="saveOne('pdd')">保存拼多多</el-button>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const scene = ref('benefit_card')
const saving = ref(false)
const jd = reactive({ hero_image_url: '', hero_title: '', hero_subtitle: '' })
const pdd = reactive({ hero_image_url: '', hero_title: '', hero_subtitle: '' })

async function load() {
  try {
    const res = await request.get('/admin/benefit-alliance-config', { params: { scene: scene.value } })
    const list = res.data || []
    list.forEach((r) => {
      if (r.platform === 'jd') {
        jd.hero_image_url = r.hero_image_url || ''
        jd.hero_title = r.hero_title || ''
        jd.hero_subtitle = r.hero_subtitle || ''
      }
      if (r.platform === 'pdd') {
        pdd.hero_image_url = r.hero_image_url || ''
        pdd.hero_title = r.hero_title || ''
        pdd.hero_subtitle = r.hero_subtitle || ''
      }
    })
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

async function saveOne(platform) {
  saving.value = true
  try {
    const payload = platform === 'jd' ? { ...jd, platform: 'jd', scene: scene.value } : { ...pdd, platform: 'pdd', scene: scene.value }
    await request.put('/admin/benefit-alliance-config', payload)
    ElMessage.success('已保存')
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
