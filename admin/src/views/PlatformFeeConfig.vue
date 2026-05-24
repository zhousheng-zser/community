<template>
  <div class="fee-config-wrap">
    <div class="header-box">
      <h3>平台抽成配置</h3>
      <el-alert
        title="付款端按应付全额展示；接单端按净收展示。推广分佣从平台抽成池分配，默认全局 10%，可按订单类型单独覆盖。"
        type="info"
        show-icon
        :closable="false"
      />
    </div>

    <el-form v-loading="loading" :model="form" label-width="140px" style="max-width: 560px">
      <el-form-item label="全局默认抽成">
        <el-input-number
          v-model="form.globalPct"
          :min="0"
          :max="maxPct"
          :precision="2"
          :step="0.5"
        />
        <span class="unit">%</span>
      </el-form-item>
      <el-form-item label="本地集市">
        <el-input-number v-model="form.marketPct" :min="0" :max="maxPct" :precision="2" :step="0.5" />
        <span class="unit">%（留空继承全局）</span>
        <el-button link type="primary" @click="form.marketPct = null">清空</el-button>
      </el-form-item>
      <el-form-item label="到家服务">
        <el-input-number v-model="form.servicePct" :min="0" :max="maxPct" :precision="2" :step="0.5" />
        <span class="unit">%</span>
        <el-button link type="primary" @click="form.servicePct = null">清空</el-button>
      </el-form-item>
      <el-form-item label="邻里帮帮">
        <el-input-number v-model="form.neighborPct" :min="0" :max="maxPct" :precision="2" :step="0.5" />
        <span class="unit">%</span>
        <el-button link type="primary" @click="form.neighborPct = null">清空</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        <el-button @click="load">刷新</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const saving = ref(false)
const maxPct = ref(30)
const form = ref({
  globalPct: 10,
  marketPct: null,
  servicePct: null,
  neighborPct: null
})

function rateToPct(rate) {
  if (rate == null || rate === '') return null
  return Number((Number(rate) * 100).toFixed(2))
}

function pctToRate(pct) {
  if (pct == null || pct === '') return ''
  return Number(pct) / 100
}

async function load() {
  loading.value = true
  try {
    const res = await request.get('/admin/platform-fee-config')
    const d = res.data || res
    maxPct.value = d.max_rate != null ? Number((Number(d.max_rate) * 100).toFixed(2)) : 30
    form.value = {
      globalPct: rateToPct(d.global) ?? 10,
      marketPct: rateToPct(d.market),
      servicePct: rateToPct(d.service),
      neighborPct: rateToPct(d.neighbor_assist)
    }
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await request.put('/admin/platform-fee-config', {
      global: pctToRate(form.value.globalPct),
      market: form.value.marketPct == null ? '' : pctToRate(form.value.marketPct),
      service: form.value.servicePct == null ? '' : pctToRate(form.value.servicePct),
      neighbor_assist: form.value.neighborPct == null ? '' : pctToRate(form.value.neighborPct)
    })
    ElMessage.success('保存成功')
    load()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.fee-config-wrap { padding: 4px; }
.header-box { margin-bottom: 16px; }
.header-box h3 { margin: 0 0 12px; }
.unit { margin-left: 8px; color: #666; font-size: 13px; }
</style>
