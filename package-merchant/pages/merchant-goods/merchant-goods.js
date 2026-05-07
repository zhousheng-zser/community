const util = require('../../../utils/util.js');
const { unwrapList } = util;
const rp = require('../../../utils/rolePortals.js');
const mshop = require('../../../utils/merchantShopContext.js');
const api = require('../../../api/index.js');

function mapGoodsRow(g) {
  const id = g.id;
  const title = g.title || g.goods_title || g.name || '商品';
  const stock = g.stock != null ? g.stock : g.inventory != null ? g.inventory : 0;
  const sales = g.sales_count != null ? g.sales_count : g.sales != null ? g.sales : 0;
  const safe = g.safe_stock != null ? g.safe_stock : g.low_stock_threshold != null ? g.low_stock_threshold : 5;
  const onShelf =
    g.status === 'on_sale' ||
    g.is_published === 1 ||
    g.is_published === true ||
    g.on_shelf === true ||
    g.published === true ||
    g.status === 'on_shelf';
  const lowStock = Number(stock) <= Number(safe);
  const rawImg = g.main_image || g.image || '';
  const mainImage = rawImg ? util.imgUrl(rawImg, rawImg) : '';
  const price = g.price != null ? Number(g.price) : NaN;
  const priceText = Number.isFinite(price) ? `¥${price.toFixed(2)}` : '—';
  const descFull = g.description || g.desc || '';
  const descShort =
    descFull.length > 40 ? `${descFull.slice(0, 40)}…` : descFull;
  return {
    id,
    title,
    stock,
    sales,
    safe,
    onShelf: !!onShelf,
    lowStock,
    mainImage,
    hasImage: !!String(rawImg).trim(),
    priceText,
    descShort,
    descForSearch: descFull
  };
}

function sortList(list, mode) {
  const arr = list.slice();
  if (mode === 'sales') {
    arr.sort((a, b) => Number(b.sales) - Number(a.sales));
  } else if (mode === 'stock') {
    arr.sort((a, b) => Number(a.stock) - Number(b.stock));
  }
  return arr;
}

Page({
  data: {
    fullList: [],
    list: [],
    keyword: '',
    onlyLow: false,
    sortMode: 'sales',
    loading: false,
    emptyTip: '暂无商品数据',
    summaryText: '',
    /** 来自首页：up=仅已下架(待上架)，down=仅在售(可下架) */
    shelfMode: '',
    shopId: null,
    shopName: '',
    shopBannerText: '',
    shopWarnText: ''
  },

  onLoad(options) {
    const mode = (options && options.mode) || '';
    if (mode === 'up' || mode === 'down') {
      this.setData({ shelfMode: mode });
    }
  },

  onShow() {
    this.bootstrapShopContextAndLoad();
  },

  applyShopContext() {
    const { shopId, shopName } = mshop.getBoundShop(getApp());
    let shopBannerText = '';
    let shopWarnText = '';
    if (shopId != null && shopId !== '') {
      shopBannerText = shopName ? `当前店铺：${shopName}` : `当前店铺 ID：${shopId}`;
    } else {
      shopWarnText = '未绑定店铺，请先在「店铺入驻与资质」中完成绑定，以便只管理本店商品';
    }
    this.setData({ shopId, shopName, shopBannerText, shopWarnText });
  },

  async bootstrapShopContextAndLoad() {
    this.applyShopContext();
    const { shopId } = this.data;
    if (shopId == null || shopId === '') {
      try {
        const resp = await api.merchant.getShop();
        const shop = (resp && (resp.shop || resp.data || resp)) || {};
        mshop.syncBoundShop(getApp(), shop);
        this.applyShopContext();
      } catch (e) {
        // ignore: keep current warning text
      }
    }
    this.load();
  },

  clearShelfMode() {
    wx.redirectTo({ url: '/package-merchant/pages/merchant-goods/merchant-goods' });
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

  toggleOnlyLow() {
    this.setData({ onlyLow: !this.data.onlyLow });
    this.applyList();
  },

  setSort(e) {
    const mode = e.currentTarget.dataset.mode || 'sales';
    this.setData({ sortMode: mode });
    this.applyList();
  },

  goCreate() {
    wx.navigateTo({
      url: '/package-merchant/pages/merchant-goods-edit/merchant-goods-edit?mode=create'
    });
  },

  applyList() {
    const { fullList, keyword, onlyLow, sortMode, shelfMode } = this.data;
    let base = fullList.slice();
    if (shelfMode === 'up') {
      base = base.filter((x) => !x.onShelf);
    } else if (shelfMode === 'down') {
      base = base.filter((x) => x.onShelf);
    }
    if (onlyLow) base = base.filter((x) => x.lowStock);
    const k = (keyword || '').trim().toLowerCase();
    if (k) {
      base = base.filter(
        (x) =>
          String(x.title).toLowerCase().includes(k) ||
          String(x.id).includes(k) ||
          String(x.descForSearch || '')
            .toLowerCase()
            .includes(k)
      );
    }
    base = sortList(base, sortMode);
    let emptyTip = '暂无商品';
    if (k && !base.length) emptyTip = '未找到匹配商品';
    else if (onlyLow && !base.length) emptyTip = '暂无低库存商品';
    else if (shelfMode === 'up' && !base.length && !k && !onlyLow) {
      emptyTip = '暂无待上架商品，当前均已上架或在售';
    } else if (shelfMode === 'down' && !base.length && !k && !onlyLow) {
      emptyTip = '暂无在售商品，请先将商品上架';
    }
    this.setData({ list: base, emptyTip });
  },

  openRestock(e) {
    const id = e.currentTarget.dataset.id;
    const title = e.currentTarget.dataset.title || '';
    if (id == null) return;
    wx.showModal({
      title: `补货：${title}`,
      editable: true,
      placeholderText: '输入增加的库存数量（正整数）',
      success: (res) => {
        if (!res.confirm) return;
        const n = parseInt(String(res.content || '').trim(), 10);
        if (!Number.isFinite(n) || n <= 0) {
          wx.showToast({ title: '请输入正整数', icon: 'none' });
          return;
        }
        this.submitRestock(id, n);
      }
    });
  },

  async submitRestock(id, qty) {
    try {
      await api.merchant.restockGoods(id, { quantity: qty, qty });
      wx.showToast({ title: '已提交补货', icon: 'success' });
      await this.load();
    } catch (e1) {
      wx.showModal({
        title: '补货失败',
        content: (e1 && e1.errmsg) || '请稍后重试',
        showCancel: false
      });
    }
  },

  async load() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({
        fullList: [],
        list: [],
        emptyTip: '请先登录',
        summaryText: '',
        shopBannerText: '',
        shopWarnText: ''
      });
      return;
    }
    this.setData({ loading: true });
    const { shopId } = mshop.getBoundShop(getApp());
    const goodsParams = mshop.goodsListQuery(shopId);
    try {
      let res;
      try {
        res = await util.get('market/merchant/goods', goodsParams);
      } catch (e1) {
        if (e1 && (Number(e1.errno) === 404 || Number(e1.errno) === 501)) {
          res = await util.get('market/shop/goods', goodsParams);
        } else {
          throw e1;
        }
      }
      let raw = unwrapList(res);
      raw = mshop.filterGoodsByShop(raw, shopId);
      const fullList = raw.map(mapGoodsRow);
      const needRestock = fullList.filter((x) => x.lowStock).length;
      const summaryText =
        fullList.length > 0
          ? `共 ${fullList.length} 个 SKU，低库存 ${needRestock} 个`
          : '';
      this.setData({
        fullList,
        loading: false,
        emptyTip: '暂无商品，请先在后台添加',
        summaryText
      });
      this.applyList();
    } catch (e) {
      this.setData({ loading: false });
      const errno = e && Number(e.errno);
      let emptyTip = '暂无商品数据';
      if (errno === 404 || errno === 501) {
        emptyTip = '商家商品接口待后端上线';
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
      content: next ? '确认上架该商品？用户端将可购买' : '确认下架？用户端将不可购买',
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
      await api.merchant.shelfGoods(id, {
        status: published ? 'on_sale' : 'off_sale',
        published,
        is_published: published ? 1 : 0
      });
      wx.showToast({ title: published ? '已上架' : '已下架', icon: 'success' });
      await this.load();
    } catch (err) {
      wx.showToast({ title: (err && err.errmsg) || '上下架失败', icon: 'none' });
    }
  },

  goHome() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-home') });
  },

  goService() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-service') });
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
      url: `/package-merchant/pages/merchant-goods-edit/merchant-goods-edit?id=${id}`
    });
  }
});
