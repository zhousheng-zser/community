<template>
  <div class="page-wrap">
    <h2 class="page-title">客服工作台</h2>
    <p class="sub">统一入口处理用户投诉与售后诉求；IM 私聊在小程序端，运营侧以工单与广播为主。</p>

    <el-row :gutter="16">
      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="card-link" @click="$router.push('/complaint-tickets')">
          <el-icon class="ico"><Tickets /></el-icon>
          <div class="t">投诉与售后工单</div>
          <p class="d">查看、跟进、完结工单，与「本地集市」菜单中入口相同。</p>
          <el-button type="primary" link>进入工单列表 →</el-button>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="card-link" @click="$router.push('/message-center')">
          <el-icon class="ico"><ChatDotRound /></el-icon>
          <div class="t">系统消息广播</div>
          <p class="d">向用户推送活动、物流、服务类系统消息。</p>
          <el-button type="primary" link>前往消息中心 →</el-button>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-card shadow="hover">
          <el-icon class="ico"><Phone /></el-icon>
          <div class="t">对外客服电话</div>
          <p class="d">建议在小程序「我的-客服」与店铺页展示统一热线；此处为说明位，号码由运营线下配置。</p>
          <el-tag type="info">400 / 座机请在小程序配置</el-tag>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="mt">
      <template #header>处理建议</template>
      <ol class="tips">
        <li>紧急客诉优先在工单中标记「processing」，并记录回复内容。</li>
        <li>批量活动通知优先使用「消息中心」广播，避免逐个私聊。</li>
        <li>涉及退款请同步「退款中心」与订单状态，保持与用户对齐。</li>
      </ol>
    </el-card>
  </div>
</template>

<script setup>
import { Tickets, ChatDotRound, Phone } from '@element-plus/icons-vue'
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
  margin: 0 0 24px;
  font-size: 14px;
}
.card-link {
  cursor: pointer;
  min-height: 200px;
  transition: box-shadow 0.2s;
}
.card-link:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.ico {
  font-size: 32px;
  color: #cda05b;
  margin-bottom: 12px;
}
.t {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
}
.d {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 12px;
  min-height: 44px;
}
.mt {
  margin-top: 20px;
}
.tips {
  margin: 0;
  padding-left: 20px;
  line-height: 2;
  color: #606266;
  font-size: 14px;
}
</style>
