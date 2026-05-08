const util = require('../../../utils/util.js');
const api = require('../../../api/index.js');
const config = require('../../../utils/config.js');

const PLACEHOLDER = '/img/market_icons/supermarket.png';

function normalizeImageList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x || '').trim()).filter(Boolean);
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    try { const p = JSON.parse(s); if (Array.isArray(p)) return p.map((x) => String(x || '').trim()).filter(Boolean); } catch (e) {}
    return s.split(',').map((x) => String(x || '').trim()).filter(Boolean);
  }
  return [];
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
    for (const k of ['url', 'path', 'file_url', 'fileUrl', 'image', 'src']) {
      if (up[k] && String(up[k]).trim()) return String(up[k]).trim();
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

async function uploadWithFallback(filePath) {
  const baseApi = String(config.baseUrl || '').replace(/\/$/, '');
  const host = String(config.imageBaseUrl || '').replace(/\/$/, '');
  const urls = [`${baseApi}/upload`, `${host}/api/v1/upload`, `${host}/upload`];
  const token = wx.getStorageSync('token');
  let lastErr = null;
  for (const url of urls) {
    try {
      const result = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url, filePath, name: 'file', formData: { type: 'service' },
          header: { Authorization: token ? `Bearer ${token}` : '' },
          success: (res) => {
            const raw = res && res.data != null ? String(res.data) : '';
            let parsed = null;
            try { parsed = JSON.parse(raw); } catch (e) {}
            const ok = res.statusCode === 200 || res.statusCode === 201;
            const got = extractUploadUrl(parsed) || extractUploadUrl(parsed && parsed.data) || extractUrlFromText(raw);
            if (got && ok) return resolve(got);
            const msg = (parsed && (parsed.errmsg || parsed.msg || parsed.message)) || `上传失败(${res.statusCode})`;
            reject({ endpoint: url, statusCode: res.statusCode, errmsg: String(msg).slice(0, 180) });
          },
          fail: (e) => reject(Object.assign({ endpoint: url }, e || { errmsg: '上传失败' }))
        });
      });
      return result;
    } catch (e) {
      lastErr = e;
      if (e && Number(e.statusCode) !== 404) throw e;
    }
  }
  throw lastErr || { errmsg: '上传失败' };
}

Page({
  data: {
    id: null,
    isCreate: false,
    loading: false,
    saving: false,
    title: '',
    subTitle: '',
    priceInput: '',
    description: '',
    descLen: 0,
    coverPath: '',
    coverDisplay: PLACEHOLDER,
    detailImages: [],
    categories: [],
    categoryId: null,
    categoryName: '',
    isPublished: true
  },

  async onLoad(options) {
    const id = options && (options.id != null ? options.id : null);
    const mode = options && options.mode;
    this.setData({ isCreate: !id || mode === 'create' });
    if (id && mode !== 'create') {
      this.setData({ id: String(id), loading: true });
      await this.load();
    }
    this.loadCategories();
  },

  async loadCategories() {
    try {
      const res = await api.serviceProvider.getCategories();
      const list = Array.isArray(res) ? res : (res && res.list) || (res && res.data && res.data.list) || [];
      this.setData({ categories: list.map(c => ({ id: c.id, name: c.name || c.title || '' })) });
    } catch (e) {}
  },

  async load() {
    try {
      const res = await api.serviceProvider.getServiceDetail(this.data.id);
      const s = (res && (res.service || res.data || res)) || {};
      const detailImages = normalizeImageList(s.detail_images || s.images);
      const coverPath = s.cover_image || s.main_image || s.image || '';
      this.setData({
        loading: false,
        title: s.title || '',
        subTitle: s.sub_title || '',
        priceInput: s.price != null ? String(Number(s.price)) : '',
        description: s.description || '',
        descLen: String(s.description || '').length,
        coverPath,
        coverDisplay: coverPath ? util.imgUrl(coverPath, coverPath) : PLACEHOLDER,
        detailImages,
        categoryId: s.category_id || null,
        categoryName: (s.category && s.category.name) || '',
        isPublished: s.is_published !== 0 && s.is_published !== false
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
    }
  },

  onTitleInput(e) { this.setData({ title: e.detail.value || '' }); },
  onSubTitleInput(e) { this.setData({ subTitle: e.detail.value || '' }); },
  onPriceInput(e) { this.setData({ priceInput: e.detail.value || '' }); },
  onDescInput(e) {
    const description = e.detail.value || '';
    this.setData({ description, descLen: description.length });
  },

  onPublishedChange(e) { this.setData({ isPublished: !!e.detail.value }); },

  pickCategory(e) {
    const { categories } = this.data;
    if (!categories || !categories.length) { wx.showToast({ title: '暂无分类', icon: 'none' }); return; }
    const idx = e.detail.value;
    const cat = categories[idx];
    if (cat) this.setData({ categoryId: cat.id, categoryName: cat.name });
  },

  chooseCover() {
    wx.chooseImage({
      count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: async (res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0];
        if (!path) return;
        wx.showLoading({ title: '上传中', mask: true });
        try {
          const url = await uploadWithFallback(path);
          const normalized = url.startsWith('/') ? url : `/${url.replace(/^\/+/, '')}`;
          this.setData({ coverPath: normalized, coverDisplay: util.imgUrl(normalized, normalized) });
        } catch (e) {
          wx.showModal({ title: '上传失败', content: (e && e.errmsg) || '请重试', showCancel: false });
        } finally { wx.hideLoading(); }
      }
    });
  },

  clearCover() { this.setData({ coverPath: '', coverDisplay: PLACEHOLDER }); },

  chooseDetailImages() {
    const remain = Math.max(0, 6 - (this.data.detailImages || []).length);
    if (remain <= 0) { wx.showToast({ title: '最多上传 6 张图', icon: 'none' }); return; }
    wx.chooseImage({
      count: remain, sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: async (res) => {
        const paths = (res.tempFilePaths || []).filter(Boolean);
        if (!paths.length) return;
        wx.showLoading({ title: '上传中', mask: true });
        try {
          const uploaded = [];
          for (const p of paths) {
            const url = await uploadWithFallback(p);
            const normalized = url.startsWith('/') ? url : `/${url.replace(/^\/+/, '')}`;
            uploaded.push(normalized);
          }
          const detailImages = (this.data.detailImages || []).concat(uploaded).slice(0, 6);
          this.setData({ detailImages });
        } catch (e) {
          wx.showModal({ title: '上传失败', content: (e && e.errmsg) || '请重试', showCancel: false });
        } finally { wx.hideLoading(); }
      }
    });
  },

  removeDetailImage(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    if (!Number.isFinite(idx)) return;
    const detailImages = (this.data.detailImages || []).slice();
    detailImages.splice(idx, 1);
    this.setData({ detailImages });
  },

  previewDetailImage(e) {
    const idx = Number(e.currentTarget.dataset.idx) || 0;
    const urls = (this.data.detailImages || []).map((x) => util.imgUrl(x, x)).filter(Boolean);
    if (!urls.length) return;
    wx.previewImage({ current: urls[Math.min(idx, urls.length - 1)], urls });
  },

  async save() {
    const { id, isCreate, title, subTitle, priceInput, description, coverPath, detailImages, categoryId, isPublished, saving } = this.data;
    if (saving) return;
    const t = (title || '').trim();
    if (!t) { wx.showToast({ title: '请填写服务名称', icon: 'none' }); return; }
    const price = parseFloat(String(priceInput || '').trim());
    if (!Number.isFinite(price) || price < 0) { wx.showToast({ title: '请输入有效价格', icon: 'none' }); return; }
    const body = {
      title: t,
      sub_title: subTitle || '',
      price,
      description: description || '',
      cover_image: coverPath || '',
      detail_images: detailImages || [],
      category_id: categoryId || null,
      is_published: isPublished ? 1 : 0
    };
    this.setData({ saving: true });
    wx.showLoading({ title: '保存中', mask: true });
    try {
      if (isCreate) {
        await api.serviceProvider.createService(body);
      } else {
        await api.serviceProvider.updateService(id, body);
      }
      wx.hideLoading();
      wx.showToast({ title: isCreate ? '已创建并上架' : '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 400);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: (e && e.errmsg) || '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  }
});
