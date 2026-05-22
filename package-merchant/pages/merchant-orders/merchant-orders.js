const app = getApp();
const util = require('../../../utils/util.js');
const { unwrapList } = util;
const rp = require('../../../utils/rolePortals.js');
const merchantOrderUi = require('../../utils/merchantOrderUi.js');
const merchantOrderMock = require('../../utils/merchantOrderMock.js');
const workerOrderUi = require('../../utils/workerOrderUi.js');
const api = require('../../../api/index.js');

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
    tabs: merchantOrderUi.TAB_DEF,
    tabKey: 'all',
    fullList: [],
    list: [],
    keyword: '',
    loading: false,
    emptyTip: '暂无店铺订单',
    summaryLine: '',
    isMock: false,
    directServiceScene: false,
    pageHeroTitle: '店铺订单',
    pageHeroSub: '搜索筛选 · 分状态查看 · 点击卡片处理订单'
  },

  onLoad(options) {
    if (options && options.mock === '1') {
      this._isMockPage = true;
      this.setData({ isMock: true });
    }
    if (options && options.scene === 'direct_service') {
      this._directServiceScene = true;
      this.setData({
        directServiceScene: true,
        tabs: workerOrderUi.TAB_DEF,
        tabKey: 'all',
        emptyTip: '暂无直约服务订单',
        pageHeroTitle: '直约服务订单',
        pageHeroSub: '到家打包单 · 接单后与用户消息同步'
      });
    }
    const tab = options && options.tab;
    const allowed = (this.data.tabs || []).map((t) => t.key);
    if (tab && allowed.indexOf(tab) !== -1) {
      this.setData({ tabKey: tab });
    }
  },

  onShow() {
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value || '' });
    this.applyList();
  },

  clearSearch() {
    this.setData({ keyword: '' });
    this.applyList();
  },

  onTab(e) {
    const tabKey = e.currentTarget.dataset.key || 'all';
    this.setData({ tabKey });
    this.applyList();
  },

  applyList() {
    const { fullList, tabKey, keyword, directServiceScene } = this.data;
    let base = directServiceScene
      ? workerOrderUi.filterByTab(fullList, tabKey)
      : merchantOrderUi.filterByTab(fullList, tabKey);
    base = directServiceScene
      ? this._filterDirectKeyword(base, keyword)
      : merchantOrderUi.filterByKeyword(base, keyword);
    let emptyTip = '当前分类暂无订单';
    const k = (keyword || '').trim();
    if (k && !base.length) emptyTip = '未找到匹配的订单';
    else if (!k && tabKey !== 'all' && !base.length) emptyTip = '当前分类暂无订单';
    else if (!k && tabKey === 'all' && !base.length)
      emptyTip = directServiceScene ? '暂无直约服务订单' : '暂无店铺订单';
    const tabLabel = (this.data.tabs || []).find((t) => t.key === tabKey);
    const tabName = tabLabel ? tabLabel.label : '全部';
    const summaryLine =
      base.length > 0
        ? `${tabName} · 共 ${base.length} 笔`
        : keyword.trim()
          ? '无匹配结果'
          : `${tabName} · 暂无数据`;
    this.setData({ list: base, emptyTip, summaryLine });
  },

  noop() { },

  _filterDirectKeyword(list, keyword) {
    const k = (keyword || '').trim().toLowerCase();
    if (!k) return list;
    return list.filter((it) => {
      const title = String(it.title || '').toLowerCase();
      const no = String(it.orderNo != null ? it.orderNo : '');
      const st = String(it.statusText || '').toLowerCase();
      return title.includes(k) || no.toLowerCase().includes(k) || st.includes(k);
    });
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    const no = e.currentTarget.dataset.no;
    if (this._directServiceScene && id != null && id !== '') {
      wx.navigateTo({
        url: `/package-worker/pages/worker-order-detail/worker-order-detail?id=${encodeURIComponent(id)}&portal=merchant`
      });
      return;
    }
    if (no == null || no === '') return;
    const mock = (this.data.isMock || this._isMockPage) ? '&mock=1' : '';
    wx.navigateTo({
      url: `/pages/market-order-detail/market-order-detail?orderNo=${encodeURIComponent(no)}${mock}&from=merchant`
    });
  },

  async contactBuyer(e) {
    const { no, buyerId, buyerName } = e.currentTarget.dataset;
    const shopId = app.globalData.user && (app.globalData.user.shop_id || app.globalData.user.shopId);
    if (!shopId) {
      wx.showToast({ title: '请先绑定店铺', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '打开会话', mask: true });
    try {
      const res = await util.post('messages/order-conversation/ensure', {
        order_no: no,
        shop_id: shopId,
        channel: 'shop_buyer',
        buyer_user_id: buyerId,
        buyer_name: buyerName || ''
      });
      wx.hideLoading();
      const data = res && res.data !== undefined ? res.data : res;
      const cid = data && data.conversation_id;
      if (!cid) {
        wx.showToast({ title: '无法建立会话', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/pages/chat/chat?conversationId=${cid}&name=${encodeURIComponent(buyerName || '买家')}&orderNo=${encodeURIComponent(no)}`
      });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '暂无法打开会话', icon: 'none' });
    }
  },

  async contactRider(e) {
    const { no, riderId, riderName } = e.currentTarget.dataset;
    const shopId = app.globalData.user && (app.globalData.user.shop_id || app.globalData.user.shopId);
    if (!shopId) {
      wx.showToast({ title: '请先绑定店铺', icon: 'none' });
      return;
    }
    if (!riderId) {
      wx.showToast({ title: '暂无骑手信息', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '打开会话', mask: true });
    try {
      const res = await util.post('messages/order-conversation/ensure', {
        order_no: no,
        shop_id: shopId,
        channel: 'shop_rider',
        rider_user_id: riderId,
        rider_name: riderName || '骑手'
      });
      wx.hideLoading();
      const data = res && res.data !== undefined ? res.data : res;
      const cid = data && data.conversation_id;
      if (!cid) {
        wx.showToast({ title: '无法建立会话', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/pages/chat/chat?conversationId=${cid}&name=${encodeURIComponent(riderName || '骑手')}&orderNo=${encodeURIComponent(no)}`
      });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '暂无法打开会话', icon: 'none' });
    }
  },

  openRiderLocation(e) {
    const no = e.currentTarget.dataset.no;
    const shopId = app.globalData.user && (app.globalData.user.shop_id || app.globalData.user.shopId);
    if (!no) return;
    wx.navigateTo({
      url: `/pages/rider-location/rider-location?orderNo=${encodeURIComponent(no)}&shopId=${shopId != null ? encodeURIComponent(shopId) : ''}`
    });
  },

  async acceptOrder(e) {
    const orderNo = e.currentTarget.dataset.no;
    if (!orderNo) return;
    wx.showModal({
      title: '确认接单',
      content: '确认接受此订单吗？接单后请尽快备货发货。',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中', mask: true });
            await api.merchant.acceptOrder(orderNo);
            wx.hideLoading();
            wx.showToast({ title: '接单成功', icon: 'success' });
            this.load();
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: (err && err.errmsg) || '接单失败', icon: 'none' });
          }
        }
      }
    });
  },

  shipOrder(e) {
    const orderNo = e.currentTarget.dataset.no;
    if (!orderNo) return;
    wx.navigateTo({
      url: `/package-merchant/pages/merchant-ship/merchant-ship?orderNo=${encodeURIComponent(orderNo)}`
    });
  },

  handleRefund(e) {
    const orderNo = e.currentTarget.dataset.no;
    const refundId = e.currentTarget.dataset.refundid;
    if (!orderNo) return;
    wx.navigateTo({
      url: `/package-merchant/pages/merchant-refund-handle/merchant-refund-handle?orderNo=${encodeURIComponent(orderNo)}&refundId=${refundId || ''}`
    });
  },

  cancelOrder(e) {
    const orderNo = e.currentTarget.dataset.no;
    if (!orderNo) return;
    wx.showModal({
      title: '确认取消订单',
      content: '取消后系统将自动退款给买家，确认取消吗？',
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中', mask: true });
            await api.merchant.cancelOrder(orderNo);
            wx.hideLoading();
            wx.showToast({ title: '订单已取消', icon: 'success' });
            this.load();
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: (err && err.errmsg) || '取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  rejectOrder(e) {
    const orderNo = e.currentTarget.dataset.no;
    if (!orderNo) return;
    wx.showModal({
      title: '确认不接单',
      content: '不接单将直接退款并通知用户，确认继续？',
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中', mask: true });
            await api.merchant.orderAction(orderNo, { action: 'reject', note: '商家不接单' });
            wx.hideLoading();
            wx.showToast({ title: '已拒单并退款', icon: 'success' });
            this.load();
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: (err && err.errmsg) || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  chooseDelivery(e) {
    const orderNo = e.currentTarget.dataset.no;
    if (!orderNo) return;
    wx.navigateTo({
      url: `/package-merchant/pages/merchant-delivery-choose/merchant-delivery-choose?orderNo=${encodeURIComponent(orderNo)}`
    });
  },

  viewDeliveryProgress(e) {
    const orderNo = e.currentTarget.dataset.no;
    if (!orderNo) return;
    wx.navigateTo({
      url: `/pages/market-order-detail/market-order-detail?orderNo=${encodeURIComponent(orderNo)}&from=merchant`
    });
  },

  startDelivery(e) {
    const orderNo = e.currentTarget.dataset.no;
    if (!orderNo) return;
    this.chooseDelivery(e);
  },

  completeDelivery(e) {
    const orderNo = e.currentTarget.dataset.no;
    if (!orderNo) return;
    wx.navigateTo({
      url: `/package-merchant/pages/merchant-ship/merchant-ship?orderNo=${encodeURIComponent(orderNo)}&mode=delivered`
    });
  },

  // ── 直约服务商专属操作（directServiceScene 模式）────────────────────────
  spAcceptOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认接单', content: '接单后请尽快安排上门服务', confirmText: '接单',
      success: async (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: '处理中', mask: true });
        try {
          await api.serviceProvider.acceptOrder(id);
          wx.hideLoading();
          wx.showToast({ title: '已接单', icon: 'success' });
          this.load();
        } catch (err) { wx.hideLoading(); wx.showToast({ title: (err && err.errmsg) || '接单失败', icon: 'none' }); }
      }
    });
  },

  spRejectOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认拒单', content: '拒单后将自动退款给用户，确认拒单？', confirmText: '拒单', confirmColor: '#e74c3c',
      success: async (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: '处理中', mask: true });
        try {
          await api.serviceProvider.orderAction(id, { action: 'reject' });
          wx.hideLoading();
          wx.showToast({ title: '已拒单并退款', icon: 'success' });
          this.load();
        } catch (err) { wx.hideLoading(); wx.showToast({ title: (err && err.errmsg) || '操作失败', icon: 'none' }); }
      }
    });
  },

  spStartService(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认到达', content: '确认您已到达服务现场，开始服务？',
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
          wx.showToast({ title: '已开始服务', icon: 'success' });
          this.load();
        } catch (err) { wx.hideLoading(); wx.showToast({ title: (err && err.errmsg) || '操作失败', icon: 'none' }); }
      }
    });
  },

  spCompleteService(e) {
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
            try {
              const resData = await util.uploadFile('service-provider-portal/upload', p, 'file');
              const url = resData && (resData.url || resData.path || resData.data);
              if (url) uploaded.push(util.imgUrl(url));
            } catch (e2) { console.warn('proof upload fail', e2); }
          }
          await api.serviceProvider.orderAction(id, { action: 'complete', proof_images: uploaded });
          wx.hideLoading();
          wx.showToast({ title: '服务已完成', icon: 'success' });
          this.load();
        } catch (err) { wx.hideLoading(); wx.showToast({ title: (err && err.errmsg) || '操作失败', icon: 'none' }); }
      }
    });
  },
  // ── end SP actions ────────────────────────────────────────────────────────

  _enrichDirectServiceRow(o) {
    const SP_STATUS_TEXT = {
      pending_pay: '待支付',
      pending_accept: '待接单',
      paid_pending_dispatch: '待上门',
      dispatched: '已派单',
      in_service: '服务中',
      pending_user_confirm: '待确认完成',
      completed: '已完成',
      cancelled: '已取消',
      closed: '已关闭',
      refunded: '已退款'
    };
    // bucket 与 workerOrderUi.TAB_DEF 的 key 对齐，用于 tab 筛选和卡片颜色
    const SP_STATUS_BUCKET = {
      pending_pay: 'unpaid',
      pending_accept: 'pending_accept',
      paid_pending_dispatch: 'pending_visit',
      dispatched: 'pending_visit',
      in_service: 'in_service',
      pending_user_confirm: 'done',
      completed: 'done',
      cancelled: 'cancel',
      closed: 'cancel',
      refunded: 'cancel'
    };
    const status = o.status || '';
    const statusText = SP_STATUS_TEXT[status] || o.status_text || status;
    const bucket = SP_STATUS_BUCKET[status] || 'pending';
    const orderNo = o.order_no || o.orderNo || String(o.id);
    const title = o.service_title || o.title || o.goods_name || '到家服务';
    const rawAmt = o.pay_amount != null ? o.pay_amount : o.amount;
    let amount = '';
    if (rawAmt != null && rawAmt !== '') {
      const n = parseFloat(String(rawAmt), 10);
      amount = Number.isFinite(n) ? n.toFixed(2) : String(rawAmt);
    }
    const time = o.created_at || o.createdAt || '';
    const timeDisplay =
      time && String(time).length > 19
        ? String(time).slice(0, 16).replace('T', ' ')
        : String(time || '').replace('T', ' ');
    const buyerHint =
      o.contact_name || (o.buyer && (o.buyer.nickname || o.buyer.phone)) || '';
    const buyerUserId = o.user_id != null ? o.user_id : o.buyer_user_id;
    return {
      id: o.id,
      orderNo,
      statusText,
      status,          // 保留原始 status 供操作按钮判断
      title,
      time,
      timeDisplay: timeDisplay || '—',
      bucket,
      amount,
      qtyText: '',
      buyerHint,
      buyerUserId,
      riderUserId: null,
      riderName: '',
      raw: o
    };
  },

  async load() {
    if (this.data.isMock || this._isMockPage) {
      if (!this.data.isMock) this.setData({ isMock: true });
      this.setData({ loading: true, summaryLine: '' });
      const raw = merchantOrderMock.getMockListRaw();
      const fullList = raw.map((o) => merchantOrderUi.enrichItem(o));
      this.setData({ fullList, loading: false });
      this.applyList();
      return;
    }
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ fullList: [], list: [], emptyTip: '请先登录', loading: false, summaryLine: '' });
      return;
    }
    this.setData({ loading: true, summaryLine: '' });
    try {
      if (this._directServiceScene) {
        let res;
        try {
          // 使用服务商工作台 API 获取订单（与 sp-orders.js 统一接口）
          res = await api.serviceProvider.getOrders({ page: 1, limit: 100 });
        } catch (e1) {
          if (e1 && (Number(e1.errno) === 404 || Number(e1.errno) === 501)) {
            res = { list: [] };
          } else {
            throw e1;
          }
        }
        const raw = unwrapList(res);
        const fullList = raw.map((o) => this._enrichDirectServiceRow(o));
        this.setData({ fullList, loading: false });
        this.applyList();
        return;
      }
      let res;
      try {
        res = await api.merchant.getOrders({ page: 1, limit: 100 });
      } catch (e1) {
        if (e1 && (Number(e1.errno) === 404 || Number(e1.errno) === 501)) {
          try {
            res = await api.merchant.getShopOrderList({ page: 1, limit: 100 });
          } catch (e2) {
            throw e2;
          }
        } else {
          throw e1;
        }
      }
      const raw = unwrapList(res);
      const fullList = raw.map((o) => merchantOrderUi.enrichItem(o));
      this.setData({ fullList, loading: false });
      this.applyList();
    } catch (e) {
      this.setData({ loading: false });
      const errno = e && Number(e.errno);
      let emptyTip = this._directServiceScene ? '暂无直约服务订单' : '暂无店铺订单';
      if (errno === 404 || errno === 501) {
        emptyTip = this._directServiceScene
          ? '直约服务订单接口待后端上线'
          : '商家订单接口待后端上线，可先使用用户端「购物订单」查看';
      } else if (errno === 401) {
        emptyTip = '登录已过期，请从用户端重新登录';
      } else if (errno === 403) {
        emptyTip = '无商家权限，请先完成入驻并通过审核';
      }
      this.setData({ fullList: [], list: [], emptyTip });
      if (errno !== 404 && errno !== 501) {
        wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
      }
    }
  },

  goHome() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-home') });
  },

  goService() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-service') });
  },

  goMine() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-mine') });
  }
});
