const util = require('../../utils/util.js');
const { unwrapList } = util;

Page({
  data: {
    list: [],
    loading: true,
    err: ''
  },
  onShow() {
    this.load();
  },
  async load() {
    this.setData({ loading: true, err: '' });
    try {
      const res = await util.get('benefit/orders', { page: 1, limit: 50 });
      const list = unwrapList(res);
      this.setData({ list, loading: false });
    } catch (e) {
      this.setData({
        list: [],
        loading: false,
        err: '暂无线上订单数据，可前往惠民卡频道选购'
      });
    }
  },
  goBenefit() {
    wx.navigateTo({ url: '/pages/push-channel/push-channel' });
  }
});
