<template>
  <div class="hub">
    <p class="hint">常用模块入口，与侧栏一致，便于快速跳转。</p>
    <el-row :gutter="16">
      <el-col v-for="item in links" :key="item.path" :xs="24" :sm="12" :md="8" :lg="6">
        <router-link :to="item.path" class="card-link">
          <el-card shadow="hover" class="card">
            <div class="title">{{ item.title }}</div>
            <div class="desc">{{ item.desc }}</div>
          </el-card>
        </router-link>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
const links = [
  { path: '/dashboard', title: '工作台', desc: '核心指标与快捷入口' },
  { path: '/user-management', title: '用户管理', desc: 'C 端用户检索' },
  { path: '/market-orders', title: '集市订单', desc: '订单列表与详情' },
  { path: '/market-shops', title: '店铺', desc: '店铺管理' },
  { path: '/message-center', title: '消息中心', desc: '广播与概览' },
  { path: '/customer-service', title: '客服工作台', desc: '会话与工单' },
  { path: '/local-goods-home/hot_zone', title: '本地商城榜单', desc: '24个榜单分表管理' },
  { path: '/refund-center', title: '退款中心', desc: '退款审核' },
  { path: '/settlement-center', title: '结算中心', desc: '对账结算' },
  { path: '/system-status', title: '系统状态', desc: '进程与内存' }
]
</script>

<style scoped>
.hub {
  max-width: 1200px;
}
.hint {
  color: #8c8c8c;
  font-size: 14px;
  margin: 0 0 20px;
}
.card-link {
  display: block;
  text-decoration: none;
  color: inherit;
  margin-bottom: 16px;
}
.card {
  min-height: 100px;
  cursor: pointer;
}
.title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
  color: #262626;
}
.desc {
  font-size: 13px;
  color: #8c8c8c;
}
</style>
