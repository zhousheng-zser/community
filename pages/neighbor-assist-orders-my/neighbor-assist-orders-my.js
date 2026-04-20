const util = require('../../utils/util.js');
const { unwrapList } = util;

Page({
  data: {
    list: [],
    loading: false,
    emptyTip: '暂无帮帮订单'
  },

  onShow() {
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ list: [], emptyTip: '登录后查看订单' });
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      const res = await util.get('neighbor-assist/orders/my', { page: 1, limit: 50 });
      const raw = unwrapList(res);
      const list = raw.map((o) => ({
        id: o.id,
        statusText: o.status_text || o.status_label || o.status || '待处理',
        title: o.assist_type || o.title || '邻里帮帮',
        time: o.created_at || o.createdAt || '',
        amount: o.amount != null ? o.amount : ''
      }));
      this.setData({
        list,
        loading: false,
        emptyTip: '暂无帮帮订单'
      });
    } catch (e) {
      this.setData({ loading: false });
      const msg = (e && e.errmsg) || '加载失败';
      if (e && Number(e.errno) === 404) {
        this.setData({ list: [], emptyTip: '帮帮订单接口未开放（404），请后端部署 GET neighbor-assist/orders/my' });
        wx.showToast({ title: '接口未上线', icon: 'none' });
        return;
      }
      if (e && e.errno === 401) {
        this.setData({ list: [], emptyTip: '登录已过期，请重新登录' });
      }
      wx.showToast({ title: msg, icon: 'none' });
    }
  }
});
