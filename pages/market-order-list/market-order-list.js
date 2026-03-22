const util = require('../../utils/util.js');

const STATUS_LABEL = {
  pending_payment: '待付款',
  paid: '已支付',
  delivering: '配送中',
  completed: '已完成',
  cancelled: '已取消',
  closed: '已关闭'
};

function statusClass(orderStatus) {
  if (orderStatus === 'completed') return 'done';
  if (orderStatus === 'cancelled' || orderStatus === 'closed') return 'cancel';
  if (orderStatus === 'pending_payment') return 'pending';
  return 'pending';
}

Page({
  data: {
    tabs: [
      { key: 'all', label: '全部', status: '' },
      { key: 'pending_payment', label: '待付款', status: 'pending_payment' },
      { key: 'paid', label: '已支付', status: 'paid' },
      { key: 'completed', label: '已完成', status: 'completed' },
      { key: 'cancelled', label: '已取消', status: 'cancelled' }
    ],
    activeTab: 'all',
    list: [],
    loading: false
  },

  onLoad() {
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeTab: key });
    this.loadOrders();
  },

  extractList(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.list)) return payload.list;
    if (payload && payload.data && Array.isArray(payload.data.list)) return payload.data.list;
    if (payload && payload.data && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  normalizeRow(raw) {
    const o = raw && (raw.order || raw);
    if (!o) return null;
    const orderNo = o.order_no || o.orderNo || raw.order_no;
    if (!orderNo) return null;
    const orderStatus = o.order_status || o.orderStatus || '';
    return {
      id: orderNo,
      orderNo,
      title: raw.shop_name || o.shop_name || '家集市订单',
      sub: `订单号 ${orderNo}`,
      amount: String(o.payable_amount != null ? o.payable_amount : o.amount || raw.payable_amount || '0.00'),
      orderStatus,
      statusText: STATUS_LABEL[orderStatus] || orderStatus || '-',
      statusClass: statusClass(orderStatus),
      time: o.created_at || o.createdAt || raw.created_at || ''
    };
  },

  async loadOrders() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ list: [], loading: false });
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const tab = this.data.tabs.find((t) => t.key === this.data.activeTab) || this.data.tabs[0];
    const query = { page: 1, page_size: 50 };
    if (tab.status) query.status = tab.status;

    this.setData({ loading: true });
    try {
      const res = await util.get('market/orders/my', query);
      const payload = res && res.data != null ? res.data : res;
      const arr = this.extractList(payload);
      const list = arr.map((row) => this.normalizeRow(row)).filter(Boolean);
      this.setData({ list, loading: false });
    } catch (e) {
      console.warn('market/orders/my', e);
      this.setData({ list: [], loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  goDetail(e) {
    const orderNo = e.currentTarget.dataset.orderno;
    if (!orderNo) return;
    wx.navigateTo({
      url: `../market-order-detail/market-order-detail?orderNo=${orderNo}`
    });
  }
});
