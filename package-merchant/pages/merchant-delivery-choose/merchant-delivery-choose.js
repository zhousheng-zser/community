const api = require('../../../api/index.js');

const PROVIDER_STYLE = {
  self: { icon: '🛵', color: '#ff7a00' },
  meituan: { icon: '🟡', color: '#ffc300' },
  eleme: { icon: '🔵', color: '#0097ff' }
};

Page({
  data: {
    orderNo: '',
    loading: true,
    submitting: false,
    deliveryMode: 'express',
    currentCarrier: '',
    providers: [],
    mockMode: false,
    selected: ''
  },

  onLoad(options) {
    const orderNo = options.orderNo || '';
    this.setData({ orderNo });
    if (orderNo) this.loadOptions();
  },

  async loadOptions() {
    this.setData({ loading: true });
    try {
      const res = await api.merchant.getDeliveryOptions(this.data.orderNo);
      const data = res.data || res;
      const list = (data.providers || []).map((p) => ({
        ...p,
        icon: (PROVIDER_STYLE[p.code] && PROVIDER_STYLE[p.code].icon) || '📦',
        color: (PROVIDER_STYLE[p.code] && PROVIDER_STYLE[p.code].color) || '#666'
      }));
      this.setData({
        loading: false,
        deliveryMode: data.delivery_mode || 'express',
        currentCarrier: data.current_carrier || '',
        providers: list,
        mockMode: !!data.mock_mode,
        selected: data.current_carrier || ''
      });
    } catch (e) {
      this.setData({ loading: false, providers: [] });
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
    }
  },

  onSelect(e) {
    const code = e.currentTarget.dataset.code;
    if (!code || this.data.submitting) return;
    this.setData({ selected: code });
  },

  async onConfirm() {
    const { orderNo, selected, submitting, currentCarrier } = this.data;
    if (submitting) return;
    if (!selected) {
      wx.showToast({ title: '请选择配送方式', icon: 'none' });
      return;
    }
    if (currentCarrier && currentCarrier === selected) {
      wx.navigateTo({
        url: `/pages/market-order-detail/market-order-detail?orderNo=${encodeURIComponent(orderNo)}&from=merchant`
      });
      return;
    }
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中' });
    try {
      await api.merchant.launchDelivery(orderNo, { provider: selected });
      wx.hideLoading();
      wx.showToast({ title: '配送已发起', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/market-order-detail/market-order-detail?orderNo=${encodeURIComponent(orderNo)}&from=merchant`
        });
      }, 500);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: (e && e.errmsg) || (e && e.message) || '发起失败', icon: 'none' });
      this.setData({ submitting: false });
    }
  },

  viewTrack() {
    const { orderNo } = this.data;
    wx.navigateTo({
      url: `/pages/market-order-detail/market-order-detail?orderNo=${encodeURIComponent(orderNo)}&from=merchant`
    });
  }
});
