const util = require('../../../utils/util.js');

const PLACEHOLDER = '/img/market_icons/supermarket.png';

function clampInt(n, min, max) {
  let v = parseInt(String(n), 10);
  if (!Number.isFinite(v)) v = min;
  if (v < min) v = min;
  if (v > max) v = max;
  return v;
}

Page({
  data: {
    id: null,
    loading: true,
    saving: false,
    title: '',
    mainImagePath: '',
    coverDisplay: PLACEHOLDER,
    priceInput: '',
    stock: 0,
    safeStock: 5,
    description: '',
    descLen: 0
  },

  onLoad(options) {
    const id = options && (options.id != null ? options.id : options.goodsId);
    if (id == null || id === '') {
      wx.showToast({ title: '缺少商品', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 400);
      return;
    }
    this.setData({ id: String(id) });
    this.load();
  },

  applyCoverDisplay(path) {
    const p = path && String(path).trim();
    if (!p) {
      this.setData({ coverDisplay: PLACEHOLDER });
      return;
    }
    this.setData({ coverDisplay: util.imgUrl(p, p) });
  },

  async load() {
    const { id } = this.data;
    this.setData({ loading: true });
    try {
      let wrap;
      try {
        wrap = await util.get(`market/merchant/goods/${id}`);
      } catch (e1) {
        if (e1 && (Number(e1.errno) === 404 || Number(e1.errno) === 501)) {
          wrap = await util.get(`market/shop/goods/${id}`);
        } else {
          throw e1;
        }
      }
      const g = (wrap && wrap.goods) || wrap || {};
      const rawPath = g.main_image || g.image || '';
      const stock = g.stock != null ? g.stock : g.inventory != null ? g.inventory : 0;
      const safe =
        g.safe_stock != null ? g.safe_stock : g.low_stock_threshold != null ? g.low_stock_threshold : 5;
      const price = g.price != null ? Number(g.price) : NaN;
      const title = g.title || g.goods_title || g.name || '';
      const description = g.description || g.desc || '';
      const priceInput = Number.isFinite(price) ? String(price) : '';
      this.setData({
        loading: false,
        title,
        mainImagePath: rawPath ? String(rawPath).trim() : '',
        stock: clampInt(stock, 0, 999999),
        safeStock: clampInt(safe, 0, 999999),
        priceInput,
        description,
        descLen: String(description).length
      });
      this.applyCoverDisplay(rawPath);
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value || '' });
  },

  onPriceInput(e) {
    this.setData({ priceInput: e.detail.value || '' });
  },

  onDescInput(e) {
    const description = e.detail.value || '';
    this.setData({ description, descLen: description.length });
  },

  onStockInput(e) {
    const stock = clampInt(e.detail.value, 0, 999999);
    this.setData({ stock });
  },

  onSafeInput(e) {
    const safeStock = clampInt(e.detail.value, 0, 999999);
    this.setData({ safeStock });
  },

  stockMinus() {
    this.setData({ stock: Math.max(0, this.data.stock - 1) });
  },

  stockPlus() {
    this.setData({ stock: Math.min(999999, this.data.stock + 1) });
  },

  previewCover() {
    const { mainImagePath, coverDisplay } = this.data;
    const cur = mainImagePath ? coverDisplay : PLACEHOLDER;
    wx.previewImage({ current: cur, urls: [cur] });
  },

  clearCover() {
    this.setData({ mainImagePath: '' });
    this.applyCoverDisplay('');
  },

  chooseCover() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const path = (res.tempFilePaths && res.tempFilePaths[0]) || '';
        if (!path) return;
        wx.showLoading({ title: '上传中', mask: true });
        try {
          const up = await util.uploadFile('messages/upload', path, 'file');
          const url =
            typeof up === 'string'
              ? up
              : (up && (up.url || up.path || up.file_url)) || '';
          if (!url) {
            wx.showToast({ title: '上传无返回地址', icon: 'none' });
            return;
          }
          const normalized = util.normalizeServerImagePath
            ? util.normalizeServerImagePath(url)
            : url.startsWith('/')
              ? url
              : `/${String(url).replace(/^\/+/, '')}`;
          this.setData({ mainImagePath: normalized });
          this.applyCoverDisplay(normalized);
        } catch (e) {
          wx.showToast({ title: (e && e.errmsg) || '上传失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  async save() {
    const { id, title, mainImagePath, priceInput, stock, safeStock, description, saving } = this.data;
    if (saving) return;
    const name = (title || '').trim();
    if (!name) {
      wx.showToast({ title: '请填写商品名称', icon: 'none' });
      return;
    }
    const price = parseFloat(String(priceInput || '').trim());
    if (!Number.isFinite(price) || price < 0) {
      wx.showToast({ title: '请输入有效售价', icon: 'none' });
      return;
    }
    const body = {
      title: name,
      main_image: mainImagePath || '',
      price,
      stock,
      safe_stock: safeStock,
      description: description || ''
    };
    this.setData({ saving: true });
    try {
      try {
        await util.patch(`market/merchant/goods/${id}`, body);
      } catch (e1) {
        if (e1 && (Number(e1.errno) === 404 || Number(e1.errno) === 501)) {
          await util.patch(`market/shop/goods/${id}`, body);
        } else {
          throw e1;
        }
      }
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 400);
    } catch (e) {
      wx.showToast({ title: (e && e.errmsg) || '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  }
});
