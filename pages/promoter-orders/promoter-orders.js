const util = require('../../utils/util.js');
const api = require('../../api/index.js');
const { unwrapList } = util;

Page({
  data: {
    tab: 'all',
    list: [],
    loading: true
  },
  onShow() {
    this.load();
  },
  setTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab }, () => this.load());
  },
  async load() {
    this.setData({ loading: true });
    try {
      const res = await api.promoter.getOrders({ page: 1, limit: 100, status: this.data.tab });
      const list = unwrapList(res);
      this.setData({ list, loading: false });
    } catch (e) {
      console.log('推客订单加载失败', e);
      this.setData({
        list: [],
        loading: false
      });
    }
  },
  goAccount() {
    wx.navigateTo({ url: '/pages/account/account' });
  },
  goGorder() {
    wx.navigateTo({ url: '/pages/gorder-list/gorder-list' });
  }
});
