const util = require('../../utils/util.js');
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
      const res = await util.get('promoter/orders', { page: 1, limit: 100, status: this.data.tab });
      const list = unwrapList(res);
      this.setData({ list, loading: false });
    } catch (e) {
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
