const util = require('../../../utils/util.js');
const api = require('../../../api/index.js');
const spCtx = require('../../utils/spContext.js');
const portalEdit = require('../../../utils/portalAvatarEdit.js');

Page({
  data: {
    loading: true,
    saving: false,
    shopName: '',
    contactName: '',
    contactPhone: '',
    descLen: 0,
    coverImage: ''
  },

  onShow() {
    this.loadProfile();
  },

  async loadProfile() {
    this.setData({ loading: true });
    try {
      const res = await api.serviceProvider.getProfile();
      const profile = spCtx.normalizeProfilePayload(res);
      spCtx.syncBoundProfile(getApp(), profile);
      const cover = profile.shop_front_url || profile.logo || '';
      this.setData({
        loading: false,
        shopName: profile.shop_name || '',
        contactName: profile.contact_name || '',
        contactPhone: profile.phone || profile.contact_phone || '',
        descLen: 0,
        coverImage: cover ? util.imgUrl(cover, cover) : ''
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: (e && e.errmsg) || '信息加载失败', icon: 'none' });
    }
  },

  onShopNameInput(e) { this.setData({ shopName: (e.detail && e.detail.value) || '' }); },
  onContactInput(e) { this.setData({ contactName: (e.detail && e.detail.value) || '' }); },
  onPhoneInput(e) {
    const v = ((e.detail && e.detail.value) || '').replace(/\D/g, '').slice(0, 11);
    this.setData({ contactPhone: v });
  },

  async onChooseCover() {
    try {
      const path = await portalEdit.chooseUploadAndGetPath();
      await api.serviceProvider.updateProfile({ logo: path, shop_front_url: path });
      this.setData({ coverImage: util.imgUrl(path, path) });
      wx.showToast({ title: '封面已更新', icon: 'success' });
    } catch (e) {
      if (e && e.errmsg) wx.showToast({ title: e.errmsg, icon: 'none' });
    }
  },

  async save() {
    if (this.data.saving) return;
    const shopName = String(this.data.shopName || '').trim();
    const contactName = String(this.data.contactName || '').trim();
    const contactPhone = String(this.data.contactPhone || '').trim();
    if (!shopName) { wx.showToast({ title: '请填写门店名称', icon: 'none' }); return; }
    if (!contactName) { wx.showToast({ title: '请填写联系人', icon: 'none' }); return; }
    if (!/^1\d{10}$/.test(contactPhone)) { wx.showToast({ title: '请输入正确手机号', icon: 'none' }); return; }
    this.setData({ saving: true });
    wx.showLoading({ title: '保存中', mask: true });
    try {
      await api.serviceProvider.updateProfile({ shop_name: shopName, contact_name: contactName, phone: contactPhone });
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: (e && e.errmsg) || '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  }
});
