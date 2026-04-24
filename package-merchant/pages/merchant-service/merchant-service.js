const util = require('../../../utils/util.js');
const { unwrapList } = util;
const rp = require('../../../utils/rolePortals.js');

function mapServiceRow(s) {
  const id = s.id;
  const title = s.title || s.service_title || s.name || '服务项目';
  const price = s.price != null ? Number(s.price) : NaN;
  const priceText = Number.isFinite(price) ? `¥${price.toFixed(2)}` : '—';
  const unit = s.unit || s.price_unit || '次';
  const duration = s.duration ? `${s.duration}分钟` : '—';
  const category = s.category || s.service_category || '未分类';
  const onShelf =
    s.is_published === 1 ||
    s.is_published === true ||
    s.on_shelf === true ||
    s.status === 'on_shelf' ||
    s.status === 'active';
  const rawImg = s.main_image || s.image || s.cover || '';
  const mainImage = rawImg ? util.imgUrl(rawImg, rawImg) : '';
  const descFull = s.description || s.desc || '';
  const descShort = descFull.length > 40 ? `${descFull.slice(0, 40)}…` : descFull;
  return {
    id,
    title,
    priceText,
    unit,
    duration,
    category,
    onShelf: !!onShelf,
    mainImage,
    hasImage: !!String(rawImg).trim(),
    descShort,
    descForSearch: descFull
  };
}

Page({
  data: {
    fullList: [],
    list: [],
    keyword: '',
    loading: false,
    emptyTip: '暂无服务项目数据',
    summaryText: ''
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

  applyList() {
    const { fullList, keyword } = this.data;
    let base = fullList.slice();
    const k = (keyword || '').trim().toLowerCase();
    if (k) {
      base = base.filter(
        (x) =>
          String(x.title).toLowerCase().includes(k) ||
          String(x.category).toLowerCase().includes(k) ||
          String(x.descForSearch || '').toLowerCase().includes(k)
      );
    }
    this.setData({ list: base });
  },

  async load() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({
        fullList: [],
        list: [],
        emptyTip: '请先登录',
        summaryText: ''
      });
      return;
    }
    this.setData({ loading: true });
    try {
      let res;
      try {
        res = await util.get('service-provider/my-services', { page: 1, limit: 100 });
      } catch (e1) {
        if (e1 && (Number(e1.errno) === 404 || Number(e1.errno) === 501)) {
          res = await util.get('merchant/services', { page: 1, limit: 100 });
        } else {
          throw e1;
        }
      }
      let raw = unwrapList(res);
      const fullList = raw.map(mapServiceRow);
      const activeCount = fullList.filter((x) => x.onShelf).length;
      const summaryText =
        fullList.length > 0
          ? `共 ${fullList.length} 个服务项目，已上架 ${activeCount} 个`
          : '';
      this.setData({
        fullList,
        loading: false,
        emptyTip: '暂无服务项目，请先添加',
        summaryText
      });
      this.applyList();
    } catch (e) {
      this.setData({ loading: false });
      const errno = e && Number(e.errno);
      let emptyTip = '暂无服务项目数据';
      if (errno === 404 || errno === 501) {
        emptyTip = '服务项目接口待后端上线';
      }
      this.setData({ fullList: [], list: [], emptyTip, summaryText: '' });
      if (errno !== 404 && errno !== 501) {
        wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
      }
    }
  },

  onShelfChange(e) {
    const id = e.currentTarget.dataset.id;
    const wasOn = !!e.currentTarget.dataset.on;
    const next = e.detail.value;
    if (next === wasOn) return;
    wx.showModal({
      title: next ? '上架' : '下架',
      content: next ? '确认上架该服务项目？用户端将可预约' : '确认下架？用户端将不可预约',
      success: (r) => {
        if (r.confirm) {
          this.submitShelf(id, next);
        } else {
          this.load();
        }
      }
    });
  },

  async submitShelf(id, published) {
    try {
      await util.post(`service-provider/services/${id}/shelf`, { published, is_published: published ? 1 : 0 });
      wx.showToast({ title: published ? '已上架' : '已下架', icon: 'success' });
      await this.load();
    } catch (err) {
      try {
        await util.post(`merchant/services/${id}/shelf`, { published });
        wx.showToast({ title: published ? '已上架' : '已下架', icon: 'success' });
        await this.load();
      } catch (e2) {
        wx.showToast({ title: (e2 && e2.errmsg) || '接口待上线', icon: 'none' });
      }
    }
  },

  goHome() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-home') });
  },

  goGoods() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-goods') });
  },

  goOrders() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-orders') });
  },

  goMine() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-mine') });
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    if (id == null) return;
    wx.navigateTo({
      url: `/package-merchant/pages/merchant-service-edit/merchant-service-edit?id=${id}`
    });
  },

  goAdd() {
    wx.navigateTo({
      url: '/package-merchant/pages/merchant-service-edit/merchant-service-edit'
    });
  }
});
