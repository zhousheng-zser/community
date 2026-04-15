<template>
  <div class="enterprise-dashboard">
    <!-- 顶部欢迎语 (背景现在由全局 Layout 提供) -->
    <div class="top-banner-content">
      <div class="banner-inner">
        <div class="banner-title">
          <h2>九州社区 · 运营大数据管理平台</h2>
          <p>持续监控平台交易链路，实时呈现各项业务核心流转数据</p>
        </div>
        <div class="banner-status">
          <div class="status-pill">
            <span class="status-dot"></span> 系统运行正常
          </div>
        </div>
      </div>
    </div>

    <!-- 主体内容区，向上浮动覆盖在Banner下方 -->
    <div class="dashboard-main">
      <p v-if="loadError" class="error-msg">{{ loadError }}</p>

      <!-- 核心指标卡片 -->
      <div v-loading="loading" class="data-cards">
        <!-- 营收 -->
        <div class="data-card">
          <div class="card-top">
            <div class="card-title">今日商圈营收 (元)</div>
            <div class="card-icon blue"><el-icon><DataLine /></el-icon></div>
          </div>
          <div class="card-middle">
            <div class="card-value">￥{{ fmtMoney(stats.revenue_today) }}</div>
          </div>
          <div class="card-bottom">
            <span class="bottom-label">当日已支付订单总额</span>
            <span class="highlight-tag blue">资金流</span>
          </div>
        </div>

        <!-- 订单 -->
        <div class="data-card">
          <div class="card-top">
            <div class="card-title">今日新订单数 (笔)</div>
            <div class="card-icon purple"><el-icon><ShoppingCart /></el-icon></div>
          </div>
          <div class="card-middle">
            <div class="card-value">{{ stats.orders_today ?? '—' }}</div>
          </div>
          <div class="card-bottom">
            <span class="bottom-label">今日集市实时生成订单</span>
            <span class="highlight-tag purple">交易活跃</span>
          </div>
        </div>

        <!-- 商品 -->
        <div class="data-card">
          <div class="card-top">
            <div class="card-title">在售商品总量 (件)</div>
            <div class="card-icon green"><el-icon><Goods /></el-icon></div>
          </div>
          <div class="card-middle">
            <div class="card-value">{{ stats.goods_on_sale ?? '—' }}</div>
          </div>
          <div class="card-bottom">
            <span class="bottom-label">本地集市已上架商品池</span>
            <span class="highlight-tag green">销售中</span>
          </div>
        </div>

        <!-- 审核 -->
        <div class="data-card">
          <div class="card-top">
            <div class="card-title">待处理审核业务 (项)</div>
            <div class="card-icon orange"><el-icon><WarnTriangleFilled /></el-icon></div>
          </div>
          <div class="card-middle">
            <div class="card-value">{{ pendingTotal }}</div>
          </div>
          <div class="card-bottom">
            <span class="bottom-label">技工申请 {{ stats.pending_worker_apps ?? 0 }} / 店铺入驻 {{ stats.pending_market_apps ?? 0 }}</span>
            <span class="highlight-tag orange">需人工介入</span>
          </div>
        </div>
      </div>

      <!-- 次要基础数据统计 -->
      <div class="section-title">基础规模盘点</div>
      <div class="secondary-cards">
        <div class="sub-card">
          <div class="sub-icon-box"><el-icon><UserFilled /></el-icon></div>
          <div class="sub-text">
            <div class="sub-title">平台总注册用户数量</div>
            <div class="sub-value">{{ stats.users_total ?? '—' }}</div>
          </div>
        </div>

        <div class="sub-card">
          <div class="sub-icon-box"><el-icon><Shop /></el-icon></div>
          <div class="sub-text">
            <div class="sub-title">已正式上线营业店铺</div>
            <div class="sub-value">{{ stats.shops_total ?? '—' }}</div>
          </div>
        </div>

        <div class="sub-card">
          <div class="sub-icon-box"><el-icon><SuccessFilled /></el-icon></div>
          <div class="sub-text">
            <div class="sub-title">今日成功支付流水笔数</div>
            <div class="sub-value">{{ stats.payments_success_today ?? '—' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { DataLine, ShoppingCart, Goods, WarnTriangleFilled, UserFilled, Shop, SuccessFilled } from '@element-plus/icons-vue'
import request from '../utils/request'

const loading = ref(true)
const loadError = ref('')
const stats = ref({})

const pendingTotal = computed(() => {
  const a = Number(stats.value.pending_worker_apps) || 0
  const b = Number(stats.value.pending_market_apps) || 0
  return a + b
})

function fmtMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return '0.00'
  return Number(n).toFixed(2)
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await request.get('/admin/stats/overview')
    stats.value = res.data || {}
  } catch (e) {
    loadError.value = e.message || '系统连接异常，未能获取最新指标'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
/* 容器基调 */
.enterprise-dashboard {
  position: relative;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* 顶部内容区域 (重用全局背景) */
.top-banner-content {
  position: relative;
  padding: 10px 10px 20px;
  color: #262626;
}
.banner-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  max-width: 1600px;
  margin: 0 auto;
}
.banner-title h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 10px 0;
  letter-spacing: 1px;
}
.banner-title p {
  color: #595959;
  font-size: 14px;
  margin: 0;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  color: #595959;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}
.status-dot {
  width: 8px;
  height: 8px;
  background-color: #52c41a;
  border-radius: 50%;
  margin-right: 8px;
  box-shadow: 0 0 5px #52c41a;
}
/* 主体内容区 */
.dashboard-main {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 10px;
  position: relative;
  z-index: 3;
}

.error-msg {
  color: #f5222d;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

/* 数据卡片排版 */
.data-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}
.data-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
}
.data-card:hover {
  box-shadow: 0 8px 20px 0 rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #8c8c8c;
  font-size: 14px;
}
.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #f5f5f5;
}
.card-icon.blue { color: #1890ff; background: #e6f7ff; }
.card-icon.purple { color: #722ed1; background: #f9f0ff; }
.card-icon.green { color: #52c41a; background: #f6ffed; }
.card-icon.orange { color: #fa8c16; background: #fff7e6; }

.card-middle {
  margin: 16px 0;
}
.card-value {
  font-size: 30px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #262626;
  font-weight: 500;
  line-height: 1;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
  font-size: 12px;
  color: #8c8c8c;
}
.highlight-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.highlight-tag.blue { color: #1890ff; background: #e6f7ff; border: 1px solid #91d5ff; }
.highlight-tag.purple { color: #722ed1; background: #f9f0ff; border: 1px solid #d3adf7; }
.highlight-tag.green { color: #52c41a; background: #f6ffed; border: 1px solid #b7eb8f; }
.highlight-tag.orange { color: #fa8c16; background: #fff7e6; border: 1px solid #ffd591; }


/* 二级标题与副卡片 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 20px;
  border-left: 4px solid #1890ff;
  padding-left: 10px;
}
.secondary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.sub-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
}
.sub-icon-box {
  width: 48px;
  height: 48px;
  background: #f0f5ff;
  color: #2f54eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 20px;
}
.sub-title {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 4px;
}
.sub-value {
  font-size: 22px;
  color: #262626;
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .data-cards { grid-template-columns: repeat(2, 1fr); }
  .secondary-cards { grid-template-columns: repeat(1, 1fr); }
}
</style>
