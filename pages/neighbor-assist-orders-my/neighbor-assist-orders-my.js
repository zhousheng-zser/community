const util = require('../../utils/util.js');
const { unwrapList } = util;

Page({
  data: {
    tab: 'published',
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

  setTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.tab) return;
    this.setData({ tab }, () => this.load());
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/neighbor-assist-order-detail/neighbor-assist-order-detail?id=${id}`
    });
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/order-publish/order-publish' });
  },

  async load() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ list: [], emptyTip: '登录后查看订单' });
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const { tab } = this.data;
    const role = tab === 'published' ? 'publisher' : 'helper';
    this.setData({ loading: true });
    try {
      const res = await util.get('neighbor-assist/orders/my', {
        page: 1,
        limit: 50,
        role
      });
      const raw = unwrapList(res);
      const list = raw.map((o) => ({
        id: o.id,
        statusText: o.status_text || o.status_label || o.status || '待处理',
        title: (o.assist_type_label || o.content || o.title || o.assist_type || '邻里帮帮').slice(0, 40),
        type: o.assist_type_label || o.assist_type || '',
        time: o.created_at || o.createdAt || '',
        amount: o.reward_amount != null ? o.reward_amount : o.amount,
        payStatus: o.pay_status || o.payStatus || 'unpaid',
        roleTag: tab === 'published' ? '我发布' : '我接单'
      }));
      this.setData({
        list,
        loading: false,
        emptyTip: tab === 'published' ? '暂无发布的帮帮需求' : '暂无接单记录'
      });
    } catch (e) {
      this.setData({ loading: false });
      const msg = (e && e.errmsg) || '加载失败';
      if (e && Number(e.errno) === 404) {
        this.setData({
          list: [],
          emptyTip: '接口未上线（404）：GET neighbor-assist/orders/my?role=publisher|helper'
        });
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
