const util = require('../../../utils/util.js');
const api = require('../../../api/index.js');
const mshop = require('../../../utils/merchantShopContext.js');

const FALLBACK_IMG = '/img/placeholders/home_cleaning.png';

function pick() {
  for (let i = 0; i < arguments.length; i += 1) {
    const v = arguments[i];
    if (v === undefined || v === null) continue;
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) return s;
    } else if (v !== '') {
      return v;
    }
  }
  return '';
}

function asImage(url) {
  const raw = pick(url);
  return raw ? util.imgUrl(raw, raw) : '';
}

function parsePhotoList(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    try {
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr : [s];
    } catch (e) {
      return s.split(',').map((x) => x.trim()).filter(Boolean);
    }
  }
  return [];
}

function normalizeDetail(input) {
  const base = input && typeof input === 'object' ? input : {};
  const shop = base.shop && typeof base.shop === 'object' ? base.shop : base;
  const apply = base.application && typeof base.application === 'object' ? base.application : base;
  const photos = parsePhotoList(
    pick(
      apply.place_photo_url,
      apply.placePhotoUrl,
      shop.place_photo_url,
      shop.placePhotoUrl,
      shop.place_photos,
      shop.placePhotos
    )
  ).map((x) => asImage(x)).filter(Boolean);

  return {
    shopName: pick(shop.name, shop.shop_name, shop.shopName, apply.shop_name, apply.shopName),
    category: pick(shop.category, apply.category),
    contactName: pick(shop.contact_name, shop.contactName, apply.contact_name, apply.contactName),
    phone: pick(shop.phone, shop.contact_phone, apply.phone),
    entityName: pick(shop.entity_name, shop.entityName, apply.entity_name, apply.entityName),
    legalPerson: pick(shop.legal_person, shop.legalPerson, apply.legal_person, apply.legalPerson),
    creditCode: pick(shop.credit_code, shop.creditCode, apply.credit_code, apply.creditCode),
    promoterName: pick(shop.promoter_name, shop.promoterName, apply.promoter_name, apply.promoterName),
    applyTime: pick(apply.created_at, apply.createdAt, shop.created_at, shop.createdAt),
    address: pick(shop.address, apply.address),
    description: pick(shop.description, shop.intro, apply.description, apply.intro),
    communityId: pick(shop.community_id, shop.communityId, apply.community_id, apply.communityId),
    logoUrl: asImage(pick(shop.logo_url, shop.logoUrl, apply.logo_url, apply.logoUrl)),
    backgroundUrl: asImage(pick(shop.background_url, shop.backgroundUrl, apply.background_url, apply.backgroundUrl)),
    licenseUrl: asImage(pick(shop.license_url, shop.licenseUrl, apply.license_url, apply.licenseUrl)),
    placePhotos: photos
  };
}

Page({
  data: {
    loading: true,
    loadFailed: false,
    failHint: '',
    fallbackImg: FALLBACK_IMG,
    detail: {
      shopName: '',
      category: '',
      contactName: '',
      phone: '',
      entityName: '',
      legalPerson: '',
      creditCode: '',
      promoterName: '',
      applyTime: '',
      address: '',
      description: '',
      communityId: '',
      logoUrl: '',
      backgroundUrl: '',
      licenseUrl: '',
      placePhotos: []
    }
  },

  onShow() {
    this.reload();
  },

  async reload() {
    this.setData({ loading: true, loadFailed: false, failHint: '' });
    try {
      let shopRes = null;
      let appRes = null;
      let shopErr = null;
      let appErr = null;
      try {
        shopRes = await api.merchant.getShop();
      } catch (e1) {
        shopErr = e1;
      }
      try {
        appRes = await util.get('/market/merchant/application');
      } catch (e2) {
        appErr = e2;
      }
      if (!shopRes && !appRes) {
        throw (shopErr || appErr || { errmsg: '加载失败' });
      }
      const shopPayload = shopRes && (shopRes.shop || shopRes.data || shopRes);
      const appPayload = appRes && (appRes.application || appRes.data?.application || appRes.data || appRes);
      if (shopPayload) {
        mshop.syncBoundShop(getApp(), shopPayload);
      }
      // 统一以已绑定店铺信息为主，申请信息仅做补充，避免出现“资质店铺名”与“工作台绑定店铺”不一致
      const detail = normalizeDetail({ shop: shopPayload || {}, application: appPayload || {} });
      this.setData({ detail, loading: false, loadFailed: false });
    } catch (e) {
      const code = Number((e && (e.code != null ? e.code : e.errno)) || 0);
      const msg = String((e && (e.msg || e.errmsg)) || '');
      const noShopMapping = code === 404 || /未找到可用店铺|店铺映射/.test(msg);
      this.setData({
        loading: false,
        loadFailed: true,
        failHint: noShopMapping ? '未找到可用店铺映射，请联系运营处理后重试' : ''
      });
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
    }
  },

  previewOne(e) {
    const url = e.currentTarget.dataset.url;
    const all = []
      .concat(this.data.detail.logoUrl || [])
      .concat(this.data.detail.backgroundUrl || [])
      .concat(this.data.detail.licenseUrl || [])
      .concat(this.data.detail.placePhotos || [])
      .filter(Boolean);
    if (!url) return;
    wx.previewImage({ current: url, urls: all.length ? all : [url] });
  },

  goSettings() {
    wx.navigateTo({ url: '/package-merchant/pages/merchant-settings/merchant-settings' });
  }
});
