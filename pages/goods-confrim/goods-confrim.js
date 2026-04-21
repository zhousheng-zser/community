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

  calcPrices() {
    let sum = 0;
    this.data.items.forEach(it => {
      sum += it.quantity * parseFloat(it.price || 0);
    });

    let delivery = this.data.deliveryType === 'express' ? 5.00 : 0.00;
    // 假设满50免运费
    if (sum >= 50) delivery = 0;

    let discount = 0; // 暂无优惠券逻辑

    let pay = sum + delivery - discount;

    this.setData({
      goodsAmount: sum.toFixed(2),
      deliveryFee: delivery.toFixed(2),
      discountAmount: discount.toFixed(2),
      payableAmount: pay.toFixed(2)
    });
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
      // 此处对接真实的创单API : POST /api/market/order/create
      // const res = await util.post('api/market/order/create', payload);
      
      // MOCK延时模拟接口返回
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockOrderNo = 'ODR' + new Date().getTime();

      // 提交成功，此时如果要清理购物车
      if (this.data.fromUrl === 'cart') {
        wx.removeStorageSync(`cart_${this.data.shopId}`);
      }
      wx.removeStorageSync('temp_checkout_items');

      wx.hideLoading();
      wx.showToast({ title: '下单成功', icon: 'success' });
      
      // 下单成功后跳转去支付流或者订单详情
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/market-order-detail/market-order-detail?orderNo=${mockOrderNo}` });
      }, 1500);

    } catch (e) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: '系统错误，请重试', icon: 'none' });
    }
  }
});
