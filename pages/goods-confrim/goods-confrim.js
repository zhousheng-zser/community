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
    
    remark: '',
    submitting: false
  },

  onLoad(options) {
    this.setData({
      shopId: options.shopId || '',
      fromUrl: options.from || 'cart'
    });
    
    // 从本地缓存拿商品列
    const tempItems = wx.getStorageSync('temp_checkout_items') || [];
    if (tempItems.length === 0) {
      wx.showToast({ title: '订单数据丢失', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }
    
    this.setData({ items: tempItems });
    this.calcPrices();
    
    // 初始化默认地址
    this.loadDefaultAddress();
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
    // 组装预结算报文
    const payload = {
      shop_id: this.data.shopId,
      delivery_mode: this.data.deliveryType,
      items: this.data.items.map(it => ({
        goods_id: it.goodsId,
        sku_id: it.skuId,
        quantity: it.quantity
      }))
    };
    try {
      const res = await util.post('market/orders/preview', payload);
      const data = res || {};
      this.setData({
        goodsAmount: typeof data.goods_amount !== 'undefined' ? Number(data.goods_amount).toFixed(2) : '0.00',
        deliveryFee: typeof data.delivery_fee !== 'undefined' ? Number(data.delivery_fee).toFixed(2) : '0.00',
        discountAmount: typeof data.discount_amount !== 'undefined' ? Number(data.discount_amount).toFixed(2) : '0.00',
        payableAmount: typeof data.payable_amount !== 'undefined' ? Number(data.payable_amount).toFixed(2) : '0.00'
      });
    } catch (err) {
      wx.showToast({ title: '无法获取预结算信息', icon: 'none' });
    }
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  async submitOrder() {
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
        sku_id: it.skuId,
        goods_id: it.goodsId,
        quantity: it.quantity
      }))
    };

    try {
      // 真实创单API
      const res = await util.post('market/order/create', payload);
      const orderNo = res.orderNo || res.order_no;

      if (!orderNo) throw new Error('创建订单失败，未返回单号');

      // 因为联调阶段，可以通过 mock-success 接口直接模拟支付成功
      // 先获取支付参数 (仅作展示或将来真实调用wx.requestPayment)
      await util.post('market/payments/create', { order_no: orderNo }).catch(()=>{});
      
      // 模拟支付成功
      await util.post('market/payments/mock-success', { order_no: orderNo });

      // 提交成功，清理购物车
      if (this.data.fromUrl === 'cart') {
        wx.removeStorageSync(`cart_${this.data.shopId}`);
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
