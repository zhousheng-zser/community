// pages/order-confrim/order-confrim.js
const app = getApp();
const util = require('../../utils/util.js');
const { fetchDefaultOrderAddressFill } = require('../../utils/defaultServiceAddress.js');

Page({
  data: {
    serviceAddr: '',
    doorNum: '',
    contactName: '',
    contactGender: '先生',
    contactPhone: '',
    remark: '',
    qty: 1,
    workerId: '',
    serviceId: '',
    groupKey: '',
    product: { name: '', sub: '', price: '0', image: '' },
    totalPrice: '0',
    bundleMode: false,
    bundleLines: [],
    spProviderId: ''
  },

  onLoad(options) {
    if (options.mode === 'sp_bundle') {
      const raw = wx.getStorageSync('sp_bundle_checkout') || {};
      const items = raw.items || [];
      const providerId = String(raw.provider_id || options.provider_id || '');
      const providerName = raw.provider_name || '服务商';
      let total = 0;
      items.forEach((it) => {
        total += Number(it.price || 0) * Number(it.qty || 1);
      });
      const sub = items.map((it) => `${it.title}×${it.qty}`).join('；');
      const product = {
        name: `${providerName} · 打包服务`,
        sub: sub || '所选服务',
        price: total.toFixed(2),
        image: 'https://ancientscrolllibrary.cn/uploads/file-1773395942165-45947155.png'
      };
      const totalPrice = total.toFixed(2).replace(/\.00$/, '');
      this.setData({
        bundleMode: true,
        spProviderId: providerId,
        bundleLines: items,
        product,
        qty: 1,
        totalPrice,
        workerId: '',
        serviceId: '',
        groupKey: ''
      });
      this.prefillDefaultAddress();
      return;
    }
    const name = decodeURIComponent(options.name || '');
    const price = options.price || '0';
    const image = decodeURIComponent(options.image || '');
    const qty = Number(options.qty || 1);
    const sub = decodeURIComponent(options.sub || name);
    const product = { name, sub, price, image };
    const totalPrice = (Number(price) * qty).toFixed(2).replace(/\.00$/, '');
    const workerId = options.workerId != null && options.workerId !== '' ? String(options.workerId) : '';
    const serviceId = options.serviceId != null && options.serviceId !== '' ? String(options.serviceId) : '';
    const groupKey = options.groupKey ? decodeURIComponent(options.groupKey) : '';
    this.setData({ product, qty, totalPrice, workerId, serviceId, groupKey });
    this.prefillDefaultAddress();
  },

  async prefillDefaultAddress() {
    try {
      const patch = await fetchDefaultOrderAddressFill(util);
      if (!patch) return;
      const cur = this.data;
      const next = {};
      if (!cur.serviceAddr && patch.serviceAddr) next.serviceAddr = patch.serviceAddr;
      if (!cur.doorNum && patch.doorNum) next.doorNum = patch.doorNum;
      if (!cur.contactName && patch.contactName) next.contactName = patch.contactName;
      if (!cur.contactPhone && patch.contactPhone) next.contactPhone = patch.contactPhone;
      if (!cur.contactName || !cur.contactPhone) {
        const u = app.globalData.user || {};
        if (!cur.contactName && u.userName) next.contactName = u.userName;
        if (!cur.contactPhone && u.userMobile) {
          const p = String(u.userMobile).replace(/\D/g, '').slice(0, 11);
          if (p.length === 11) next.contactPhone = p;
        }
      }
      if (patch.contactGender) next.contactGender = patch.contactGender;
      if (Object.keys(next).length) this.setData(next);
    } catch (e) {}
  },

  onOcInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
    if (field !== 'remark') this._updateTotal();
  },

  setGender(e) {
    this.setData({ contactGender: e.currentTarget.dataset.g });
  },

  pickServiceAddr() {
    wx.navigateTo({ url: '../address/address?mode=pick&field=serviceAddr' });
  },

  incQty() {
    const qty = Math.min(this.data.qty + 1, 99);
    this._updateTotal(qty);
  },

  decQty() {
    const qty = Math.max(this.data.qty - 1, 1);
    this._updateTotal(qty);
  },

  _updateTotal(qty) {
    if (this.data.bundleMode) return;
    const q = qty !== undefined ? qty : this.data.qty;
    const totalPrice = (Number(this.data.product.price) * q).toFixed(2).replace(/\.00$/, '');
    this.setData({ qty: q, totalPrice });
  },

  submitOrder() {
    const {
      serviceAddr,
      doorNum,
      contactName,
      contactPhone,
      product,
      qty,
      workerId,
      serviceId,
      groupKey,
      bundleMode,
      bundleLines,
      spProviderId
    } = this.data;
    if (!serviceAddr) return wx.showToast({ title: '请选择服务地址', icon: 'none' });
    if (!contactName) return wx.showToast({ title: '请填写联系人', icon: 'none' });
    if (!contactPhone || contactPhone.length !== 11) return wx.showToast({ title: '请填写正确的联系电话', icon: 'none' });

    const fullAddress = [serviceAddr, doorNum].filter(Boolean).join(' ').trim() || serviceAddr;
    wx.showLoading({ title: '提交中...' });
    const userId = (app.globalData.user || {}).id;

    if (bundleMode) {
      const body = {
        address: fullAddress,
        contact_name: contactName,
        contact_phone: contactPhone,
        remark: this.data.remark || '',
        provider_id: Number(spProviderId),
        items: (bundleLines || []).map((it) => ({
          service_id: Number(it.service_id),
          group_key: it.group_key || '',
          qty: Number(it.qty) || 1,
          title: it.title
        }))
      };
      if (userId) body.user_id = userId;
      util
        .post('service-orders/bundle', body)
        .then((data) => {
          wx.hideLoading();
          const oid = data && (data.id || (data.order && data.order.id));
          if (oid) {
            wx.redirectTo({ url: '../service-order-detail/service-order-detail?id=' + oid });
          } else {
            wx.showToast({ title: '下单成功', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
          }
        })
        .catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '下单失败或服务未上线', icon: 'none' });
        });
      return;
    }

    const body = {
      address: fullAddress,
      contact_name: contactName,
      contact_phone: contactPhone,
      goods_name: product.name,
      goods_price: product.price,
      qty,
      remark: this.data.remark || ''
    };
    if (userId) body.user_id = userId;
    if (workerId) body.worker_id = Number(workerId);
    if (serviceId) body.service_id = Number(serviceId);
    if (groupKey) body.group_key = groupKey;

    const doneOk = (data) => {
      wx.hideLoading();
      if (data && data.id) {
        wx.redirectTo({ url: '../service-order-detail/service-order-detail?id=' + data.id });
      } else {
        wx.showToast({ title: '下单成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    };

    util.post('service-orders', body)
      .then((data) => doneOk(data))
      .catch((e) => {
        wx.hideLoading();
        const msg = (e && e.errmsg) || (e && e.msg) || '下单失败，请重试';
        wx.showToast({ title: msg, icon: 'none' });
      });
  },
});
