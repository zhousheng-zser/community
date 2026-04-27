<template>
  <div class="finance-container">
    <div class="header-box">
      <h3>🪙 推广员提现审核大厅</h3>
      <el-alert title="请务必在微信商户后台确认公司账上余额充足后再点同意打款哦！" type="warning" show-icon />
    </div>

    <el-tabs v-model="activeName" class="demo-tabs">
      <el-tab-pane label="待人工打款处理" name="pending">
        <el-table :data="pendingData" border stripe style="width: 100%">
          <el-table-column prop="date" label="申请时间" width="180" />
          <el-table-column prop="user" label="推广员" width="150" />
          <el-table-column prop="amount" label="要求提现金额" width="150">
            <template #default="scope">
              <span style="color:red; font-weight:bold;">￥ {{ scope.row.amount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="balanceLeft" label="账户剩余佣金" width="150" />
          <el-table-column prop="ordersCount" label="本月推单战绩" />
          <el-table-column label="财务操作" width="220" fixed="right">
            <template #default="scope">
              <el-button type="success" icon="Check" size="small" @click="handleApprove(scope.row)">微信打款通过</el-button>
              <el-button type="danger" size="small" plain>驳回</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="本月发工资明细" name="history">
        <el-empty description="所有打款都可以在微信商户后台查看跨行明细" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'

const activeName = ref('pending')

const pendingData = ref([
  { id: 'TX001', date: '2026-03-08 10:23', user: '邻居王阿姨', amount: '350.50', balanceLeft: '￥ 12.0', ordersCount: '34 单' },
  { id: 'TX002', date: '2026-03-08 11:45', user: '社区第一团购达人', amount: '2100.00', balanceLeft: '￥ 500.0', ordersCount: '128 单' },
  { id: 'TX003', date: '2026-03-08 14:15', user: '宝妈群主丽丽', amount: '89.00', balanceLeft: '￥ 0.0', ordersCount: '5 单' }
])

// 模拟财务打款同意
const handleApprove = (row) => {
  ElMessageBox.confirm(
    `立刻使用微信“商家企业付款” API 向【${row.user}】的微信零钱汇入 ￥${row.amount}？`,
    '资金放款二次确认',
    {
      confirmButtonText: '确认转钱',
      cancelButtonText: '暂不处理',
      type: 'warning',
    }
  )
    .then(() => {
      ElMessage({ type: 'success', message: '已提交微信企业付款队列！流水账单库更新成功。' })
    })
    .catch(() => {})
}
</script>

<style scoped>
.finance-container {
  background: white;
  padding: 20px 30px;
  border-radius: 8px;
  min-height: calc(100vh - 120px);
}
.header-box { margin-bottom: 25px; }
.header-box h3 { margin-top: 0; color: #303133; }
.demo-tabs { margin-top: 20px; }
</style>
