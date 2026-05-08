const app = getApp();
const util = require('../../../utils/util.js');
const api = require('../../../api/index.js');
const spCtx = require('../../utils/spContext.js');

Page({
  data: {
    loading: true,
    shopName: '',
    contactName: '',
    phone: '',
    status: '',
    statusText: '',
    licenseUrl: '',
    shopFrontUrl: '',
    environmentUrls: [],
    idCardUrl: '',
    certificateUrls: [],
    communityName: ''
  },

  onShow() {
    this.load();
  },

  async load() {
    this.setData({ loading: true });
    try {
      const res = await api.serviceProvider.getProfile();
      const profile = spCtx.normalizeProfilePayload(res);
      spCtx.syncBoundProfile(app, profile);
      const statusMap = { active: '已入驻', pending: '审核中', rejected: '已驳回', inactive: '已注销' };
      const envUrls = Array.isArray(profile.environment_url)
        ? profile.environment_url
        : (typeof profile.environment_url === 'string' && profile.environment_url
          ? [profile.environment_url] : []);
      const certUrls = Array.isArray(profile.certificate_url)
        ? profile.certificate_url
        : (typeof profile.certificate_url === 'string' && profile.certificate_url
          ? [profile.certificate_url] : []);
      this.setData({
        loading: false,
        shopName: profile.shop_name || '',
        contactName: profile.contact_name || '',
        phone: profile.phone || '',
        status: profile.status || '',
        statusText: statusMap[profile.status] || profile.status || '未知',
        licenseUrl: profile.license_url ? util.imgUrl(profile.license_url, profile.license_url) : '',
        shopFrontUrl: profile.shop_front_url ? util.imgUrl(profile.shop_front_url, profile.shop_front_url) : '',
        environmentUrls: envUrls.map(u => util.imgUrl(u, u)),
        idCardUrl: profile.id_card_url ? util.imgUrl(profile.id_card_url, profile.id_card_url) : '',
        certificateUrls: certUrls.map(u => util.imgUrl(u, u)),
        communityName: (profile.community && profile.community.name) || ''
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
    }
  },

  previewImg(e) {
    const src = e.currentTarget.dataset.src;
    if (!src) return;
    wx.previewImage({ current: src, urls: [src] });
  },

  previewImgList(e) {
    const list = e.currentTarget.dataset.list || [];
    const idx = Number(e.currentTarget.dataset.idx) || 0;
    if (!list.length) return;
    wx.previewImage({ current: list[Math.min(idx, list.length - 1)], urls: list });
  },

  goSettings() {
    wx.navigateTo({ url: '/package-service-provider/pages/sp-settings/sp-settings' });
  },

  goJoin() {
    wx.navigateTo({ url: '/pages/join-service/join-service' });
  }
});
