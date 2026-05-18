const util = require('../../utils/util.js');
const app = getApp();

Page({
  data: {
    shopId: '',
    fromUrl: '', // 'cart' 或 'buyNow'
    
    deliveryType: 'express', // express 到家, pickup 自提
    address: null, // 到家地址
    shopInfo: {
      name: '多宝严选超市 (高新店)',
      address: '高新区科技路某某商业街1层'
    },

    items: [], // 商品列表
    goodsAmount: '0.00',
    deliveryFee: '0.00',
    discountAmount: '0.00',
    payableAmount: '0.00',
    previewReady: false,
    selectedCoupon: null,
    couponLabel: '请选择优惠券',
    
    remark: '',
    submitting: false
  },
  pickFirstNumber() {
    for (let i = 0; i < arguments.length; i++) {
      const v = arguments[i];
      if (v === undefined || v === null || v === '') continue;
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
    return null;
  },
  onLoad(options) {
    this.setData({
      shopId: options.shopId || '',
      fromUrl: options.from || 'cart'
    });

    let items = [];
    const from = options.from || 'cart';

    // 来源: market-shop 店铺购物车 (local)
    if (from === 'local') {
      const localItems = wx.getStorageSync('local_checkout_goods') || [];
      const shopId = wx.getStorageSync('local_checkout_shop_id');
      const shopName = wx.getStorageSync('local_checkout_shop_name') || '';
      // 将 local 格式转为标准格式
      items = localItems.map((it, idx) => ({
        goodsId: it.goodsId,
        itemKey: `${it.goodsId || 'goods'}_${idx}`,
        name: it.goodsName,
        specsText: it.goodsBrief || '默认规格',
        price: Number(it.goodsRealPrice) || 0,
        image: it.goodsPictureUrl || '',
        quantity: it.goodsNum || 1
      }));
      if (shopId) this.setData({ shopId });
      if (shopName) this.setData({ 'shopInfo.name': shopName });
    } else {
      // 来源: goods-detail 商品详情页 (cart / buyNow)
      items = wx.getStorageSync('temp_checkout_items') || [];
    }

    items = items.map((it, idx) => ({
      ...it,
      itemKey: it.itemKey || `${it.goodsId || it.id || 'goods'}_${idx}`
    }));

    if (items.length === 0) {
      wx.showToast({ title: '订单数据丢失', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    this.setData({ items });
    this.calcPrices();
    this.loadDefaultAddress();
  },

  onShow() {
    const cached = wx.getStorageSync('checkout_selected_coupon');
    if (cached && cached.id) {
      this.setData({ selectedCoupon: cached });
    }
    if (this.data.items.length) this.calcPrices();
  },

  pickCoupon() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const goods = Number(this.data.goodsAmount) || 0;
    wx.navigateTo({
      url: `/package-customer/pages/coupon-select/coupon-select?order_amount=${goods}&from=market`
    });
  },

  switchDelivery(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ deliveryType: type });
    this.calcPrices();
  },

  chooseAddress() {
    // 拉起小程序的地址簿或者是我们内置的地址管理页
    wx.navigateTo({
      url: '/pages/address/address?type=select'
    });
  },

  loadDefaultAddress() {
    // 假设从全局/服务器拉取用户默认地址
    // 此处写死Mock
    this.setData({
      address: {
        name: '张先生',
        phone: '13800138000',
        province: '浙江省',
        city: '杭州市',
        district: '西湖区',
        detail: '某某小区1栋101室'
      }
    });
  },

  async calcPrices() {
    this.setData({ previewReady: false });

    // 组装预结算报文
    const payload = {
      shop_id: this.data.shopId,
      delivery_mode: this.data.deliveryType,
      items: this.data.items.map(it => ({
        goods_id: it.goodsId,
        quantity: it.quantity
      }))
    };
    const coupon = this.data.selectedCoupon;
    if (coupon && coupon.id) payload.coupon_issue_id = Number(coupon.id);
    try {
      const res = await util.post('market/orders/preview', payload);
      const data = (res && typeof res === 'object' && res.data && typeof res.data === 'object') ? res.data : (res || {});
      const goodsAmount = this.pickFirstNumber(data.goods_amount, data.goodsAmount, data.items_amount, data.itemsAmount, data.total_goods_amount);
      const deliveryFee = this.pickFirstNumber(data.delivery_fee, data.deliveryFee, data.freight_fee, data.freightFee, data.shipping_fee, data.shippingFee);
      const discountAmount = this.pickFirstNumber(data.discount_amount, data.discountAmount, data.coupon_amount, data.couponAmount, data.reduce_amount, data.reduceAmount);
      const payableAmount = this.pickFirstNumber(data.payable_amount, data.payableAmount, data.total_amount, data.totalAmount, data.amount);
      if (goodsAmount == null || deliveryFee == null || discountAmount == null || payableAmount == null) {
        throw new Error('preview fields missing');
      }

      const disc = Number(discountAmount || 0);
      let couponLabel = '请选择优惠券';
      if (coupon && coupon.id) {
        couponLabel = disc > 0
          ? (coupon.coupon_name || `已减¥${disc}`)
          : `未满${coupon.threshold_amount || 0}元不可用`;
        if (disc <= 0) {
          wx.removeStorageSync('checkout_selected_coupon');
          this.setData({ selectedCoupon: null });
        }
      }
      this.setData({
        goodsAmount: Number(goodsAmount || 0).toFixed(2),
        deliveryFee: Number(deliveryFee || 0).toFixed(2),
        discountAmount: disc.toFixed(2),
        payableAmount: Number(payableAmount || 0).toFixed(2),
        previewReady: true,
        couponLabel
      });
    } catch (err) {
      this.setData({
        goodsAmount: '0.00',
        deliveryFee: '0.00',
        discountAmount: '0.00',
        payableAmount: '0.00',
        previewReady: false
      });
      wx.showToast({ title: '预结算失败，请稍后重试', icon: 'none' });
    }
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  async submitOrder() {
    if (!this.data.previewReady) {
      wx.showToast({ title: '请先完成预结算', icon: 'none' });
      return;
    }
    if (this.data.deliveryType === 'express' && !this.data.address) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' });
      return;
    }

    if (this.data.submitting) return;
    this.setData({ submitting: true });
    wx.showLoading({ title: '正在提交...' });

    // 组装提交报文
    const payload = {
      shop_id: this.data.shopId,
      delivery_mode: this.data.deliveryType,
      address: this.data.deliveryType === 'express' ? this.data.address : null,
      remark: this.data.remark,
      items: this.data.items.map(it => ({
        goods_id: it.goodsId,
        quantity: it.quantity
      }))
    };
    const coupon = this.data.selectedCoupon;
    if (coupon && coupon.id) payload.coupon_issue_id = Number(coupon.id);

    try {
      // 真实创单API
      let res = null;
      try {
        res = await util.post('market/orders', payload);
      } catch (createErr) {
        // 兼容旧链路：部分环境仍保留 market/order/create
        res = await util.post('market/order/create', payload);
      }
      const orderNo = res.orderNo || res.order_no;

      if (!orderNo) throw new Error('创建订单失败，未返回单号');
      wx.removeStorageSync('checkout_selected_coupon');

      // 因为联调阶段，可以通过 mock-success 接口直接模拟支付成功
      // 先获取支付参数 (仅作展示或将来真实调用wx.requestPayment)
      await util.post('market/payments/create', { order_no: orderNo }).catch(()=>{});
      
      // 模拟支付成功
      await util.post('market/payments/mock-success', { order_no: orderNo });

      // 提交成功，清理购物车
      if (this.data.fromUrl === 'cart') {
        wx.removeStorageSync(`cart_${this.data.shopId}`);
      }
      if (this.data.fromUrl === 'local') {
        wx.removeStorageSync('local_checkout_goods');
        wx.removeStorageSync('local_checkout_totle');
        wx.removeStorageSync('local_checkout_shop_id');
        wx.removeStorageSync('local_checkout_shop_name');
      }
      wx.removeStorageSync('temp_checkout_items');

      wx.hideLoading();
      wx.showToast({ title: '支付成功', icon: 'success' });
      
      // 下单并支付成功后跳转订单详情
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/market-order-detail/market-order-detail?orderNo=${orderNo}` });
      }, 1500);

    } catch (e) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: '系统错误，请重试', icon: 'none' });
    }
  }
});
