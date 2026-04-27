<template>
  <div class="dashboard-wrap">
    <h2>欢迎来到 九州社区 运营中控大屏</h2>
    <el-row :gutter="20" class="card-row">
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <div class="title">今日营收总额</div>
          <div class="number text-danger">￥56,230.00</div>
          <div class="sub">较昨日上涨 15%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <div class="title">新注册达人</div>
          <div class="number text-primary">128 人</div>
          <div class="sub">通过达人带货转化占比 42%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <div class="title">商品在售数</div>
          <div class="number text-success">8,024 件</div>
          <div class="sub">今日上新 12 件</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <div class="title">待审核提现</div>
          <div class="number text-warning">45 笔</div>
          <div class="sub">涉及金额 ￥12,500.00</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图标占位 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <span>本月爆款销量走势 (模拟排版)</span>
        </div>
      </template>
      <div class="fake-chart">
        (这里后续可接入 ECharts 渲染动态柱状图)
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard-wrap { padding: 10px; }
h2 { margin-bottom: 25px; color: #303133; }
.card-row { margin-bottom: 20px; }
.data-card {
  text-align: center;
  padding: 10px 0;
}
.data-card .title { font-size: 14px; color: #909399; margin-bottom: 10px; }
.data-card .number { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
.data-card .sub { font-size: 12px; color: #C0C4CC; }

/* 辅助色彩 */
.text-danger { color: #f56c6c; }
.text-primary { color: #409EFF; }
.text-success { color: #67C23A; }
.text-warning { color: #E6A23C; }

.chart-card {
  margin-top: 30px;
  min-height: 400px;
}
.fake-chart {
  height: 300px;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  border: 1px dashed #dcdfe6;
}
</style>
