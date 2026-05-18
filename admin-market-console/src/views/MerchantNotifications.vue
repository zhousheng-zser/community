<template>
  <div class="merchant-page">
    <h1 class="merchant-page-title">消息说明</h1>
    <p class="merchant-page-desc">商家后台聚焦订单与商品；「消息」类通知在小程序与系统侧同步，此处说明渠道。</p>

    <el-card class="merchant-card" shadow="never">
      <el-timeline>
        <el-timeline-item timestamp="订单动态" placement="top">
          <p>新订单、付款、退款、取消等请在 <el-button link type="primary" @click="$router.push('/orders')">订单与履约</el-button> 查看与处理。</p>
        </el-timeline-item>
        <el-timeline-item timestamp="系统通知" placement="top">
          <p>平台公告、活动广播通过小程序「消息」列表推送；若需面向顾客发营销内容，请与运营确认后由平台统一广播。</p>
        </el-timeline-item>
        <el-timeline-item timestamp="支付流水" placement="top">
          <p>微信支付对账请在 <el-button link type="primary" @click="$router.push('/payments')">支付与对账</el-button> 中核对。</p>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup></script>

<style scoped>
.merchant-card {
  padding: 8px 16px 16px;
  max-width: 800px;
}
p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.7;
}
</style>
