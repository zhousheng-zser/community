const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    orderNo: '',
    order: null,
    items: []
  },

  onLoad(options) {
    const orderNo = options.orderNo || options.order_no || '';
    this.setData({ orderNo });
    this.loadOrder(orderNo);
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
    } catch (e) {
      wx.showToast({ title: '订单加载失败', icon: 'none' });
    }
  },

  itemImage(item) {
    return item.goods_image_snapshot || item.goodsImageSnapshot || item.image || '';
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

