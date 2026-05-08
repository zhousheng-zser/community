const util = require('../../../utils/util.js');
const { unwrapList } = util;
const rp = require('../../../utils/rolePortals.js');
const workerOrderUi = require('../../utils/workerOrderUi.js');

Page({
  data: {
    tabs: workerOrderUi.TAB_DEF,
    tabKey: 'all',
    fullList: [],
    list: [],
    keyword: '',
    loading: false,
    emptyTip: '暂无技工订单'
  },

  onLoad(options) {
    if (options.tab) {
      this.setData({ tabKey: options.tab });
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
    let base = workerOrderUi.filterByTab(fullList, tabKey);
    const k = (keyword || '').trim().toLowerCase();
    if (k) {
      base = base.filter((it) => {
        const title = String(it.title || '').toLowerCase();
        const id = String(it.id != null ? it.id : '');
        const st = String(it.statusText || '').toLowerCase();
        return title.includes(k) || id.includes(k) || st.includes(k);
      });
    }
    let emptyTip = '当前分类暂无订单';
    if (k && !base.length) emptyTip = '未找到匹配的订单，试试其他关键词';
    else if (!k && tabKey !== 'all' && !base.length) emptyTip = '当前分类暂无订单';
    else if (!k && tabKey === 'all' && !base.length) emptyTip = '暂无技工订单';
    this.setData({ list: base, emptyTip });
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id == null) return;
    wx.navigateTo({
      url: `/package-worker/pages/worker-order-detail/worker-order-detail?id=${id}`
    });
  },

  async load() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({
        fullList: [],
        list: [],
        emptyTip: '请先登录',
        loading: false
      });
      return;
    }
    this.setData({ loading: true });
    try {
      let res;
      try {
        res = await util.get('worker/service-orders', { page: 1, limit: 100 });
      } catch (e1) {
        if (e1 && (Number(e1.errno) === 404 || Number(e1.errno) === 501)) {
          try {
            res = await util.get('worker/orders', { page: 1, limit: 100 });
          } catch (e2) {
            throw e2;
          }
        } else {
          throw e1;
        }
      }
      const raw = unwrapList(res);
      const fullList = raw.map((o) => workerOrderUi.enrichOrderItem(o));
      this.setData({
        fullList,
        loading: false
      });
      this.applyList();
    } catch (e) {
      this.setData({ loading: false });
      const errno = e && Number(e.errno);
      let emptyTip = '暂无技工订单';
      if (errno === 404 || errno === 501) {
        emptyTip = '技工订单接口待后端上线，请稍后再试';
      } else if (errno === 401) {
        emptyTip = '登录已过期，请从用户端重新登录';
      } else if (errno === 403) {
        emptyTip = '无技工权限，请先完成入驻并通过审核';
      }
      this.setData({ fullList: [], list: [], emptyTip });
      if (errno !== 404 && errno !== 501) {
        wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
      }
    }
  },

  goHome() {
    wx.redirectTo({ url: rp.workerTabUrl('worker-home') });
  },

  goMine() {
    wx.redirectTo({ url: rp.workerTabUrl('worker-mine') });
  }
});
