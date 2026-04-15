<template>
  <div class="page-wrap">
    <!-- 炫酷动态数据监测板 (科技感) -->
    <div class="tech-monitor">
      <div class="monitor-header">
        <div class="tech-title">
          <el-icon class="pulse-icon"><Odometer /></el-icon> 
          技工资源池 · 实时监控矩阵
        </div>
        <div class="scan-line"></div>
      </div>
      <div class="monitor-metrics">
        <div class="metric-box">
          <div class="m-label">全栈接入总并发</div>
          <div class="m-value glow-blue">9,204 <span class="unit">NODE</span></div>
          <div class="progress-track"><div class="progress-bar pb-blue"></div></div>
        </div>
        <div class="metric-box">
          <div class="m-label">异常待处理队列</div>
          <div class="m-value glow-orange">{{ total || 0 }} <span class="unit">REQ</span></div>
          <div class="progress-track"><div class="progress-bar pb-orange"></div></div>
        </div>
        <div class="metric-box">
          <div class="m-label">吞吐处理效能</div>
          <div class="m-value glow-green">98.4% <span class="unit">EFFICIENCY</span></div>
          <div class="progress-track"><div class="progress-bar pb-green"></div></div>
        </div>
      </div>
    </div>

    <!-- 数据表工具栏 -->
    <div class="toolbar-box">
      <el-radio-group v-model="status" @change="load" class="tech-radio">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="pending">待审核</el-radio-button>
        <el-radio-button label="approved">已通过</el-radio-button>
        <el-radio-button label="rejected">已驳回</el-radio-button>
      </el-radio-group>
    </div>
    
    <div class="table-container">
      <el-table v-loading="loading" :data="rows" class="tech-table">
      <el-table-column prop="id" label="ID" width="72" />
      <el-table-column label="用户" min-width="120">
        <template #default="{ row }">
          {{ row.user?.nickname || '-' }} / {{ row.user?.phone || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="phone" label="手机" width="120" />
      <el-table-column prop="industry" label="行业" width="120" />
      <el-table-column prop="city" label="城市" width="100" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column prop="created_at" label="申请时间" width="170" />
      <el-table-column label="操作" width="180" fixed="right" v-if="status === 'pending' || status === ''">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button type="success" link @click="setStatus(row, 'approved')">通过</el-button>
            <el-button type="danger" link @click="setStatus(row, 'rejected')">驳回</el-button>
          </template>
          <span v-else>—</span>
        </template>
      </el-table-column>
    </el-table>
    </div>
    
    <div class="pager-box">
      <el-pagination
        class="pager tech-pager"
        v-model:current-page="page"
        v-model:page-size="limit"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Odometer } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const status = ref('pending')

async function load() {
  loading.value = true
  try {
    const q = { page: page.value, limit: limit.value }
    if (status.value) q.status = status.value
    const res = await request.get('/admin/worker-applications', { params: q })
    rows.value = res.data || []
    total.value = res.total || 0
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function setStatus(row, st) {
  ElMessageBox.confirm(`确定将申请 #${row.id} 设为「${st === 'approved' ? '通过' : '驳回'}」？`, '确认', {
    type: 'warning'
  })
    .then(async () => {
      try {
        await request.put(`/admin/worker-applications/${row.id}`, { status: st })
        ElMessage.success('已更新')
        await load()
      } catch (e) {
        ElMessage.error(e.message || '更新失败')
      }
    })
    .catch(() => {})
}

onMounted(load)
</script>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 科技感动态监控板 */
.tech-monitor {
  background: linear-gradient(145deg, #ffffff, #f0f5ff);
  border: 1px solid #d9e8ff;
  border-radius: 12px;
  padding: 20px 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(24, 144, 255, 0.08);
}
.scan-line {
  position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, #1890ff, transparent);
  animation: scanning 3s infinite linear;
}
@keyframes scanning {
  0% { transform: translateY(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(120px); opacity: 0; }
}

.monitor-header {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.pulse-icon {
  font-size: 20px;
  animation: pulse 2s infinite alternate;
}
@keyframes pulse {
  from { text-shadow: 0 0 5px #1890ff; transform: scale(1); }
  to { text-shadow: 0 0 15px #1890ff; transform: scale(1.1); }
}

.monitor-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.metric-box {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e6f7ff;
  box-shadow: inset 0 0 10px rgba(24,144,255,0.02);
}
.m-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 8px;
}
.m-value {
  font-size: 26px;
  font-weight: bold;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  margin-bottom: 12px;
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.unit {
  font-size: 12px;
  font-weight: normal;
  color: #bfbfbf;
}
.glow-blue { color: #1890ff; text-shadow: 0 0 10px rgba(24, 144, 255, 0.2); }
.glow-orange { color: #fa8c16; text-shadow: 0 0 10px rgba(250, 140, 22, 0.2); }
.glow-green { color: #52c41a; text-shadow: 0 0 10px rgba(82, 196, 26, 0.2); }

.progress-track {
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  border-radius: 2px;
  animation: loadBar 2s ease-out forwards;
}
.pb-blue { background: #1890ff; width: 0; animation-name: loadBlue; }
.pb-orange { background: #fa8c16; width: 0; animation-name: loadOrange; }
.pb-green { background: #52c41a; width: 0; animation-name: loadGreen; }
@keyframes loadBlue { to { width: 75%; } }
@keyframes loadOrange { to { width: 45%; } }
@keyframes loadGreen { to { width: 98%; } }

/* 表格与外壳容器 */
.toolbar-box, .table-container, .pager-box {
  background: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}
.pager {
  justify-content: flex-end;
}
:deep(.tech-radio .el-radio-button__inner) {
  border-radius: 4px !important;
  margin-right: 8px;
  border: 1px solid #d9d9d9 !important;
  box-shadow: none !important;
  font-weight: 500;
}
:deep(.tech-radio .el-radio-button.is-active .el-radio-button__inner) {
  background-color: #1890ff;
  border-color: #1890ff !important;
  box-shadow: 0 4px 10px rgba(24,144,255,0.3) !important;
}
</style>
