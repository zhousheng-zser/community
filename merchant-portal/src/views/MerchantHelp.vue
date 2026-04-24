<template>
  <div class="merchant-page">
    <h1 class="merchant-page-title">客服与帮助</h1>
    <p class="merchant-page-desc">店铺经营问题、活动报名、违规申诉等，请通过下列渠道联系平台运营。</p>

    <el-row :gutter="16">
      <el-col :xs="24" :md="12">
        <div class="panel merchant-card">
          <h3>平台运营支持</h3>
          <p>商户账号、结算、活动资源由九州社区运营侧统一配置；本页为说明入口，不提供在线聊天。</p>
          <ul>
            <li>店铺资质、类目变更：联系对接运营或提交工单（由运营在后台登记）。</li>
            <li>技术故障：请说明店铺编号、发生时间与截图。</li>
          </ul>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="panel merchant-card">
          <h3>顾客咨询</h3>
          <p>买家咨询、售后、退款请用户在 <strong>小程序订单/消息</strong> 中发起；您可在「订单与履约」中处理订单状态。</p>
          <el-alert type="info" :closable="false" show-icon title="商家后台无法代收用户 IM，避免隐私泄露。" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup></script>

<style scoped>
.panel {
  padding: 22px;
  min-height: 220px;
}
.panel h3 {
  margin: 0 0 12px;
  font-size: 16px;
}
.panel p,
.panel li {
  color: #606266;
  font-size: 14px;
  line-height: 1.7;
}
.panel ul {
  margin: 12px 0 0;
  padding-left: 18px;
}
</style>
