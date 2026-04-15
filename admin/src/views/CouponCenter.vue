<template>
  <div class="page-wrap">
    <div class="toolbar">
      <el-button type="primary" @click="templateVisible = true">新建券模板</el-button>
      <el-button @click="issueVisible = true">批量发券</el-button>
      <el-button @click="load">刷新</el-button>
    </div>
    <el-row :gutter="12">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>券模板</template>
          <el-table :data="templates" v-loading="loadingTemplates" border stripe>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="name" label="名称" min-width="120" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="discount_amount" label="优惠" width="90" />
            <el-table-column prop="issued_count" label="已发" width="90" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>发放记录</template>
          <el-table :data="issues" v-loading="loadingIssues" border stripe>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="template_id" label="模板ID" width="90" />
            <el-table-column prop="user_id" label="用户ID" width="90" />
            <el-table-column prop="code" label="券码" min-width="160" />
            <el-table-column prop="status" label="状态" width="90" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="templateVisible" title="新建券模板" width="520px">
      <el-form :model="tpl" label-width="100px">
        <el-form-item label="名称"><el-input v-model="tpl.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="tpl.type">
            <el-option label="cash" value="cash" />
            <el-option label="full_minus" value="full_minus" />
            <el-option label="discount" value="discount" />
          </el-select>
        </el-form-item>
        <el-form-item label="门槛"><el-input-number v-model="tpl.threshold_amount" :min="0" /></el-form-item>
        <el-form-item label="优惠"><el-input-number v-model="tpl.discount_amount" :min="0" /></el-form-item>
        <el-form-item label="总量"><el-input-number v-model="tpl.total_count" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateVisible = false">取消</el-button>
        <el-button type="primary" @click="createTemplate">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="issueVisible" title="批量发券" width="520px">
      <el-form :model="issueForm" label-width="120px">
        <el-form-item label="模板ID"><el-input-number v-model="issueForm.template_id" :min="1" /></el-form-item>
        <el-form-item label="用户ID列表">
          <el-input v-model="issueUsersRaw" placeholder="逗号分隔，例如 1,2,3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="issueVisible = false">取消</el-button>
        <el-button type="primary" @click="issueCoupon">发放</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const templates = ref([])
const issues = ref([])
const loadingTemplates = ref(false)
const loadingIssues = ref(false)
const templateVisible = ref(false)
const issueVisible = ref(false)
const issueUsersRaw = ref('')

const tpl = reactive({ name: '', type: 'cash', threshold_amount: 0, discount_amount: 0, total_count: 0 })
const issueForm = reactive({ template_id: 1 })

async function load() {
  loadingTemplates.value = true
  loadingIssues.value = true
  try {
    const [a, b] = await Promise.all([request.get('/admin/coupon-templates'), request.get('/admin/coupon-issues')])
    templates.value = a.data || []
    issues.value = b.data || []
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loadingTemplates.value = false
    loadingIssues.value = false
  }
}
async function createTemplate() {
  try {
    await request.post('/admin/coupon-templates', { ...tpl })
    ElMessage.success('创建成功')
    templateVisible.value = false
    await load()
  } catch (e) { ElMessage.error(e.message || '失败') }
}
async function issueCoupon() {
  try {
    const user_ids = issueUsersRaw.value.split(',').map(s => Number(s.trim())).filter(Boolean)
    await request.post('/admin/coupon-issues/issue', { template_id: issueForm.template_id, user_ids })
    ElMessage.success('发放成功')
    issueVisible.value = false
    await load()
  } catch (e) { ElMessage.error(e.message || '失败') }
}
onMounted(load)
</script>

<style scoped>
.page-wrap { background: #fff; padding: 16px; border-radius: 8px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
</style>
