const util = require('../../../utils/util.js');
const app = getApp();

Page({
  data: {
    pendingOrders: [],
    availableWorkers: [],
    selectedOrderId: '',
    selectedWorkerId: '',
    showDispatchModal: false,
    loading: true,
    workersLoading: false
  },

  onLoad() {
    this.loadPendingOrders();
  },

  onShow() {
    this.loadPendingOrders();
  },

  async loadPendingOrders() {
    this.setData({ loading: true });
    try {
      const res = await util.get('merchant/service-orders', { status: 'pending_accept', page: 1, limit: 50 });
      const raw = res && res.data !== undefined ? res.data : res;
      const list = (raw.list || raw || []).map(o => ({
        id: o.id,
        orderNo: o.order_no || o.orderNo || String(o.id),
        serviceTitle: o.service_title || o.title || '到家服务',
        amount: o.pay_amount != null ? parseFloat(o.pay_amount).toFixed(2) : '0.00',
        bookTime: o.book_time || o.appointment_time || '',
        contactName: o.contact_name || '',
        address: o.address || o.service_address || '',
        statusText: o.status_text || o.statusText || '待接单',
        createdAt: o.created_at || ''
      }));
      this.setData({ pendingOrders: list, loading: false });
    } catch (err) {
      this.setData({ loading: false, pendingOrders: [] });
      wx.showToast({ title: '加载订单失败', icon: 'none' });
    }
  },

  async loadWorkers() {
    this.setData({ workersLoading: true });
    try {
      const res = await util.get('core/workers', { status: 'approved', page: 1, limit: 100 });
      const raw = res && res.data !== undefined ? res.data : res;
      const list = (raw.list || raw || []).map(w => ({
        id: w.id,
        name: w.user_name || w.name || w.userName || '未知技工',
        avatar: w.avatar || w.user_photo || '',
        status: w.status || w.worker_status || '',
        tags: w.tags || w.skills || [],
        completedOrders: w.completed_orders || w.completedOrders || 0,
        rating: w.rating || 0
      })).filter(w => w.status === 'approved' || w.status === 'active');
      this.setData({ availableWorkers: list, workersLoading: false });
    } catch (err) {
      this.setData({ workersLoading: false, availableWorkers: [] });
      wx.showToast({ title: '加载技工列表失败', icon: 'none' });
    }
  },

  openDispatchModal(e) {
    const orderId = e.currentTarget.dataset.id;
    this.setData({
      selectedOrderId: orderId,
      selectedWorkerId: '',
      showDispatchModal: true
    });
    if (this.data.availableWorkers.length === 0) {
      this.loadWorkers();
    }
  },

  closeDispatchModal() {
    this.setData({ showDispatchModal: false });
  },

  selectWorker(e) {
    const workerId = e.currentTarget.dataset.id;
    this.setData({ selectedWorkerId: workerId });
  },

  async confirmDispatch() {
    const { selectedOrderId, selectedWorkerId } = this.data;
    if (!selectedOrderId) {
      wx.showToast({ title: '订单ID缺失', icon: 'none' });
      return;
    }
    if (!selectedWorkerId) {
      wx.showToast({ title: '请选择技工', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '派单中', mask: true });
    try {
      await util.post(`merchant/service-orders/${selectedOrderId}/dispatch`, {
        worker_id: selectedWorkerId
      });
      wx.hideLoading();
      wx.showToast({ title: '派单成功', icon: 'success' });
      this.setData({ showDispatchModal: false });
      this.loadPendingOrders();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: (err && err.errmsg) || '派单失败', icon: 'none' });
    }
  },

  async acceptOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    if (!orderId) return;
    wx.showModal({
      title: '确认接单',
      content: '确认由服务商自行处理此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中', mask: true });
            await util.post(`merchant/service-orders/${orderId}/accept`, {});
            wx.hideLoading();
            wx.showToast({ title: '接单成功', icon: 'success' });
            this.loadPendingOrders();
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: (err && err.errmsg) || '接单失败', icon: 'none' });
          }
        }
      }
    });
  },

  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/package-worker/pages/worker-order-detail/worker-order-detail?id=${orderId}&portal=merchant`
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
