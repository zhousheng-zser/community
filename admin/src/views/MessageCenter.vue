<template>
  <div class="page-wrap">
    <h2 class="page-title">消息中心</h2>
    <p class="sub">查看站内消息规模，并向全体小程序用户推送系统会话消息（活动、通知等）。</p>

    <el-row :gutter="16" class="mb">
      <el-col :xs="24" :sm="12" :md="8" v-for="card in statCards" :key="card.k">
        <el-card shadow="hover">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-num">{{ overview[card.k] ?? '—' }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header><span>系统广播</span></template>
      <el-alert
        title="将向所有注册用户推送一条系统会话消息，用户「消息」列表中可见；请谨慎操作，避免频繁打扰。"
        type="warning"
        :closable="false"
        show-icon
        class="mb"
      />
      <el-form :model="form" label-width="100px" style="max-width: 560px">
        <el-form-item label="消息类型">
          <el-select v-model="form.botType" placeholder="选择类型" style="width: 100%">
            <el-option label="活动优惠 (event)" value="event" />
            <el-option label="交易物流 (logistics)" value="logistics" />
            <el-option label="服务通知 (service)" value="service" />
          </el-select>
        </el-form-item>
        <el-form-item label="正文内容">
          <el-input v-model="form.content" type="textarea" :rows="5" placeholder="简明扼要，勿含外链钓鱼内容" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="sending" @click="submitBroadcast">发送广播</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const overview = ref({})
const sending = ref(false)
const form = reactive({
  botType: 'event',
  content: ''
})

const statCards = [
  { k: 'total_users', label: '注册用户' },
  { k: 'total_conversations', label: '会话总数' },
  { k: 'user_conversation_mappings', label: '用户会话映射' },
  { k: 'messages_last_24h', label: '近24h新消息条数' },
  { k: 'messages_last_7d', label: '近7天新消息条数' },
  { k: 'open_complaint_tickets', label: '待处理投诉工单' }
]

async function load() {
  try {
    const res = await request.get('/admin/messages/overview')
    overview.value = res.data || {}
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

async function submitBroadcast() {
  if (!form.content.trim()) {
    ElMessage.warning('请填写正文')
    return
  }
  try {
    await ElMessageBox.confirm('确认向全体用户推送该条系统消息？', '确认', { type: 'warning' })
  } catch {
    return
  }
  sending.value = true
  try {
    const res = await request.post('/admin/messages/broadcast', {
      botType: form.botType,
      content: form.content.trim(),
      msgType: 'text'
    })
    const n = res && res.sent_users
    ElMessage.success(n != null ? `广播成功，覆盖约 ${n} 名用户` : '广播已提交')
    form.content = ''
    await load()
  } catch (e) {
    ElMessage.error(e.message || '发送失败')
  } finally {
    sending.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page-wrap {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}
.page-title {
  margin: 0 0 8px;
  font-size: 20px;
}
.sub {
  color: #909399;
  margin: 0 0 20px;
  font-size: 14px;
}
.mb {
  margin-bottom: 20px;
}
.stat-label {
  font-size: 13px;
  color: #909399;
}
.stat-num {
  font-size: 24px;
  font-weight: 700;
  margin-top: 8px;
}
</style>
