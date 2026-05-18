<template>
  <div v-loading="loading" class="merchant-page">
    <h1 class="merchant-page-title">店铺装修与资料</h1>
    <p class="merchant-page-desc">
      左侧为小程序顾客看到的店铺预览；右侧分区维护公告、联系方式与图片。灰色区块为平台侧字段，如需修改请联系运营。
    </p>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="9">
        <div class="preview merchant-card">
          <div class="cover-wrap">
            <el-image v-if="form.cover_url" :src="form.cover_url" fit="cover" class="cover-img" />
            <div v-else class="cover-placeholder">暂无店招图</div>
            <div class="cover-mask" />
            <div class="preview-shop">
              <el-avatar v-if="form.logo_url" :size="56" :src="form.logo_url" class="logo-av" />
              <div v-else class="logo-ph">店</div>
              <div class="preview-name">
                <span class="name">{{ form.name || '店铺名称' }}</span>
                <el-tag :type="form.is_open ? 'success' : 'info'" size="small" effect="dark" round>
                  {{ form.is_open ? '营业中' : '打烊' }}
                </el-tag>
              </div>
            </div>
          </div>
          <div class="preview-body">
            <p class="notice-preview">{{ form.notice || '暂无公告，可在下方编辑「店铺公告」' }}</p>
            <div class="meta-row">
              <span>📍 {{ form.address || '地址未填（平台档案）' }}</span>
            </div>
            <div class="meta-row">
              <span>📞 {{ form.contact_phone || '联系电话' }}</span>
              <span v-if="form.business_hours">🕐 {{ form.business_hours }}</span>
            </div>
          </div>
        </div>

        <el-card class="mt16" shadow="never">
          <template #header><span class="card-h">平台档案（只读）</span></template>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="店铺编号">{{ form.shop_no || '—' }}</el-descriptions-item>
            <el-descriptions-item label="经营品类">{{ form.category || '—' }}</el-descriptions-item>
            <el-descriptions-item label="起送金额">¥{{ form.min_order_amount }}</el-descriptions-item>
            <el-descriptions-item label="配送费">¥{{ form.delivery_fee }}</el-descriptions-item>
            <el-descriptions-item label="评分">{{ form.rating }} · 累计销量 {{ form.sold_count }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="15">
        <el-card shadow="never" class="merchant-card form-card">
          <template #header>
            <span class="card-h">对外展示（可编辑）</span>
          </template>
          <el-form :model="form" label-width="108px" label-position="right">
            <el-form-item label="营业状态">
              <el-switch
                v-model="form.is_open"
                :active-value="1"
                :inactive-value="0"
                active-text="营业中"
                inactive-text="休息"
                @change="saveField"
              />
            </el-form-item>
            <el-form-item label="店铺公告">
              <el-input
                v-model="form.notice"
                type="textarea"
                :rows="4"
                maxlength="255"
                show-word-limit
                placeholder="活动、配送说明、温馨提示等，会展示在店铺页"
              />
            </el-form-item>
            <el-form-item label="联系人">
              <el-input v-model="form.contact_name" placeholder="对外称呼" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="form.contact_phone" placeholder="顾客来电、订单联系" />
            </el-form-item>
            <el-form-item label="营业时间">
              <el-input v-model="form.business_hours" placeholder="例：09:00–22:00" />
            </el-form-item>
            <el-form-item label="Logo 图片 URL">
              <el-input v-model="form.logo_url" placeholder="建议正方形，HTTPS 可访问" />
              <div v-if="form.logo_url" class="img-preview">
                <el-image :src="form.logo_url" fit="contain" class="thumb" />
              </div>
            </el-form-item>
            <el-form-item label="店招图 URL">
              <el-input v-model="form.cover_url" placeholder="横图，用于店铺顶部背景" />
              <div v-if="form.cover_url" class="img-preview wide">
                <el-image :src="form.cover_url" fit="cover" class="thumb wide" />
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="saving" @click="save(false)">保存并同步到小程序</el-button>
              <span class="save-tip">保存后顾客端约数秒内可见</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { useMarketConsoleStore } from '../stores/marketConsole'

const store = useMarketConsoleStore()

const loading = ref(false)
const saving = ref(false)
const form = reactive({
  id: null,
  name: '',
  shop_no: '',
  category: '',
  notice: '',
  contact_name: '',
  contact_phone: '',
  business_hours: '',
  logo_url: '',
  cover_url: '',
  is_open: 1,
  address: '',
  min_order_amount: '0',
  delivery_fee: '0',
  rating: '—',
  sold_count: 0
})

async function load() {
  loading.value = true
  try {
    const { data } = await request.get('/market/merchant/shop')
    if (data.code !== 0 && data.errno !== 0) {
      ElMessage.error(data.msg || data.errmsg || '加载失败')
      return
    }
    const s = (data.data && data.data.shop) || {}
    Object.assign(form, {
      id: s.id != null ? s.id : null,
      name: s.name || '',
      shop_no: s.shop_no || '',
      category: s.category || '',
      notice: s.notice || '',
      contact_name: s.contact_name || '',
      contact_phone: s.contact_phone || '',
      business_hours: s.business_hours || '',
      logo_url: s.logo_url || '',
      cover_url: s.cover_url || '',
      is_open: s.is_open ? 1 : 0,
      address: s.address || '',
      min_order_amount: s.min_order_amount != null ? String(s.min_order_amount) : '0',
      delivery_fee: s.delivery_fee != null ? String(s.delivery_fee) : '0',
      rating: s.rating != null ? String(s.rating) : '—',
      sold_count: s.sold_count != null ? s.sold_count : 0
    })
    if (s.id != null) store.setShopFromLogin({ id: s.id, name: s.name || form.name })
  } finally {
    loading.value = false
  }
}

async function saveField() {
  await save(true)
}

async function save(silent) {
  saving.value = true
  try {
    const { data } = await request.patch('/market/merchant/shop', {
      notice: form.notice,
      contact_name: form.contact_name,
      contact_phone: form.contact_phone,
      business_hours: form.business_hours,
      logo_url: form.logo_url,
      cover_url: form.cover_url,
      is_open: form.is_open === 1
    })
    if (data.code !== 0 && data.errno !== 0) {
      ElMessage.error(data.msg || data.errmsg || '保存失败')
      return
    }
    if (!silent) ElMessage.success('已保存并同步')
    if (form.id != null) store.setShopFromLogin({ id: form.id, name: form.name })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.mt16 {
  margin-top: 16px;
}
.card-h {
  font-weight: 600;
  font-size: 15px;
}
.preview {
  overflow: hidden;
  padding: 0;
}
.cover-wrap {
  position: relative;
  height: 160px;
  background: #2c3e50;
}
.cover-img {
  width: 100%;
  height: 100%;
}
.cover-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}
.cover-mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 70%;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
  pointer-events: none;
}
.preview-shop {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-ph {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
}
.preview-name {
  flex: 1;
  min-width: 0;
}
.preview-name .name {
  display: block;
  color: #fff;
  font-weight: 700;
  font-size: 17px;
  margin-bottom: 6px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}
.preview-body {
  padding: 16px 18px 18px;
}
.notice-preview {
  margin: 0 0 12px;
  font-size: 13px;
  color: #606266;
  line-height: 1.55;
}
.meta-row {
  font-size: 12px;
  color: #909399;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 6px;
}
.form-card {
  border-radius: var(--mp-radius);
}
.img-preview {
  margin-top: 10px;
}
.thumb {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
.thumb.wide {
  width: 100%;
  max-width: 320px;
  height: 100px;
}
.save-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
