const app = getApp();
const util = require('../../../utils/util.js');
const { unwrapList } = util;
const rp = require('../../../utils/rolePortals.js');
const merchantOrderUi = require('../../../utils/merchantOrderUi.js');
const merchantOrderMock = require('../../../utils/merchantOrderMock.js');

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
    isMock: false
  },

  onLoad(options) {
    if (options && options.mock === '1') {
      this._isMockPage = true;
      this.setData({ isMock: true });
    }
    const tab = options && options.tab;
    const allowed = (merchantOrderUi.TAB_DEF || []).map((t) => t.key);
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
    const { fullList, tabKey, keyword } = this.data;
    let base = merchantOrderUi.filterByTab(fullList, tabKey);
    base = merchantOrderUi.filterByKeyword(base, keyword);
    let emptyTip = '当前分类暂无订单';
    const k = (keyword || '').trim();
    if (k && !base.length) emptyTip = '未找到匹配的订单';
    else if (!k && tabKey !== 'all' && !base.length) emptyTip = '当前分类暂无订单';
    else if (!k && tabKey === 'all' && !base.length) emptyTip = '暂无店铺订单';
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

  noop() {},

  openDetail(e) {
    const no = e.currentTarget.dataset.no;
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
      let res;
      try {
        res = await util.get('market/merchant/orders', { page: 1, limit: 100 });
      } catch (e1) {
        if (e1 && (Number(e1.errno) === 404 || Number(e1.errno) === 501)) {
          try {
            res = await util.get('market/shop/orders', { page: 1, limit: 100 });
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
      let emptyTip = '暂无店铺订单';
      if (errno === 404 || errno === 501) {
        emptyTip = '商家订单接口待后端上线，可先使用用户端「集市订单」查看';
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
