const util = require('../../utils/util.js');
const { unwrapList } = util;
const api = require('../../api/index.js');

Page({
  data: {
    list: [],
    loading: false,
    emptyTip: '暂无服务订单，去分类服务下单吧'
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
      let res;
      try {
        res = await api.serviceOrder.getMyList({ page: 1, limit: 50 });
      } catch (e1) {
        if (e1 && Number(e1.errno) === 404) {
          res = await api.serviceOrder.getMyList({ page: 1, limit: 50 });
        } else {
          throw e1;
        }
      }
      const raw = unwrapList(res);
      const list = raw.map((o) => ({
        id: o.id,
        orderNo: o.order_no || o.orderNo || '',
        workerUserId: o.worker_user_id != null ? o.worker_user_id : o.worker && o.worker.user_id,
        statusText: o.status_text || o.status_label || o.status || '待处理',
        title: o.service_title || o.title || (o.service && o.service.title) || '到家服务订单',
        time: o.created_at || o.createdAt || '',
        amount: o.amount != null ? o.amount : o.pay_amount
      }));
      this.setData({
        list,
        loading: false,
        emptyTip: '暂无服务订单，去分类服务下单吧'
      });
    } catch (e) {
      this.setData({ loading: false });
      const msg = (e && e.errmsg) || '加载失败';
      if (e && e.errno === 401) {
        this.setData({ list: [], emptyTip: '登录已过期，请重新登录' });
      }
      wx.showToast({ title: msg, icon: 'none' });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    const orderNo = e.currentTarget.dataset.orderno || '';
    if (!id) return;
    let url = `/pages/service-order-detail/service-order-detail?id=${id}`;
    if (orderNo) url += `&orderNo=${encodeURIComponent(orderNo)}`;
    wx.navigateTo({ url });
  }
});
