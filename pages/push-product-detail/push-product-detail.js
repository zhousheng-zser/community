const util = require('../../utils/util.js');
const config = require('../../utils/config.js');

const MARKET_PRODUCT_MAP = {
  101: { name: 'market product', price: '1.68', pay: '1.68', rebate: '0.10', image: '', shop: '' },
  102: { name: 'market product', price: '0.99', pay: '0.99', rebate: '0.08', image: '', shop: '' },
  103: { name: 'market product', price: '1.28', pay: '1.28', rebate: '0.09', image: '', shop: '' },
  104: { name: 'market product', price: '2.50', pay: '2.50', rebate: '0.12', image: '', shop: '' },
  105: { name: 'market product', price: '2.98', pay: '2.98', rebate: '0.15', image: '', shop: '' },
  301: { name: 'service product', price: '45.00', pay: '45.00', rebate: '1.58', image: '', shop: '' },
  302: { name: 'service product', price: '9.00', pay: '9.00', rebate: '0.50', image: '', shop: '' },
  303: { name: 'service product', price: '9.00', pay: '9.00', rebate: '0.50', image: '', shop: '' },
  304: { name: 'service product', price: '7.00', pay: '7.00', rebate: '0.45', image: '', shop: '' },
  305: { name: 'service product', price: '5.00', pay: '5.00', rebate: '0.35', image: '', shop: '' }
};

const decodeParam = (value) => {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
};

Page({
  data: {
    navTopPadding: 20,
    shopId: 0,
    product: {
      name: '',
      price: '',
      pay: '',
      rebate: '',
      image: '',
      shop: '',
      detail_images: []
    },
    recommendedGoods: [],
    recommendTitle: '本店推荐',
    shopAppId: 'wx0000000000000000',
    productId: 'PRODUCT_123456789',
    showStoreProduct: false,
    customStyle: {
      card: { 'background-color': '#ffffff', 'border-radius': '12px' },
      title: { color: '#333', 'font-weight': 'bold', 'font-size': '16px' },
      price: { color: '#ff6146', 'font-size': '18px' },
      'buy-button': { width: '100px', 'border-radius': '30px', 'background-color': '#ff6146', color: '#ffffff' }
    }
  },
  extractList(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.list)) return payload.list;
    if (payload && payload.data && Array.isArray(payload.data.list)) return payload.data.list;
    if (payload && payload.data && Array.isArray(payload.data)) return payload.data;
    if (payload && payload.data && payload.data.data && Array.isArray(payload.data.data.list)) {
      return payload.data.data.list;
    }
    return [];
  },
  unwrapLocalGoodsPayload(res) {
    let payload = res && typeof res === 'object' ? res : {};
    if (payload.data && typeof payload.data === 'object') payload = payload.data;
    if (payload.data && typeof payload.data === 'object') payload = payload.data;
    return payload;
  },
  collectGoodsFromPayload(value, acc) {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        if (item.id != null || item.goods_id != null || item.name || item.goods_name || item.title) {
          acc.push(item);
          return;
        }
        this.collectGoodsFromPayload(item, acc);
      });
      return;
    }
    if (!value || typeof value !== 'object') return;
    Object.keys(value).forEach((key) => {
      this.collectGoodsFromPayload(value[key], acc);
    });
  },
  firstValue() {
    for (let i = 0; i < arguments.length; i++) {
      const value = arguments[i];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return '';
  },
  normalizeMoney(value) {
    if (value === undefined || value === null || value === '') return '';
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toFixed(2).replace(/\.00$/, '');
  },
  normalizeRecommendGoods(item, idx) {
    const id = item.id || item.goods_id || idx;
    const name = item.name || item.title || item.goods_name || '';
    const rawImage = util.pickShopProductCoverRaw(item);
    const image = rawImage ? util.imgUrl(rawImage) : '';
    const price = this.normalizeMoney(this.firstValue(
      item.price,
      item.pay_price,
      item.goods_price,
      item.goodsRealPrice,
      item.original_price,
      item.origin_price
    ));
    return {
      id,
      name,
      image,
      price,
      detailUrl: `/pages/push-product-detail/push-product-detail?id=${encodeURIComponent(String(id))}&shopId=${encodeURIComponent(String(this.data.shopId || ''))}&image=${encodeURIComponent(image)}&name=${encodeURIComponent(name)}&price=${encodeURIComponent(price)}`
    };
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    const id = Number(options.id || 0);
    const navImage = decodeParam(options.image);
    const navName = decodeParam(options.name);
    const navPrice = decodeParam(options.price);
    const optionShopId = Number(options.shopId || 0);
    const mockProduct = MARKET_PRODUCT_MAP[id];
    const emptyProduct = {
      name: navName || '',
      price: this.normalizeMoney(navPrice),
      pay: this.normalizeMoney(navPrice),
      rebate: '',
      image: navImage || '',
      shop: '',
      detail_images: []
    };

    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 6,
      product: mockProduct ? {
        ...mockProduct,
        image: navImage || mockProduct.image,
        name: navName || mockProduct.name,
        price: navPrice ? this.normalizeMoney(navPrice) : mockProduct.price,
        pay: navPrice ? this.normalizeMoney(navPrice) : mockProduct.pay
      } : emptyProduct,
      shopId: optionShopId
    });

    if (optionShopId) {
      this.loadRecommendedGoods(optionShopId, id);
    }
    this.fetchRealProductDetail(id);
  },
  async fetchRealProductDetail(id) {
    if (!id) return;
    try {
      const res = await util.get(`market/goods/${id}`);
      const g = res && typeof res === 'object' ? (res.data != null ? res.data : res) : null;
      if (!g || (g.id == null && g.goods_id == null)) return;

      const shop = g.shop && typeof g.shop === 'object' ? g.shop : {};
      const store = g.store && typeof g.store === 'object' ? g.store : {};
      const merchant = g.merchant && typeof g.merchant === 'object' ? g.merchant : {};
      const nested = g.goods || g.good || {};
      const priceRaw = this.firstValue(
        g.original_price,
        g.origin_price,
        g.market_price,
        g.goodsRealPrice,
        g.goods_price,
        g.price,
        nested.original_price,
        nested.origin_price,
        nested.goodsRealPrice,
        nested.goods_price,
        nested.price
      );
      const payRaw = this.firstValue(
        g.price,
        g.pay_price,
        g.goods_price,
        g.goodsRealPrice,
        priceRaw,
        nested.price,
        nested.pay_price,
        nested.goods_price,
        nested.goodsRealPrice
      );
      const rebateRaw = this.firstValue(g.rebate_amount, g.comm, g.commission, nested.rebate_amount, nested.comm, 0);
      const mainRaw = util.pickShopProductCoverRaw(g) || util.pickShopProductCoverRaw(nested);
      const currentImage = this.data.product && this.data.product.image;
      const finalImage = mainRaw ? util.imgUrl(mainRaw) : (currentImage || '');
      const shopId = Number(this.firstValue(
        g.shop_id,
        g.shopId,
        g.store_id,
        g.storeId,
        g.market_shop_id,
        g.marketShopId,
        g.merchant_id,
        g.merchantId,
        nested.shop_id,
        nested.shopId,
        nested.store_id,
        nested.storeId,
        shop.id,
        shop.shop_id,
        shop.shopId,
        store.id,
        store.shop_id,
        store.shopId,
        merchant.id,
        merchant.shop_id,
        merchant.shopId,
        this.data.shopId,
        0
      ));

      this.setData({
        'product.name': g.name || g.title || g.goods_name || this.data.product.name || '',
        'product.price': this.normalizeMoney(priceRaw),
        'product.pay': this.normalizeMoney(payRaw),
        'product.rebate': this.normalizeMoney(rebateRaw),
        'product.image': finalImage,
        'product.detail_images': [],
        'product.shop': shop.name || shop.shop_name || store.name || store.shop_name || merchant.name || merchant.shop_name || g.shop_name || this.data.product.shop || '',
        shopId,
        shopAppId: g.shop_appid || g.shopAppId || this.data.shopAppId,
        productId: g.product_id || g.productId || String(g.id || g.goods_id)
      }, () => {
        if (shopId) {
          this.loadRecommendedGoods(shopId, Number(g.id || g.goods_id || id));
        } else {
          this.loadFallbackRecommendedGoods(Number(g.id || g.goods_id || id));
        }
      });
    } catch (e) {
      console.log('load product detail failed', e);
      wx.showToast({ title: '商品信息加载失败', icon: 'none' });
    }
  },
  async loadRecommendedGoods(shopId, currentId) {
    if (!shopId) {
      this.loadFallbackRecommendedGoods(currentId);
      return;
    }
    try {
      const res = await util.get(`market/shops/${shopId}/goods`, { page: 1, page_size: 30 });
      const list = this.extractList(res);
      const goods = list
        .filter((item) => Number(item.id || item.goods_id) !== Number(currentId))
        .map((item, idx) => this.normalizeRecommendGoods(item, idx))
        .filter((item) => item.id && item.name)
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);
      if (goods.length > 0) {
        this.setData({ recommendedGoods: goods, recommendTitle: '本店推荐' });
      } else {
        this.loadFallbackRecommendedGoods(currentId);
      }
    } catch (e) {
      console.log('load recommended goods failed', e);
      this.loadFallbackRecommendedGoods(currentId);
    }
  },
  async loadFallbackRecommendedGoods(currentId) {
    try {
      const res = await util.get('local-goods-home/modules', util.buildShopGoodsQuery({ distance_km: 5 }));
      const payload = this.unwrapLocalGoodsPayload(res);
      const candidates = [];
      this.collectGoodsFromPayload(payload, candidates);
      const seen = {};
      const goods = candidates
        .filter((item) => Number(item.id || item.goods_id) !== Number(currentId))
        .map((item, idx) => this.normalizeRecommendGoods(item, idx))
        .filter((item) => {
          if (!item.id || !item.name || seen[item.id]) return false;
          seen[item.id] = true;
          return true;
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);
      this.setData({ recommendedGoods: goods, recommendTitle: '相关推荐' });
    } catch (e) {
      console.log('load fallback recommended goods failed', e);
    }
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: '/pages/index/index' });
  },
  goHome() {
    const app = getApp();
    if (!app.globalData) app.globalData = {};
    app.globalData.targetIndexTab = '首页';
    wx.switchTab({ url: '/pages/index/index' });
  },
  goShopAll() {
    if (!this.data.shopId) return;
    wx.navigateTo({ url: '../market-shop/market-shop?id=' + this.data.shopId });
  },
  goRecommendGoods(e) {
    const url = e.currentTarget.dataset.url;
    if (url) wx.navigateTo({ url });
  },
  handleBuyClick() {
    if (!this.data.shopAppId || this.data.shopAppId.startsWith('wx0000')) {
      wx.showToast({ title: '当前商品暂不支持直接购买', icon: 'none' });
    }
    this.setData({
      showStoreProduct: true
    });
  },
  onStoreProductSuccess(e) {
    console.log('store product order success', e.detail);
    const app = getApp();
    const openid = app.globalData.user ? app.globalData.user.opId : wx.getStorageSync('openid');
    const apiUrl = `${config.imageBaseUrl.replace(/\/$/, '')}/api/reward/trigger`;

    wx.request({
      url: apiUrl,
      method: 'POST',
      data: {
        openid: openid,
        productId: this.data.productId,
        orderId: e.detail.orderId
      },
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({ title: '购买成功', icon: 'success' });
        } else {
          wx.showToast({ title: '订单已支付', icon: 'success' });
        }
      },
      fail: () => {
        console.error('report reward task failed');
      },
      complete: () => {
        this.setData({ showStoreProduct: false });
      }
    });
  },
  onStoreProductFail(e) {
    console.log('store product order failed or canceled', e.detail);
    wx.showToast({ title: '未下单', icon: 'none' });
    this.setData({ showStoreProduct: false });
  }
});
