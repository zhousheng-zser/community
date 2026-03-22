const app = getApp();
const util = require('../../utils/util.js');
const marketPay = require('../../utils/marketPay.js');

Page({
  data: {
    orderNo: '',
    order: null,
    items: [],
    autoRefreshTimer: null,
    autoRefreshTimes: 0
  },

  onLoad(options) {
    const orderNo = options.orderNo || options.order_no || '';
    this.setData({ orderNo });
    this.loadOrder(orderNo);
    this.startAutoRefresh(orderNo);
  },

  onUnload() {
    const timer = this.data.autoRefreshTimer;
    if (timer) {
      clearTimeout(timer);
    }
  },

  async loadOrder(orderNo) {
    if (!orderNo) return;
    try {
      const res = await util.get(`market/orders/${orderNo}`);
      const data = res && res.data ? res.data : res;
      const order = (data && data.order) ? data.order : data;
      const items = (data && Array.isArray(data.items)) ? data.items : [];

      // 统一字段名，避免前端模板里写过多兜底
      const normalizedOrder = {
        order_status: order.order_status || order.orderStatus || '',
        pay_status: order.pay_status || order.payStatus || '',
        goods_amount: order.goods_amount,
        delivery_fee: order.delivery_fee,
        discount_amount: order.discount_amount,
        payable_amount: order.payable_amount,
        receiver_name: order.receiver_name,
        receiver_phone: order.receiver_phone,
        receiver_address: order.receiver_address
      };

      this.setData({
        order,
        items,
        ...normalizedOrder
      });

      return normalizedOrder;
    } catch (e) {
      wx.showToast({ title: '订单加载失败', icon: 'none' });
      return null;
    }
  },

  async startAutoRefresh(orderNo) {
    // 避免用户触发回调稍晚导致“已支付但页面还显示 unpaid”
    const maxTimes = 20;
    const intervalMs = 2000;
    let count = 0;

    const tick = async () => {
      count += 1;
      const normalized = await this.loadOrder(orderNo);
      const orderStatus = normalized && normalized.order_status;
      const payStatus = normalized && normalized.pay_status;

      if (orderStatus === 'paid' && payStatus === 'paid') {
        return;
      }

      if (count >= maxTimes) {
        return;
      }
      const timer = setTimeout(tick, intervalMs);
      this.setData({ autoRefreshTimer: timer, autoRefreshTimes: count });
    };

    tick();
  },

  itemImage(item) {
    return item.goods_image_snapshot || item.goodsImageSnapshot || item.image || '';
  },

  /** 待支付订单：再次调起微信支付（与确认页共用 marketPay，避免无入口） */
  async payNow() {
    const { orderNo } = this.data;
    if (!orderNo) return;
    await marketPay.startMarketPaymentFlow(orderNo, {
      redirectToDetail: false,
      onPaid: () => this.loadOrder(orderNo)
    });
  },

  async cancelOrder() {
    const { orderNo } = this.data;
    if (!orderNo) return;
    wx.showLoading({ title: '取消中...', mask: true });
    try {
      await util.post(`market/orders/${orderNo}/cancel`, {});
      wx.hideLoading();
      wx.showToast({ title: '取消成功', icon: 'none' });
      await this.loadOrder(orderNo);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '取消失败', icon: 'none' });
    }
  }
});

