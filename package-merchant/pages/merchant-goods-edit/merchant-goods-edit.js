const util = require('../../../utils/util.js');
const mshop = require('../../utils/merchantShopContext.js');
const api = require('../../../api/index.js');
const config = require('../../../utils/config.js');

const PLACEHOLDER = '/img/market_icons/supermarket.png';

function clampInt(n, min, max) {
  let v = parseInt(String(n), 10);
  if (!Number.isFinite(v)) v = min;
  if (v < min) v = min;
  if (v > max) v = max;
  return v;
}

function normalizeImageList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x || '').trim()).filter(Boolean);
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x || '').trim()).filter(Boolean);
    } catch (e) {}
    return s.split(',').map((x) => String(x || '').trim()).filter(Boolean);
  }
  return [];
}

async function resolveBoundShop() {
  let { shopId, shopName } = mshop.getBoundShop(getApp());
  if (shopId != null && shopId !== '') return { shopId, shopName: shopName || '' };
  try {
    const resp = await api.merchant.getShop();
    const shop = (resp && (resp.shop || resp.data || resp)) || {};
    const synced = mshop.syncBoundShop(getApp(), shop);
    shopId = synced.shopId;
    shopName = synced.shopName;
  } catch (e) {
    // ignore, fallback to null check
  }
  return { shopId, shopName: shopName || '' };
}

async function resolveCategoryKeyForShop(shopId) {
  const sid = Number(shopId);
  if (!Number.isFinite(sid) || sid <= 0) return 'local';
  try {
    const res = await util.get(`market/shops/${sid}/categories`);
    const list = Array.isArray(res)
      ? res
      : (res && Array.isArray(res.list))
        ? res.list
        : (res && res.data && Array.isArray(res.data.list))
          ? res.data.list
          : (res && res.data && Array.isArray(res.data))
            ? res.data
            : [];
    if (list.length > 0) {
      const first = list[0] || {};
      const key = String(first.category_key || first.key || '').trim();
      if (key) return key;
    }
  } catch (e) {
    // ignore
  }
  return 'local';
}

function extractUploadUrl(up) {
  if (!up) return '';
  if (typeof up === 'string') {
    const s = up.trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s;
    const m = s.match(/https?:\/\/[^\s"']+|\/uploads\/[^\s"']+/i);
    return m ? m[0] : '';
  }
  if (typeof up === 'object') {
    const cands = [up.url, up.path, up.file_url, up.fileUrl, up.image, up.src];
    for (let i = 0; i < cands.length; i++) {
      const v = cands[i];
      if (v && String(v).trim()) return String(v).trim();
    }
  }
  return '';
}

function extractUrlFromText(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text) || text.startsWith('/uploads/')) return text;
  const m = text.match(/https?:\/\/[^\s"']+|\/uploads\/[^\s"'<>]+/i);
  return m ? m[0] : '';
}

function normalizeEndpoint(ep) {
  const p = String(ep || '').trim().replace(/^\/+/, '');
  return p;
}

function uploadByNativeUrl(url, filePath, formData = {}) {
  const token = wx.getStorageSync('token');
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url,
      filePath,
      name: 'file',
      formData,
      header: { Authorization: token ? `Bearer ${token}` : '' },
      success: (res) => {
        const raw = res && res.data != null ? String(res.data) : '';
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch (e) {}
        const codeOk = res.statusCode === 200 || res.statusCode === 201;
        let got =
          extractUploadUrl(parsed) ||
          extractUploadUrl(parsed && parsed.data) ||
          extractUploadUrl(parsed && parsed.result) ||
          extractUrlFromText(raw);
        if (got && codeOk) return resolve(got);
        if (codeOk && got) return resolve(got);
        const msg =
          (parsed && (parsed.errmsg || parsed.msg || parsed.message || parsed.error)) ||
          extractUrlFromText(raw) ||
          `上传失败(${res.statusCode})`;
        reject({
          endpoint: url,
          statusCode: res.statusCode,
          errmsg: String(msg).slice(0, 180),
          raw: String(raw || '').slice(0, 200)
        });
      },
      fail: (e) => reject(Object.assign({ endpoint: url }, e || { errmsg: '上传失败' }))
    });
  });
}

async function uploadWithEndpointFallback(filePath) {
  const baseApi = String(config.baseUrl || '').replace(/\/$/, '');
  const host = String(config.imageBaseUrl || '').replace(/\/$/, '');
  const urls = [
    `${baseApi}/upload`,
    `${host}/api/v1/upload`,
    `${host}/upload`
  ];
  let lastErr = null;
  for (let i = 0; i < urls.length; i++) {
    try {
      return await uploadByNativeUrl(urls[i], filePath, { type: 'goods' });
    } catch (e) {
      lastErr = e;
      if (e && Number(e.statusCode) !== 404) {
        // 非 404 说明端点存在但业务失败，直接抛出真实错误，避免被后续兜底掩盖
        throw e;
      }
    }
  }
  throw lastErr || { errmsg: '上传失败' };
}

Page({
  data: {
    id: null,
    isCreate: false,
    loading: true,
    saving: false,
    title: '',
    mainImagePath: '',
    imageList: [],
    coverDisplay: PLACEHOLDER,
    priceInput: '',
    stock: 0,
    safeStock: 5,
    description: '',
    descLen: 0,
    categoryKey: 'local',
    shopId: '',
    shopCategories: [],
    selectedCategoryName: ''
  },

  async onLoad(options) {
    const id = options && (options.id != null ? options.id : options.goodsId);
    const mode = options && options.mode;

    // 解析绑定店铺并加载分类
    try {
      const { shopId } = await resolveBoundShop();
      this.setData({ shopId });
      if (shopId) {
        await this.loadShopCategories(shopId);
      }
    } catch (err) {
      console.log('获取店铺与分类失败', err);
    }

    if ((id == null || id === '') && mode === 'create') {
      this.setData({
        isCreate: true,
        loading: false,
        title: '',
        mainImagePath: '',
        imageList: [],
        coverDisplay: PLACEHOLDER,
        priceInput: '',
        stock: 0,
        safeStock: 5,
        description: '',
        descLen: 0,
        categoryKey: 'local'
      });
      return;
    }
    if (id == null || id === '') {
      wx.showToast({ title: '缺少商品', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 400);
      return;
    }
    this.setData({ id: String(id), isCreate: false });
    this.load();
  },

  async loadShopCategories(shopId) {
    try {
      const res = await util.get(`market/shops/${shopId}/categories`);
      const list = Array.isArray(res)
        ? res
        : (res && Array.isArray(res.list))
          ? res.list
          : (res && res.data && Array.isArray(res.data.list))
            ? res.data.list
            : (res && res.data && Array.isArray(res.data))
              ? res.data
              : [];
      if (list && list.length > 0) {
        const shopCategories = list.map(c => ({
          key: c.category_key || c.categoryKey || c.key || '',
          name: c.category_name || c.categoryName || c.name || ''
        })).filter(c => c.key);
        this.setData({ shopCategories }, () => {
          this.matchCategoryName(this.data.categoryKey);
        });
      }
    } catch (e) {
      console.error('加载店内分类失败', e);
    }
  },

  matchCategoryName(key) {
    const list = this.data.shopCategories || [];
    const found = list.find(c => c.key === key);
    if (found) {
      this.setData({ selectedCategoryName: found.name });
    } else {
      this.setData({ selectedCategoryName: key || '' });
    }
  },

  onCategoryPickerChange(e) {
    const idx = Number(e.detail.value);
    const selected = this.data.shopCategories[idx];
    if (selected) {
      this.setData({
        categoryKey: selected.key,
        selectedCategoryName: selected.name
      });
    }
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
      const imageListRaw = normalizeImageList(g.images || g.image_list || g.gallery_images);
      const imageList = imageListRaw.length > 0 ? imageListRaw.slice(0, 6) : (rawPath ? [String(rawPath).trim()] : []);
      const stock = g.stock != null ? g.stock : g.inventory != null ? g.inventory : 0;
      const safe =
        g.safe_stock != null ? g.safe_stock : g.low_stock_threshold != null ? g.low_stock_threshold : 5;
      const price = g.price != null ? Number(g.price) : NaN;
      const title = g.title || g.goods_title || g.name || '';
      const description = g.description || g.desc || '';
      const priceInput = Number.isFinite(price) ? String(price) : '';
      const categoryKey = g.category_key || g.categoryKey || 'local';
      this.setData({
        loading: false,
        title,
        mainImagePath: imageList[0] || (rawPath ? String(rawPath).trim() : ''),
        imageList,
        stock: clampInt(stock, 0, 999999),
        safeStock: clampInt(safe, 0, 999999),
        priceInput,
        description,
        descLen: String(description).length,
        categoryKey
      }, () => {
        this.matchCategoryName(categoryKey);
      });
      this.applyCoverDisplay(imageList[0] || rawPath);
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value || '' });
  },

  onCategoryInput(e) {
    const value = e.detail && e.detail.value !== undefined ? e.detail.value : (e.currentTarget.dataset.value || '');
    this.setData({ categoryKey: value });
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
    this.setData({ mainImagePath: '', imageList: [] });
    this.applyCoverDisplay('');
  },

  chooseCover() {
    const remain = Math.max(0, 6 - (this.data.imageList || []).length);
    if (remain <= 0) {
      wx.showToast({ title: '最多上传 6 张图', icon: 'none' });
      return;
    }
    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const paths = (res.tempFilePaths || []).filter(Boolean);
        if (!paths.length) return;
        wx.showLoading({ title: '上传中', mask: true });
        try {
          const uploaded = [];
          for (let i = 0; i < paths.length; i++) {
            let url = '';
            try {
              url = await uploadWithEndpointFallback(paths[i]);
            } catch (e1) {
              const msg = (e1 && (e1.errmsg || e1.message || e1.msg)) || '';
              const guessed = extractUploadUrl(msg);
              if (guessed) url = guessed;
              else throw e1;
            }
            if (!url) continue;
            const normalized = util.normalizeServerImagePath
              ? util.normalizeServerImagePath(url)
              : url.startsWith('/')
                ? url
                : `/${String(url).replace(/^\/+/, '')}`;
            uploaded.push(normalized);
          }
          if (!uploaded.length) {
            wx.showToast({ title: '上传无返回地址', icon: 'none' });
            return;
          }
          const imageList = (this.data.imageList || []).concat(uploaded).slice(0, 6);
          const mainImagePath = imageList[0] || '';
          this.setData({ imageList, mainImagePath });
          this.applyCoverDisplay(mainImagePath);
        } catch (e) {
          const code = e && e.statusCode ? `(${e.statusCode})` : '';
          const ep = e && e.endpoint ? String(e.endpoint).replace(/^https?:\/\/[^/]+/i, '') : '';
          const msg = (e && e.errmsg) || '上传失败';
          wx.showModal({
            title: `上传失败${code}`,
            content: ep ? `${msg}\n路径: ${ep}` : msg,
            showCancel: false
          });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  removeImage(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    if (!Number.isFinite(idx)) return;
    const imageList = (this.data.imageList || []).slice();
    if (idx < 0 || idx >= imageList.length) return;
    imageList.splice(idx, 1);
    const mainImagePath = imageList[0] || '';
    this.setData({ imageList, mainImagePath });
    this.applyCoverDisplay(mainImagePath);
  },

  previewImageAt(e) {
    const idx = Number(e.currentTarget.dataset.idx) || 0;
    const urls = (this.data.imageList || []).map((x) => util.imgUrl(x, x)).filter(Boolean);
    if (!urls.length) return;
    const cur = urls[Math.max(0, Math.min(idx, urls.length - 1))];
    wx.previewImage({ current: cur, urls });
  },

  async save() {
    const { id, isCreate, title, mainImagePath, priceInput, stock, safeStock, description, saving } = this.data;
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
    const images = (this.data.imageList || []).slice(0, 6);
    const categoryKey = String(this.data.categoryKey || '').trim() || 'local';
    const body = {
      name,
      title: name,
      main_image: images[0] || mainImagePath || '',
      images,
      price,
      stock,
      safe_stock: safeStock,
      description: description || '',
      category_key: categoryKey,
      categoryKey
    };
    this.setData({ saving: true });
    try {
      if (isCreate) {
        const { shopId } = await resolveBoundShop();
        if (shopId == null || shopId === '') {
          throw { errmsg: '未获取到绑定店铺，请先在工作台完成店铺绑定后再新增商品' };
        }
        let createCategoryKey = categoryKey;
        if (!createCategoryKey || createCategoryKey === 'local') {
          createCategoryKey = await resolveCategoryKeyForShop(shopId);
        }
        const createBody = {
          ...body,
          shop_id: shopId,
          shopId: shopId,
          category_key: createCategoryKey,
          categoryKey: createCategoryKey,
          status: 'on_sale',
          is_published: 1,
          published: true,
          on_shelf: true
        };
        await api.merchant.createGoods(createBody);
      } else {
        await api.merchant.updateGoods(id, body);
      }
      wx.showToast({ title: isCreate ? '已创建并上架' : '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 400);
    } catch (e) {
      wx.showToast({ title: (e && e.errmsg) || '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  }
});
