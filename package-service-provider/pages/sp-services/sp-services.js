const util = require('../../../utils/util.js');
const api = require('../../../api/index.js');
const { unwrapList } = util;

function mapServiceRow(s) {
  const id = s.id;
  const title = s.title || s.service_title || s.name || '服务项目';
  const price = s.price != null ? Number(s.price) : NaN;
  const priceText = Number.isFinite(price) ? `¥${price.toFixed(2)}` : '—';
  const unit = s.unit || s.price_unit || '次';
  const sales = s.sales_count != null ? s.sales_count : s.order_count != null ? s.order_count : 0;
  const onShelf = s.is_published === 1 || s.is_published === true || s.on_shelf === true || s.status === 'on_shelf' || s.status === 'active';
  const rawImg = s.cover_image || s.main_image || s.image || s.cover || '';
  const mainImage = rawImg ? util.imgUrl(rawImg, rawImg) : '';
  const descFull = s.description || s.desc || '';
  const descShort = descFull.length > 50 ? `${descFull.slice(0, 50)}…` : descFull;
  const category = s.category_key || (s.category && s.category.name) || s.service_category || '未分类';
  return { id, title, priceText, price: Number.isFinite(price) ? price : 0, unit, sales, onShelf: !!onShelf, mainImage, hasImage: !!String(rawImg).trim(), descShort, descForSearch: descFull, category };
}

function sortList(list, mode) {
  const arr = list.slice();
  if (mode === 'sales') arr.sort((a, b) => Number(b.sales) - Number(a.sales));
  else if (mode === 'price') arr.sort((a, b) => Number(a.price) - Number(b.price));
  return arr;
}

Page({
  data: {
    fullList: [],
    list: [],
    keyword: '',
    sortMode: 'sales',
    loading: false,
    emptyTip: '暂无服务项目数据',
    summaryText: '',
    shelfMode: ''
  },

  onLoad(options) {
    const mode = (options && options.mode) || '';
    if (mode === 'up' || mode === 'down') {
      this.setData({ shelfMode: mode });
    }
  },

  onShow() { this.load(); },

  onPullDownRefresh() { this.load().finally(() => wx.stopPullDownRefresh()); },

  clearShelfMode() {
    wx.redirectTo({ url: '/package-service-provider/pages/sp-services/sp-services' });
  },

  onSearchInput(e) { this.setData({ keyword: e.detail.value || '' }); this.applyList(); },

  clearSearch() { this.setData({ keyword: '' }); this.applyList(); },

  setSort(e) {
    const mode = e.currentTarget.dataset.mode || 'sales';
    this.setData({ sortMode: mode });
    this.applyList();
  },

  applyList() {
    const { fullList, keyword, sortMode, shelfMode } = this.data;
    let base = fullList.slice();
    if (shelfMode === 'up') base = base.filter((x) => !x.onShelf);
    else if (shelfMode === 'down') base = base.filter((x) => x.onShelf);
    const k = (keyword || '').trim().toLowerCase();
    if (k) {
      base = base.filter((x) =>
        String(x.title).toLowerCase().includes(k) ||
        String(x.category).toLowerCase().includes(k) ||
        String(x.descForSearch || '').toLowerCase().includes(k)
      );
    }
    base = sortList(base, sortMode);
    let emptyTip = '暂无服务项目';
    if (k && !base.length) emptyTip = '未找到匹配服务';
    else if (shelfMode === 'up' && !base.length && !k) emptyTip = '暂无待上架服务，当前均已上架';
    else if (shelfMode === 'down' && !base.length && !k) emptyTip = '暂无在售服务，请先将服务上架';
    this.setData({ list: base, emptyTip });
  },

  async load() {
    const token = wx.getStorageSync('token');
    if (!token) { this.setData({ fullList: [], list: [], emptyTip: '请先登录', summaryText: '' }); return; }
    this.setData({ loading: true });
    try {
      const res = await api.serviceProvider.getServices({ page: 1, limit: 100 });
      let raw = res && res.list ? res.list : (res && res.data && res.data.list ? res.data.list : (Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : [])));
      const fullList = raw.map(mapServiceRow);
      const activeCount = fullList.filter((x) => x.onShelf).length;
      const summaryText = fullList.length > 0 ? `共 ${fullList.length} 个服务项目，已上架 ${activeCount} 个` : '';
      this.setData({ fullList, loading: false, summaryText });
      this.applyList();
    } catch (e) {
      this.setData({ loading: false });
      const errno = e && Number(e.errno);
      let emptyTip = '暂无服务项目数据';
      if (errno === 403) emptyTip = '请先完成服务商入驻';
      this.setData({ fullList: [], list: [], emptyTip, summaryText: '' });
      if (errno !== 404 && errno !== 501) wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
    }
  },

  onShelfChange(e) {
    const id = e.currentTarget.dataset.id;
    const wasOn = !!e.currentTarget.dataset.on;
    const next = e.detail.value;
    if (next === wasOn) return;
    wx.showModal({
      title: next ? '上架' : '下架',
      content: next ? '确认上架该服务？用户端将可预约' : '确认下架？用户端将不可预约',
      success: (r) => { if (r.confirm) this.submitShelf(id, next); else this.load(); }
    });
  },

  async submitShelf(id, published) {
    try {
      await api.serviceProvider.shelfService(id, { is_published: published ? 1 : 0, published });
      wx.showToast({ title: published ? '已上架' : '已下架', icon: 'success' });
      await this.load();
    } catch (e) {
      wx.showToast({ title: (e && e.errmsg) || '操作失败', icon: 'none' });
    }
  },

  goHome() { wx.redirectTo({ url: '/package-service-provider/pages/sp-home/sp-home' }); },
  goOrders() { wx.navigateTo({ url: '/package-merchant/pages/merchant-orders/merchant-orders?scene=direct_service' }); },
  goMine() { wx.navigateTo({ url: '/package-service-provider/pages/sp-mine/sp-mine' }); },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    if (id == null) return;
    wx.navigateTo({ url: `/package-service-provider/pages/sp-services-edit/sp-services-edit?id=${id}` });
  },

  goAdd() {
    wx.navigateTo({ url: '/package-service-provider/pages/sp-services-edit/sp-services-edit?mode=create' });
  }
});
