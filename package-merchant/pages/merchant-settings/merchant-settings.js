const api = require('../../../api/index.js');
const mshop = require('../../utils/merchantShopContext.js');

function firstNonEmpty() {
  for (let i = 0; i < arguments.length; i += 1) {
    const v = arguments[i];
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return '';
}

function normalizeShopPayload(res) {
  if (!res || typeof res !== 'object') return {};
  if (res.shop && typeof res.shop === 'object') return res.shop;
  if (res.data && typeof res.data === 'object') {
    if (res.data.shop && typeof res.data.shop === 'object') return res.data.shop;
    return res.data;
  }
  return res;
}

Page({
  data: {
    loading: true,
    saving: false,
    contactName: '',
    contactPhone: '',
    description: '',
    descLen: 0,
    communityId: '',
    rawShopId: ''
  },

  onShow() {
    this.loadShop();
  },

  async loadShop() {
    this.setData({ loading: true });
    try {
      const res = await api.merchant.getShop();
      const shop = normalizeShopPayload(res);
      const contactName = firstNonEmpty(
        shop.contact_name,
        shop.contactName,
        shop.owner_name,
        shop.ownerName
      );
      const contactPhone = firstNonEmpty(
        shop.phone,
        shop.contact_phone,
        shop.contactPhone,
        shop.mobile
      );
      const description = firstNonEmpty(
        shop.description,
        shop.shop_desc,
        shop.shopDesc,
        shop.intro
      );
      const communityId = firstNonEmpty(
        shop.community_id,
        shop.communityId,
        shop.village_id,
        shop.villageId
      );
      this.setData({
        loading: false,
        contactName,
        contactPhone,
        description,
        descLen: description.length,
        communityId,
        rawShopId: firstNonEmpty(shop.id, shop.shop_id, shop.shopId)
      });
      mshop.syncBoundShop(getApp(), shop);
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: (e && e.errmsg) || '店铺信息加载失败', icon: 'none' });
    }
  },

  onContactInput(e) {
    this.setData({ contactName: (e.detail && e.detail.value) || '' });
  },

  onPhoneInput(e) {
    const v = ((e.detail && e.detail.value) || '').replace(/\D/g, '').slice(0, 11);
    this.setData({ contactPhone: v });
  },

  onDescInput(e) {
    const description = (e.detail && e.detail.value) || '';
    this.setData({ description, descLen: description.length });
  },

  onCommunityInput(e) {
    const communityId = ((e.detail && e.detail.value) || '').replace(/\D/g, '');
    this.setData({ communityId });
  },

  async save() {
    if (this.data.saving) return;
    const contactName = String(this.data.contactName || '').trim();
    const contactPhone = String(this.data.contactPhone || '').trim();
    const description = String(this.data.description || '').trim();
    const communityId = String(this.data.communityId || '').trim();

    if (!contactName) {
      wx.showToast({ title: '请填写联系人', icon: 'none' });
      return;
    }
    if (!/^1\d{10}$/.test(contactPhone)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return;
    }
    if (!communityId) {
      wx.showToast({ title: '请填写小区ID', icon: 'none' });
      return;
    }

    const body = {
      contact_name: contactName,
      phone: contactPhone,
      description,
      community_id: Number(communityId)
    };

    this.setData({ saving: true });
    try {
      await api.merchant.updateShop(body);
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: (e && e.errmsg) || '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  }
});
