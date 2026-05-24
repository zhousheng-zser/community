<template>
  <div class="home-coupon-wrap">
    <div class="header-box">
      <h3>优惠券管理</h3>
      <el-alert
        title="配置平台优惠券模板、首页展示与发放。支持定向发放、全员发放。"
        type="info"
        show-icon
        :closable="false"
      />
    </div>

    <el-tabs v-model="mainTab">
      <el-tab-pane label="券模板" name="templates">
        <div class="toolbar">
          <el-button type="primary" @click="openTplDialog()">新建模板</el-button>
          <el-button @click="loadTemplates">刷新</el-button>
        </div>
        <el-table v-loading="loadingTpl" :data="templates" border stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="code" label="编码" min-width="120" show-overflow-tooltip />
          <el-table-column label="面额/门槛" width="120">
            <template #default="{ row }">¥{{ row.discount_amount }} / 满{{ row.threshold_amount }}</template>
          </el-table-column>
          <el-table-column prop="issue_mode" label="发放方式" width="110" />
          <el-table-column prop="apply_scope" label="适用范围" width="90" />
          <el-table-column label="库存" width="100">
            <template #default="{ row }">
              {{ row.total_count > 0 ? `${row.issued_count}/${row.total_count}` : '不限' }}
            </template>
          </el-table-column>
          <el-table-column label="首页" width="70">
            <template #default="{ row }">
              <el-tag :type="row.show_on_home ? 'success' : 'info'" size="small">{{ row.show_on_home ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openTplDialog(row)">编辑</el-button>
              <el-button type="success" link @click="openIssueDialog(row)">发放</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="发放记录" name="issues">
        <div class="toolbar">
          <el-button @click="loadIssues">刷新</el-button>
        </div>
        <el-table v-loading="loadingIssue" :data="issues" border stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="user_id" label="用户ID" width="120" show-overflow-tooltip />
          <el-table-column prop="coupon_name" label="券名" min-width="140" />
          <el-table-column prop="issue_source" label="来源" width="100" />
          <el-table-column prop="status" label="状态" width="80" />
          <el-table-column prop="issued_at" label="发放时间" min-width="160" />
          <el-table-column prop="order_ref" label="订单号" min-width="140" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="tplDialogVisible" :title="tplForm.id ? '编辑模板' : '新建模板'" width="560px">
      <el-form :model="tplForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="tplForm.name" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="tplForm.code" placeholder="留空自动生成" />
        </el-form-item>
        <el-form-item label="减免金额">
          <el-input-number v-model="tplForm.discount_amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="使用门槛">
          <el-input-number v-model="tplForm.threshold_amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="发放方式">
          <el-select v-model="tplForm.issue_mode" style="width:100%">
            <el-option label="用户领取" value="claim" />
            <el-option label="新人自动" value="auto_new_user" />
            <el-option label="仅后台直发" value="admin_only" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用范围">
          <el-select v-model="tplForm.apply_scope" style="width:100%">
            <el-option label="全场" value="all" />
            <el-option label="到家服务" value="service" />
            <el-option label="本地集市" value="market" />
          </el-select>
        </el-form-item>
        <el-form-item label="总库存">
          <el-input-number v-model="tplForm.total_count" :min="0" />
          <span class="hint">0 表示不限量</span>
        </el-form-item>
        <el-form-item label="每人上限">
          <el-input-number v-model="tplForm.per_user_limit" :min="1" />
        </el-form-item>
        <el-form-item label="有效期至">
          <el-date-picker v-model="tplForm.valid_to" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
        </el-form-item>
        <el-form-item label="首页展示">
          <el-switch v-model="tplForm.show_on_home" />
        </el-form-item>
        <el-form-item label="首页排序">
          <el-input-number v-model="tplForm.home_sort" :min="0" />
        </el-form-item>
        <el-form-item label="新人券">
          <el-switch v-model="tplForm.is_new_user" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="tplForm.status" style="width:100%">
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="tplForm.description" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tplDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="issueDialogVisible" title="发放优惠券" width="480px">
      <p class="issue-tip">模板：{{ issueTarget?.name }}（ID {{ issueTarget?.id }}）</p>
      <el-form label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model="issueUserId" placeholder="定向发放时填写" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="issueDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!issueUserId" @click="issueToUser">定向发放</el-button>
        <el-button type="warning" @click="issueToAll">全员发放</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request.js'

const mainTab = ref('templates')
const loadingTpl = ref(false)
const loadingIssue = ref(false)
const templates = ref([])
const issues = ref([])

const tplDialogVisible = ref(false)
const tplForm = ref(defaultTplForm())

const issueDialogVisible = ref(false)
const issueTarget = ref(null)
const issueUserId = ref('')

function defaultTplForm() {
  return {
    id: null,
    code: '',
    name: '',
    discount_amount: 10,
    threshold_amount: 50,
    total_count: 0,
    issue_mode: 'claim',
    apply_scope: 'all',
    per_user_limit: 1,
    valid_to: '',
    show_on_home: false,
    home_sort: 0,
    is_new_user: false,
    status: 'active',
    description: ''
  }
}

async function loadTemplates() {
  loadingTpl.value = true
  try {
    const res = await request.get('/admin/coupon-templates', { params: { page_size: 100 } })
    const d = res.data || res
    templates.value = d.list || []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loadingTpl.value = false
  }
}

async function loadIssues() {
  loadingIssue.value = true
  try {
    const res = await request.get('/admin/coupon-issues', { params: { page_size: 100 } })
    const d = res.data || res
    issues.value = d.list || []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loadingIssue.value = false
  }
}

function openTplDialog(row) {
  if (row) {
    tplForm.value = {
      id: row.id,
      code: row.code || '',
      name: row.name || '',
      discount_amount: Number(row.discount_amount) || 0,
      threshold_amount: Number(row.threshold_amount) || 0,
      total_count: Number(row.total_count) || 0,
      issue_mode: row.issue_mode || 'claim',
      apply_scope: row.apply_scope || 'all',
      per_user_limit: Number(row.per_user_limit) || 1,
      valid_to: row.valid_to || '',
      show_on_home: !!row.show_on_home,
      home_sort: Number(row.home_sort) || 0,
      is_new_user: !!row.is_new_user,
      status: row.status || 'active',
      description: row.description || ''
    }
  } else {
    tplForm.value = defaultTplForm()
  }
  tplDialogVisible.value = true
}

async function saveTemplate() {
  if (!tplForm.value.name) {
    ElMessage.warning('请填写名称')
    return
  }
  try {
    const payload = { ...tplForm.value }
    delete payload.id
    if (tplForm.value.id) {
      await request.put(`/admin/coupon-templates/${tplForm.value.id}`, payload)
      ElMessage.success('更新成功')
    } else {
      await request.post('/admin/coupon-templates', payload)
      ElMessage.success('创建成功')
    }
    tplDialogVisible.value = false
    loadTemplates()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  }
}

function openIssueDialog(row) {
  issueTarget.value = row
  issueUserId.value = ''
  issueDialogVisible.value = true
}

async function issueToUser() {
  if (!issueTarget.value || !issueUserId.value) return
  try {
    await request.post('/admin/coupon-issues/issue', {
      template_id: issueTarget.value.id,
      user_id: issueUserId.value
    })
    ElMessage.success('发放成功')
    issueDialogVisible.value = false
    loadIssues()
  } catch (e) {
    ElMessage.error(e.message || '发放失败')
  }
}

async function issueToAll() {
  if (!issueTarget.value) return
  try {
    await ElMessageBox.confirm('将向全部用户发放该券，是否继续？', '全员发放', { type: 'warning' })
    const res = await request.post('/admin/coupon-issues/batch-all', {
      template_id: issueTarget.value.id
    })
    const d = res.data || res
    ElMessage.success(`完成：成功 ${d.success || 0}，跳过 ${d.skip || 0}，失败 ${d.fail || 0}`)
    issueDialogVisible.value = false
    loadIssues()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '批量发放失败')
  }
}

onMounted(() => {
  loadTemplates()
  loadIssues()
})
</script>

<style scoped>
.home-coupon-wrap { padding: 4px; }
.header-box { margin-bottom: 16px; }
.header-box h3 { margin: 0 0 12px; }
.toolbar { margin-bottom: 12px; }
.hint { margin-left: 8px; color: #999; font-size: 12px; }
.issue-tip { margin: 0 0 12px; color: #666; }
</style>
