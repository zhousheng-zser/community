const util = require('../../../utils/util.js');
const rp = require('../../../utils/rolePortals.js');
const api = require('../../../api/index.js');
const config = require('../../../utils/config.js');

const STATUS_TEXT = {
  pending_pay: '待支付',
  pending_accept: '待接单',
  paid_pending_dispatch: '待派单',
  dispatched: '已派单',
  in_service: '服务中',
  pending_user_confirm: '待确认完成',
  completed: '已完成',
  cancelled: '已取消',
  closed: '已关闭'
};

function mapOrder(o) {
  return {
    id: o.id,
    orderNo: o.order_no || o.orderNo || String(o.id),
    serviceTitle: o.service_title || o.title || '到家服务',
    amount: o.pay_amount != null ? parseFloat(o.pay_amount).toFixed(2)
      : (o.amount != null ? parseFloat(o.amount).toFixed(2) : '0.00'),
    bookTime: o.appointment_time || o.book_time || '',
    contactName: o.contact_name || '',
    contactPhone: o.contact_phone || '',
    address: o.address || o.service_address || '',
    status: o.status || '',
    statusText: STATUS_TEXT[o.status] || o.status_text || o.statusText || o.status || '处理中',
    workerName: o.worker_name || (o.assigned_worker && o.assigned_worker.name) || '',
    createdAt: o.created_at || '',
    qty: o.qty || 1
  };
}

// Upload a proof image for evidence
function extractUploadUrl(up) {
  if (!up) return '';
  if (typeof up === 'string') { const s = up.trim(); if (s.startsWith('/') || /^https?:\/\//i.test(s)) return s; }
  if (typeof up === 'object') { for (const k of ['url', 'path', 'file_url']) { if (up[k]) return String(up[k]).trim(); } }
  return '';
}
async function uploadProof(filePath) {
  const base = String(config.baseUrl || '').replace(/\/$/, '');
  const token = wx.getStorageSync('token');
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${base}/upload`, filePath, name: 'file', formData: { type: 'evidence' },
      header: { Authorization: token ? `Bearer ${token}` : '' },
      success: (res) => {
        const raw = String(res.data || '');
        let parsed = null; try { parsed = JSON.parse(raw); } catch (e) {}
        const got = extractUploadUrl(parsed) || extractUploadUrl(parsed && parsed.data);
        if (got && (res.statusCode === 200 || res.statusCode === 201)) return resolve(got);
        reject({ errmsg: `上传失败(${res.statusCode})` });
      },
      fail: (e) => reject(e || { errmsg: '上传失败' })
    });
  });
}

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (loc) => resolve(loc || {}),
      fail: (err) => reject(err || new Error('getLocation failed'))
    });
  });
}

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

  onShow() { this.setData({ page: 1 }); this.loadOrders(); },
  onPullDownRefresh() { this.setData({ page: 1 }); this.loadOrders().finally(() => wx.stopPullDownRefresh()); },
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
      if (this.data.activeTab !== 'all') params.status = this.data.activeTab;
      const res = await api.serviceProvider.getOrders(params);
      const data = res && res.data !== undefined ? res.data : res;
      const rawList = data && data.list ? data.list : (Array.isArray(data) ? data : []);
      const list = rawList.map(mapOrder);
      this.setData({
        orders: append ? [...this.data.orders, ...list] : list,
        hasMore: list.length >= 20,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      if (!append) this.setData({ orders: [] });
    }
  },

  // 接单
  acceptOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认接单', content: '接单后您将承接该服务请求，确认接单？', confirmText: '接单',
      success: async (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: '处理中', mask: true });
        try {
          await api.serviceProvider.acceptOrder(id);
          wx.hideLoading();
          wx.showToast({ title: '已接单', icon: 'success' });
          this.setData({ page: 1 });
          this.loadOrders();
        } catch (err) { wx.hideLoading(); wx.showToast({ title: (err && err.errmsg) || '操作失败', icon: 'none' }); }
      }
    });
  },

  // 拒单
  rejectOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '拒绝接单', content: '拒绝后将自动退款给用户，确认拒单？', confirmText: '拒单', confirmColor: '#e74c3c',
      success: async (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: '处理中', mask: true });
        try {
          // SP orders use 'cancel' or 'reject' — try both
          await api.serviceProvider.orderAction(id, { action: 'reject' })
            .catch(() => api.serviceProvider.orderAction(id, { action: 'cancel' }));
          wx.hideLoading();
          wx.showToast({ title: '已拒单', icon: 'success' });
          this.setData({ page: 1 });
          this.loadOrders();
        } catch (err) { wx.hideLoading(); wx.showToast({ title: (err && err.errmsg) || '操作失败', icon: 'none' }); }
      }
    });
  },

  // 打卡到达
  checkIn(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认打卡', content: '确认您已到达服务现场？',
      success: async (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: '处理中', mask: true });
        try {
          const loc = await getCurrentLocation();
          const payload = {
            note: '服务商已到达服务现场',
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
            accuracy: Number(loc.accuracy || 0)
          };
          if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
            throw { errmsg: '定位失败，请开启定位权限后重试' };
          }
          await api.serviceProvider.checkIn(id, payload);
          wx.hideLoading();
          wx.showToast({ title: '打卡成功', icon: 'success' });
          this.setData({ page: 1 });
          this.loadOrders();
        } catch (err) { wx.hideLoading(); wx.showToast({ title: (err && err.errmsg) || '操作失败', icon: 'none' }); }
      }
    });
  },

  // 上传凭证并完成
  completeWithEvidence(e) {
    const id = e.currentTarget.dataset.id;
    wx.chooseImage({
      count: 3, sizeType: ['compressed'], sourceType: ['camera', 'album'],
      success: async (res) => {
        const paths = (res.tempFilePaths || []).filter(Boolean);
        if (!paths.length) return;
        wx.showLoading({ title: '上传中', mask: true });
        try {
          const uploaded = [];
          for (const p of paths) {
            try { const url = await uploadProof(p); if (url) uploaded.push(util.imgUrl(url)); } catch (e) {}
          }
          await api.serviceProvider.completeOrder(id, { proof_images: uploaded, note: '服务完成' });
          wx.hideLoading();
          wx.showToast({ title: '服务已完成', icon: 'success' });
          this.setData({ page: 1 });
          this.loadOrders();
        } catch (err) { wx.hideLoading(); wx.showToast({ title: (err && err.errmsg) || '操作失败', icon: 'none' }); }
      }
    });
  },

  viewOrderDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/package-worker/pages/worker-order-detail/worker-order-detail?id=${id}&portal=sp` });
  },

  goHome() { wx.redirectTo({ url: '/package-service-provider/pages/sp-home/sp-home' }); },
  goDispatch() { wx.navigateTo({ url: '/package-service-provider/pages/sp-dispatch/sp-dispatch' }); },
  goServices() { wx.navigateTo({ url: '/package-service-provider/pages/sp-services/sp-services' }); },
  goMine() { wx.navigateTo({ url: '/package-service-provider/pages/sp-mine/sp-mine' }); },
  noop() {}
});
