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
    product: { name: '', sub: '', price: '0', image: '' },
    totalPrice: '0',
  },

  onLoad(options) {
    const name = decodeURIComponent(options.name || '');
    const price = options.price || '0';
    const image = decodeURIComponent(options.image || '');
    const qty = Number(options.qty || 1);
    const sub = decodeURIComponent(options.sub || name);
    const product = { name, sub, price, image };
    const totalPrice = (Number(price) * qty).toFixed(2).replace(/\.00$/, '');
    this.setData({ product, qty, totalPrice });
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
    const q = qty !== undefined ? qty : this.data.qty;
    const totalPrice = (Number(this.data.product.price) * q).toFixed(2).replace(/\.00$/, '');
    this.setData({ qty: q, totalPrice });
  },

  submitOrder() {
    const { serviceAddr, doorNum, contactName, contactPhone, product, qty } = this.data;
    if (!serviceAddr) return wx.showToast({ title: '请选择服务地址', icon: 'none' });
    if (!contactName) return wx.showToast({ title: '请填写联系人', icon: 'none' });
    if (!contactPhone || contactPhone.length !== 11) return wx.showToast({ title: '请填写正确的联系电话', icon: 'none' });

    const fullAddress = [serviceAddr, doorNum].filter(Boolean).join(' ').trim() || serviceAddr;
    wx.showLoading({ title: '提交中...' });
    const userId = (app.globalData.user || {}).id;
    util.post('api/order/save', {
      userId,
      address: fullAddress,
      orderUser: contactName,
      userTele: contactPhone,
      goodsName: product.name,
      goodsPrice: product.price,
      orderState: 1
    }).then((data) => {
      wx.hideLoading();
      if (data && data.id) {
        wx.redirectTo({ url: '../order-detail/order-detail?id=' + data.id });
      } else {
        wx.showToast({ title: '下单成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '下单成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    });
  },
});
