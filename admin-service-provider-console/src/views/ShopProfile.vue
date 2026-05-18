<template>
  <div class="sp-page shop-page">
    <p class="sp-page-desc">以下信息用于用户端展示与联系；店铺名称由运营审核时确定，不可在此修改。</p>

    <div v-loading="loading" class="grid">
      <div class="panel sp-card base-card">
        <h3 class="card-title">基础信息</h3>
        <el-form v-if="form" label-width="110px" class="form">
          <el-form-item label="店铺名称">
            <el-input :model-value="form.shop_name" disabled />
          </el-form-item>
          <el-form-item label="服务小区">
            <el-tag v-if="form.community_id != null" type="success" effect="plain">ID {{ form.community_id }}</el-tag>
            <span v-else class="muted">未绑定（以订单为准）</span>
          </el-form-item>
          <el-form-item label="状态">
            <el-tag :type="form.status === 'active' ? 'success' : 'warning'" size="small">{{ form.status }}</el-tag>
          </el-form-item>
        </el-form>
      </div>

      <div class="panel sp-card">
        <h3 class="card-title">对外联系</h3>
        <el-form label-width="110px" class="form">
          <el-form-item label="联系人">
            <el-input v-model="edit.contact_name" placeholder="称呼" maxlength="40" show-word-limit />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="edit.phone" placeholder="手机号" maxlength="20" />
          </el-form-item>
        </el-form>
      </div>

      <div class="panel sp-card wide">
        <h3 class="card-title">门店展示</h3>
        <el-form label-width="110px" class="form">
          <el-form-item label="门头图">
            <el-input v-model="edit.shop_front_url" placeholder="https:// 图片 URL" clearable />
            <div v-if="isHttp(edit.shop_front_url)" class="preview">
              <el-image :src="edit.shop_front_url" fit="cover" class="pv-img" :preview-src-list="[edit.shop_front_url]" preview-teleported />
            </div>
          </el-form-item>
          <el-form-item label="环境图">
            <el-input
              v-model="envJson"
              type="textarea"
              :rows="4"
              placeholder='JSON 数组，如 ["https://...","https://..."]'
            />
            <div v-if="envPreview.length" class="env-grid">
              <el-image
                v-for="(u, i) in envPreview"
                :key="i"
                :src="u"
                fit="cover"
                class="env-thumb"
                :preview-src-list="envPreview"
                :initial-index="i"
                preview-teleported
              />
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" size="large" @click="save">保存更改</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { useSpConsoleStore } from '../stores/spConsole'

const store = useSpConsoleStore()

const loading = ref(true)
const saving = ref(false)
const form = ref(null)
const edit = reactive({
  contact_name: '',
  phone: '',
  shop_front_url: ''
})
const envJson = ref('[]')

const envPreview = computed(() => {
  try {
    const a = JSON.parse(envJson.value || '[]')
    if (!Array.isArray(a)) return []
    return a.filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u))
  } catch {
    return []
  }
})

function isHttp(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s.trim())
}

async function load() {
  loading.value = true
  try {
    const res = await request.get('/service-provider-portal/me')
    form.value = res.data.profile
    edit.contact_name = res.data.profile.contact_name || ''
    edit.phone = res.data.profile.phone || ''
    edit.shop_front_url = res.data.profile.shop_front_url || ''
    envJson.value = JSON.stringify(res.data.profile.environment_url || [], null, 2)
    const pr = res.data.profile
    store.mergeProfile({
      shop_name: pr.shop_name,
      community_id: pr.community_id,
      id: pr.id,
      user_id: pr.user_id
    })
  } finally {
    loading.value = false
  }
}

async function save() {
  let envArr = []
  try {
    envArr = JSON.parse(envJson.value || '[]')
    if (!Array.isArray(envArr)) throw new Error('环境图须为 JSON 数组')
  } catch (e) {
    ElMessage.error('环境图 JSON 格式不正确')
    return
  }
  saving.value = true
  try {
    await request.patch('/service-provider-portal/profile', {
      contact_name: edit.contact_name,
      phone: edit.phone,
      shop_front_url: edit.shop_front_url || null,
      environment_url: envArr
    })
    ElMessage.success('已保存')
    store.mergeProfile({
      shop_name: form.value.shop_name,
      community_id: form.value.community_id,
      id: form.value.id,
      user_id: form.value.user_id
    })
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.shop-page {
  padding-top: 0;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
.wide {
  grid-column: 1 / -1;
}
.panel {
  padding: 20px 22px 24px;
}
.card-title {
  margin: 0 0 18px;
  font-size: 16px;
  font-weight: 700;
  color: var(--sp-text);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--sp-border);
}
.form {
  max-width: 720px;
}
.muted {
  font-size: 13px;
  color: var(--sp-muted);
}
.preview {
  margin-top: 10px;
}
.pv-img {
  width: 160px;
  height: 100px;
  border-radius: 8px;
  border: 1px solid var(--sp-border);
}
.env-grid {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.env-thumb {
  width: 100px;
  height: 72px;
  border-radius: 8px;
  border: 1px solid var(--sp-border);
}
</style>
