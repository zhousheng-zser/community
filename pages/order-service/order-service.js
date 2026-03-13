const app = getApp();
const util = require('../../utils/util.js');
Page({
  data: {
    tabs: [
      { key: 'all', label: '全部' }, { key: 'unpaid', label: '待付款' },
      { key: 'waiting', label: '待服务' }, { key: 'serving', label: '服务中' },
      { key: 'review', label: '待评价' }, { key: 'done', label: '已完成' },
      { key: 'cancel', label: '已取消' }, { key: 'refund', label: '已退款' }
    ],
    activeTab: 'all', list: [], loading: false
  },
  onLoad() { this.loadOrders(); },
  onShow() { this.loadOrders(); },
  switchTab(e) { this.setData({ activeTab: e.currentTarget.dataset.key }); this.loadOrders(); },
  loadOrders() {
    this.setData({ loading: true });
    const userId = (app.globalData.user || {}).id;
    if (!userId) { this.setData({ loading: false, list: [] }); return; }
    util.get('orders', { userId, type: 'service', status: this.data.activeTab }).then(data => {
      const list = (Array.isArray(data) ? data : []).map(item => ({
        id: item.id,
        serviceName: item.serviceName || item.title || '服务订单',
        bookTime: item.bookTime || item.createdAt || '',
        address: item.address || item.userAddress || '',
        price: item.price || '0.00',
        statusText: item.statusText || item.stateStr || '待处理',
        statusClass: item.statusClass || 'pending'
      }));
      this.setData({ list, loading: false });
    }).catch(() => { this.setData({ list: [], loading: false }); });
  },
  goDetail(e) {
    wx.navigateTo({ url: '../order-detail/order-detail?id=' + e.currentTarget.dataset.id });
  }
});
