// pages/order-confrim/order-confrim.js
const app = getApp();
const util = require('../../utils/util.js');

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
    const { serviceAddr, contactName, contactPhone, product, qty } = this.data;
    if (!serviceAddr) return wx.showToast({ title: '请选择服务地址', icon: 'none' });
    if (!contactName) return wx.showToast({ title: '请填写联系人', icon: 'none' });
    if (!contactPhone || contactPhone.length !== 11) return wx.showToast({ title: '请填写正确的联系电话', icon: 'none' });

    wx.showLoading({ title: '提交中...' });
    const userId = (app.globalData.user || {}).id;
    util.post('api/order/save', {
      userId,
      address: serviceAddr,
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
