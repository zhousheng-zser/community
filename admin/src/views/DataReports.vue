<template>
  <div class="page-wrap">
    <el-form :inline="true" class="filter">
      <el-form-item label="开始">
        <el-date-picker v-model="from" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="结束">
        <el-date-picker v-model="to" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="12">
      <el-col :span="6"><el-card>用户总数：{{ data.users_total || 0 }}</el-card></el-col>
      <el-col :span="6"><el-card>订单数：{{ data.orders_total || 0 }}</el-card></el-col>
      <el-col :span="6"><el-card>支付金额：￥{{ Number(data.paid_amount || 0).toFixed(2) }}</el-card></el-col>
      <el-col :span="6"><el-card>净额：￥{{ Number(data.net_amount || 0).toFixed(2) }}</el-card></el-col>
    </el-row>
    <el-descriptions border class="mt">
      <el-descriptions-item label="退款金额">￥{{ Number(data.refund_amount || 0).toFixed(2) }}</el-descriptions-item>
      <el-descriptions-item label="反馈数">{{ data.feedback_total || 0 }}</el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const from = ref('')
const to = ref('')
const data = ref({})

async function load() {
  try {
    const params = {}
    if (from.value) params.from = from.value
    if (to.value) params.to = to.value
    const res = await request.get('/admin/reports', { params })
    data.value = res.data || {}
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}
</script>

<style scoped>
.page-wrap { background: #fff; padding: 16px; border-radius: 8px; }
.filter { margin-bottom: 12px; }
.mt { margin-top: 12px; }
</style>
