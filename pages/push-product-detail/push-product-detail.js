const util = require('../../utils/util.js');

const MARKET_PRODUCT_MAP = {
  101: { name: "现挖黄心土豆500g", price: "1.68", pay: "1.68", rebate: "0.10", image: "/img/placeholders/home_cleaning.png", shop: "龙泉驿区艺源农副产品经营部" },
  102: { name: "韩国萝卜500g", price: "0.99", pay: "0.99", rebate: "0.08", image: "/img/placeholders/home_cleaning.png", shop: "龙泉驿区艺源农副产品经营部" },
  103: { name: "甜白菜500克", price: "1.28", pay: "1.28", rebate: "0.09", image: "/img/placeholders/home_cleaning.png", shop: "龙泉驿区艺源农副产品经营部" },
  104: { name: "青皮冬瓜", price: "2.50", pay: "2.50", rebate: "0.12", image: "/img/placeholders/home_cleaning.png", shop: "龙泉驿区艺源农副产品经营部" },
  105: { name: "红心红薯500g", price: "2.98", pay: "2.98", rebate: "0.15", image: "/img/placeholders/home_cleaning.png", shop: "龙泉驿区艺源农副产品经营部" },
  301: { name: "日常保洁2小时起做", price: "45.00", pay: "45.00", rebate: "1.58", image: "/img/placeholders/home_cleaning.png", shop: "四川洁而洁保洁有限公司" },
  302: { name: "清洗玻璃(内外)10平米起做", price: "9.00", pay: "9.00", rebate: "0.50", image: "/img/placeholders/home_cleaning.png", shop: "四川洁而洁保洁有限公司" },
  303: { name: "二手房翻新保洁50平米起做", price: "9.00", pay: "9.00", rebate: "0.50", image: "/img/placeholders/home_cleaning.png", shop: "四川洁而洁保洁有限公司" },
  304: { name: "精开荒保洁(含柜子)50平米起做", price: "7.00", pay: "7.00", rebate: "0.45", image: "/img/placeholders/home_cleaning.png", shop: "四川洁而洁保洁有限公司" },
  305: { name: "开荒保洁(不含柜子)50平米起做", price: "5.00", pay: "5.00", rebate: "0.35", image: "/img/placeholders/home_cleaning.png", shop: "四川洁而洁保洁有限公司" }
};

Page({
  data: {
    navTopPadding: 20,
    shopId: 1,
    product: {
      name: "【50片/箱】腹说五黑全麦风吹饼",
      price: "9.90",
      pay: "9.90",
      rebate: "1.58",
      image: "/img/placeholders/home_cleaning.png",
      shop: "腹说营养旗舰店"
    },
    // 小店组件所需状态
    shopAppId: 'wx0000000000000000', // 联调时请替换为真实的微信小店 AppID
    productId: 'PRODUCT_123456789',  // 联调时请替换为真实的商品 ID
    showStoreProduct: false,
    customStyle: {
      card: { 'background-color': '#ffffff', 'border-radius': '12px' },
      title: { color: '#333', 'font-weight': 'bold', 'font-size': '16px' },
      price: { color: '#ff6146', 'font-size': '18px' },
      'buy-button': { width: '100px', 'border-radius': '30px', 'background-color': '#ff6146', color: '#ffffff' }
    }
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    const id = Number(options.id || 0);
    const mockProduct = MARKET_PRODUCT_MAP[id] || this.data.product;
    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 6,
      product: mockProduct,
      shopId: Number(options.shopId || 1)
    });

    // 从真实接口拉取对应 ID 商品详情
    this.fetchRealProductDetail(id);
  },
  async fetchRealProductDetail(id) {
    if (!id) return;
    try {
      const spRes = await util.get('api/v1/shop-products');
      const spData = Array.isArray(spRes) ? spRes : (spRes.data || spRes);
      if (Array.isArray(spData) && spData.length > 0) {
        const found = spData.find(s => s.id === id);
        if (found) {
          let detailImgs = [];
          if (found.detail_images) {
            try {
              detailImgs = typeof found.detail_images === 'string' ? JSON.parse(found.detail_images) : found.detail_images;
            } catch(e) {}
          }
          this.setData({
            'product.name': found.name,
            'product.price': found.original_price || found.pay_price,
            'product.pay': found.pay_price,
            'product.rebate': found.rebate_amount,
            'product.image': found.main_image,
            'product.detail_images': detailImgs,
            'product.shop': '家生活甄选专营店', // 或保留原逻辑，目前数据库中暂无店铺名
            shopAppId: found.shop_appid,
            productId: found.product_id
          });
        }
      }
    } catch(e) {
      console.log('加载推流商品详情异常', e);
    }
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  },
  goHome() {
    const app = getApp();
    if (!app.globalData) app.globalData = {};
    app.globalData.targetIndexTab = "首页";
    wx.switchTab({ url: "/pages/index/index" });
  },
  goShopAll() {
    wx.navigateTo({ url: "../market-shop/market-shop?id=" + this.data.shopId });
  },

  handleBuyClick() {
    // 拉起微信小店组件面板
    if (!this.data.shopAppId || this.data.shopAppId.startsWith('wx0000')) {
      wx.showToast({ title: '当前为Mock数据，无法真实拉起小店', icon: 'none' });
      // 在开发环境中可以通过改变该标记来强行展示组件（如果是假的话其实也会报错或空白）
    }
    this.setData({
      showStoreProduct: true
    });
  },

  onStoreProductSuccess(e) {
    console.log('用户在小店下单成功', e.detail);
    // 通知后端记录返利任务
    const app = getApp();
    const openid = app.globalData.user ? app.globalData.user.opId : wx.getStorageSync('openid');
    const apiUrl = 'http://114.55.167.14:3000/api/reward/trigger'; // 注意修改为真实的后端地址或统一请求前缀

    wx.request({
      url: apiUrl,
      method: 'POST',
      data: {
        openid: openid,
        productId: this.data.productId,
        orderId: e.detail.orderId // 从组件回调中取到小店真实订单号
      },
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({ title: '交易成功，返已追踪', icon: 'success' });
        } else {
          // 这里也可不报错给用户，只保留静默追踪
          wx.showToast({ title: '订单已支付', icon: 'success' });
        }
      },
      fail: () => {
        console.error('上报返利任务失败');
      },
      complete: () => {
        this.setData({ showStoreProduct: false });
      }
    });
  },

  onStoreProductFail(e) {
    console.log('用户在小店下单失败或主动取消', e.detail);
    wx.showToast({ title: '未下单', icon: 'none' });
    this.setData({ showStoreProduct: false });
  }
});
