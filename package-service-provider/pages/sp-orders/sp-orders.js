const util = require('../../../utils/util.js');
const rp = require('../../../utils/rolePortals.js');

Page({
  data: {
    orders: [],
    activeTab: 'all',
    loading: false,
    page: 1,
    hasMore: true
  },

  onLoad(options) {
    this.setData({ activeTab: options.tab || 'all' });
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadOrders().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadOrders(true);
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab, page: 1, orders: [] });
    this.loadOrders();
  },

  async loadOrders(append) {
    this.setData({ loading: true });
    try {
      const params = { page: this.data.page, limit: 20 };
      if (this.data.activeTab !== 'all') {
        params.status = this.data.activeTab;
      }
      const res = await util.get('service-provider/orders', params);
      const data = res && res.data !== undefined ? res.data : res;
      const list = (data.list || data || []).map(o => ({
        id: o.id,
        orderNo: o.order_no || o.orderNo || String(o.id),
        serviceTitle: o.service_title || o.title || '到家服务',
        amount: o.pay_amount != null ? parseFloat(o.pay_amount).toFixed(2) : '0.00',
        bookTime: o.book_time || o.appointment_time || '',
        contactName: o.contact_name || '',
        address: o.address || o.service_address || '',
        statusText: o.status_text || o.statusText || '',
        status: o.status || '',
        workerName: o.worker_name || o.workerName || '',
        createdAt: o.created_at || ''
      }));
      this.setData({
        orders: append ? [...this.data.orders, ...list] : list,
        hasMore: list.length >= 20,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false, orders: [] });
    }
  },

  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/package-worker/pages/worker-order-detail/worker-order-detail?id=${orderId}&portal=sp`
    });
  },

  goHome() {
    wx.redirectTo({ url: '/package-service-provider/pages/sp-home/sp-home' });
  },

  goDispatch() {
    wx.navigateTo({ url: '/package-service-provider/pages/sp-dispatch/sp-dispatch' });
  },

  goServices() {
    wx.navigateTo({ url: '/package-service-provider/pages/sp-services/sp-services' });
  },

  goMine() {
    wx.navigateTo({ url: '/package-service-provider/pages/sp-mine/sp-mine' });
  }
});
