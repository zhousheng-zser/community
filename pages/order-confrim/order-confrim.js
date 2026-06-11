// pages/order-confrim/order-confrim.js
const app = getApp();
const util = require('../../utils/util.js');
const api = require('../../api/index.js');
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
    originalTotal: '0',
    discountAmount: '0',
    hasDiscount: false,
    couponLabel: '请选择优惠券',
    selectedCoupon: null,
    bundleMode: false,
    bundleLines: [],
    spProviderId: ''
  },

  onShow() {
    const cached = wx.getStorageSync('checkout_selected_coupon');
    if (cached && cached.id) {
      this.setData({ selectedCoupon: cached });
      this._recalcPayable();
    } else {
      this.setData({ selectedCoupon: null });
      this._tryAutoSelectCoupon();
    }
  },

  async _tryAutoSelectCoupon() {
    if (!wx.getStorageSync('token')) {
      this._recalcPayable();
      return;
    }
    const amount = this._goodsAmount();
    if (!amount || amount <= 0) {
      this._recalcPayable();
      return;
    }
    try {
      const res = await api.coupon.getAvailableCouponsForOrder({ order_amount: amount });
      const list = (res && res.list) || (res && res.data && res.data.list) || [];
      if (!list.length) {
        this._recalcPayable();
        return;
      }
      const best = list[0];
      const selected = {
        id: best.id,
        coupon_name: best.coupon_name || '满100减20新人券',
        coupon_money: best.coupon_money != null ? best.coupon_money : best.discount_amount,
        threshold_amount: best.threshold_amount != null ? best.threshold_amount : 0
      };
      wx.setStorageSync('checkout_selected_coupon', selected);
      this.setData({ selectedCoupon: selected });
    } catch (e) {
      console.log('自动选券失败', e);
    }
    this._recalcPayable();
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
        image: 'https://jshsp1.eds-tech.cn/uploads/file-1773395942165-45947155.png'
      };
      this.setData({
        bundleMode: true,
        spProviderId: providerId,
        bundleLines: items,
        product,
        qty: 1,
        workerId: '',
        serviceId: '',
        groupKey: ''
      });
      this.prefillDefaultAddress();
      this._recalcPayable();
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
    this.setData({ product, qty, workerId, serviceId, groupKey });
    this.prefillDefaultAddress();
    this._recalcPayable();
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
    } catch (e) { }
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
    this.setData({ qty: q });
    this._recalcPayable();
  },

  _goodsAmount() {
    if (this.data.bundleMode) return Number(this.data.product.price) || 0;
    return (Number(this.data.product.price) || 0) * (this.data.qty || 1);
  },

  _recalcPayable() {
    const goods = this._goodsAmount();
    let discount = 0;
    let couponLabel = '请选择优惠券';
    const coupon = this.data.selectedCoupon;
    if (coupon && coupon.id) {
      const threshold = Number(coupon.threshold_amount) || 0;
      const money = Number(coupon.coupon_money) || 0;
      if (goods >= threshold) {
        discount = Math.min(money, goods);
        couponLabel = coupon.coupon_name || `满${threshold}减${money}`;
      } else {
        couponLabel = `未满${threshold}元，不可用`;
        wx.removeStorageSync('checkout_selected_coupon');
        this.setData({ selectedCoupon: null });
      }
    } else if (!wx.getStorageSync('token')) {
      couponLabel = '登录后可使用优惠券';
    }
    const payable = Math.max(goods - discount, 0);
    const fmt = (n) => n.toFixed(2).replace(/\.00$/, '');
    this.setData({
      originalTotal: fmt(goods),
      discountAmount: discount > 0 ? fmt(discount) : '0',
      hasDiscount: discount > 0,
      totalPrice: fmt(payable),
      couponLabel
    });
  },

  pickCoupon() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const amount = this._goodsAmount();
    wx.navigateTo({
      url: `/package-customer/pages/coupon-select/coupon-select?order_amount=${amount}&from=service`
    });
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
    if (!bundleMode) {
      const sidCheck = Number(serviceId);
      if (!Number.isFinite(sidCheck) || sidCheck <= 0) {
        return wx.showToast({ title: '服务信息无效，请返回重选', icon: 'none' });
      }
    }
    if (!wx.getStorageSync('token')) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再下单',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/login/login' });
        }
      });
      return;
    }

    const fullAddress = [serviceAddr, doorNum].filter(Boolean).join(' ').trim() || serviceAddr;
    wx.showLoading({ title: '提交中...' });
    const userId = (app.globalData.user || {}).id;

    if (bundleMode) {
      const user = app.globalData.user || {};
      const communityId = user.community_id != null ? user.community_id : user.communityId;
      const body = {
        address: fullAddress,
        contact_name: contactName,
        contact_phone: contactPhone,
        remark: this.data.remark || '',
        provider_id: String(spProviderId),
        items: (bundleLines || []).map((it) => ({
          service_id: Number(it.service_id),
          group_key: it.group_key || '',
          qty: Number(it.qty) || 1,
          title: it.title
        }))
      };
      if (userId) body.user_id = userId;
      if (communityId != null && communityId !== '') {
        const cid = Number(communityId);
        if (Number.isFinite(cid) && cid > 0) body.community_id = cid;
      }
      util
        .post('service-orders/bundle', body)
        .then((data) => {
          wx.hideLoading();
          wx.removeStorageSync('sp_bundle_checkout');
          if (spProviderId && wx.getStorageSync('token')) {
            serviceCart.clearProviderCart(spProviderId).catch(() => {});
          }
          const oid = data && (data.id || (data.order && data.order.id));
          if (oid) {
            wx.redirectTo({ url: '../service-order-detail/service-order-detail?id=' + oid });
          } else {
            wx.showToast({ title: '下单成功', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
          }
        })
        .catch((err) => {
          wx.hideLoading();
          const msg = (err && (err.errmsg || err.msg || err.message)) || '下单失败或服务未上线';
          wx.showToast({ title: msg, icon: 'none' });
        });
      return;
    }

    const user = app.globalData.user || {};
    const communityId = user.community_id != null ? user.community_id : user.communityId;
    const body = {
      address: fullAddress,
      address_snapshot: {
        detail: fullAddress,
        contact: contactName,
        phone: contactPhone
      },
      contact_name: contactName,
      contact_phone: contactPhone,
      goods_name: product.name,
      goods_price: product.price,
      qty,
      remark: this.data.remark || ''
    };
    if (userId) body.user_id = userId;
    if (communityId != null && communityId !== '') {
      const cid = Number(communityId);
      if (Number.isFinite(cid) && cid > 0) body.community_id = cid;
    }
    if (workerId) body.worker_id = String(workerId);
    const sid = Number(serviceId);
    if (Number.isFinite(sid) && sid > 0) body.service_id = sid;
    if (groupKey) body.group_key = groupKey;
    const coupon = this.data.selectedCoupon;
    if (coupon && coupon.id) {
      body.coupon_issue_id = Number(coupon.id);
    }

    const doneOk = (data) => {
      wx.removeStorageSync('checkout_selected_coupon');
      wx.hideLoading();
      const oid = data && (data.id || data.order_id);
      const orderNo = data && (data.order_no || data.orderNo);
      const status = data && (data.status || '');
      if (oid) {
        let url = '../service-order-detail/service-order-detail?id=' + oid;
        if (orderNo && (status === 'pending_pay' || data.pay_status === 'unpaid')) {
          url += '&autoPay=1';
        }
        wx.redirectTo({ url });
      } else {
        wx.showToast({ title: '下单成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    };

    api.serviceOrder.createServiceOrder(body)
      .then((data) => doneOk(data))
      .catch((e) => {
        wx.hideLoading();
        const msg = (e && e.errmsg) || (e && e.msg) || '下单失败，请重试';
        wx.showToast({ title: msg, icon: 'none' });
      });
  },
});
