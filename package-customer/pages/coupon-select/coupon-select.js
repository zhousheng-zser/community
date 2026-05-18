const api = require('../../../api/index.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    orderAmount: '0',
    from: '',
    list: [],
    loading: true,
    selectedId: 0
  },

  onLoad(options) {
    const orderAmount = options.order_amount || options.orderAmount || '0';
    const from = options.from || '';
    const cached = wx.getStorageSync('checkout_selected_coupon');
    const selectedId = cached && cached.id ? Number(cached.id) : 0;
    this.setData({ orderAmount, from, selectedId });
    this.loadList();
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const res = await api.coupon.getAvailableCouponsForOrder({
        order_amount: this.data.orderAmount
      });
      const raw = (res && res.list) || (res && res.data && res.data.list) || [];
      const list = raw.map((item) => {
        const end = item.end_time || item.endTime;
        let end_time_text = '';
        if (end) {
          try {
            end_time_text = util.formatTime(new Date(end)).split(' ')[0];
          } catch (e) {
            end_time_text = String(end).slice(0, 10);
          }
        }
        return {
          ...item,
          coupon_money: item.coupon_money != null ? item.coupon_money : item.discount_amount,
          threshold_amount: item.threshold_amount != null ? item.threshold_amount : 0,
          end_time_text
        };
      });
      this.setData({ list, loading: false });
    } catch (e) {
      this.setData({ list: [], loading: false });
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
    }
  },

  pick(e) {
    const id = Number(e.currentTarget.dataset.id);
    this.setData({ selectedId: id });
  },

  clearPick() {
    wx.removeStorageSync('checkout_selected_coupon');
    wx.navigateBack();
  },

  confirm() {
    const id = this.data.selectedId;
    const item = this.data.list.find((x) => Number(x.id) === id);
    if (!item) {
      wx.showToast({ title: '请选择优惠券', icon: 'none' });
      return;
    }
    wx.setStorageSync('checkout_selected_coupon', {
      id: item.id,
      coupon_name: item.coupon_name,
      coupon_money: item.coupon_money,
      threshold_amount: item.threshold_amount
    });
    wx.navigateBack();
  }
});
