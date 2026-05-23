const checkoutStorage = require('../../utils/checkoutStorage.js');
const marketCart = require('../../utils/marketCartHelper.js');
const serviceCart = require('../../utils/serviceCartHelper.js');

Page({
  data: {
    navTop: 44,
    loading: true,
    loggedIn: false,
    marketGroups: [],
    serviceGroups: [],
    summary: { item_count: 0, market_count: 0, service_count: 0, shop_count: 0, provider_count: 0 },
    empty: true
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTop: (sys.statusBarHeight || 20) + 8 });
  },

  onShow() {
    const loggedIn = !!wx.getStorageSync('token');
    this.setData({ loggedIn });
    if (!loggedIn) {
      this.setData({
        loading: false,
        marketGroups: [],
        serviceGroups: [],
        empty: true,
        summary: { item_count: 0, market_count: 0, service_count: 0, shop_count: 0, provider_count: 0 }
      });
      return;
    }
    this.loadCart();
  },

  goBack() {
    wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/user/user' }) });
  },

  async loadCart() {
    this.setData({ loading: true });
    try {
      const [marketRes, serviceRes] = await Promise.all([
        marketCart.fetchCartGroups(),
        serviceCart.fetchCartGroups()
      ]);
      const marketGroups = (marketRes.groups || []).map((g) => marketCart.decorateGroup(g));
      const serviceGroups = (serviceRes.groups || []).map((g) => serviceCart.decorateGroup(g));
      const marketSummary = marketRes.summary || {};
      const serviceSummary = serviceRes.summary || {};
      const itemCount = Number(marketSummary.item_count || 0) + Number(serviceSummary.item_count || 0);
      this.setData({
        marketGroups,
        serviceGroups,
        summary: {
          item_count: itemCount,
          market_count: Number(marketSummary.item_count || 0),
          service_count: Number(serviceSummary.item_count || 0),
          shop_count: Number(marketSummary.shop_count || 0),
          provider_count: Number(serviceSummary.provider_count || 0)
        },
        empty: !marketGroups.length && !serviceGroups.length,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false, marketGroups: [], serviceGroups: [], empty: true });
      wx.showToast({ title: (e && (e.msg || e.errmsg)) || '加载失败', icon: 'none' });
    }
  },

  goMarketShop(e) {
    const shopId = e.currentTarget.dataset.shopId;
    if (!shopId) return;
    wx.navigateTo({ url: `../market-shop/market-shop?id=${shopId}` });
  },

  goServiceProvider(e) {
    const providerId = e.currentTarget.dataset.providerId;
    if (!providerId) return;
    wx.navigateTo({ url: `../service-provider-shop/service-provider-shop?provider_id=${providerId}` });
  },

  async changeMarketQty(e) {
    const itemId = e.currentTarget.dataset.id;
    const delta = Number(e.currentTarget.dataset.delta) || 0;
    const groupIndex = Number(e.currentTarget.dataset.gindex);
    const itemIndex = Number(e.currentTarget.dataset.iindex);
    if (!itemId || !delta) return;
    const group = this.data.marketGroups[groupIndex];
    const item = group && group.items[itemIndex];
    if (!item) return;
    const nextQty = Math.max(0, Number(item.quantity || 0) + delta);
    try {
      await marketCart.updateItemQty(itemId, nextQty);
      await this.loadCart();
    } catch (err) {
      wx.showToast({ title: (err && (err.msg || err.errmsg)) || '操作失败', icon: 'none' });
    }
  },

  async changeServiceQty(e) {
    const itemId = e.currentTarget.dataset.id;
    const delta = Number(e.currentTarget.dataset.delta) || 0;
    const groupIndex = Number(e.currentTarget.dataset.gindex);
    const itemIndex = Number(e.currentTarget.dataset.iindex);
    if (!itemId || !delta) return;
    const group = this.data.serviceGroups[groupIndex];
    const item = group && group.items[itemIndex];
    if (!item) return;
    const nextQty = Math.max(0, Number(item.quantity || 0) + delta);
    try {
      await serviceCart.updateItemQty(itemId, nextQty);
      await this.loadCart();
    } catch (err) {
      wx.showToast({ title: (err && (err.msg || err.errmsg)) || '操作失败', icon: 'none' });
    }
  },

  removeMarketItem(e) {
    const itemId = e.currentTarget.dataset.id;
    if (!itemId) return;
    wx.showModal({
      title: '提示',
      content: '确定删除该商品？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await marketCart.removeItem(itemId);
          await this.loadCart();
        } catch (err) {
          wx.showToast({ title: (err && (err.msg || err.errmsg)) || '删除失败', icon: 'none' });
        }
      }
    });
  },

  removeServiceItem(e) {
    const itemId = e.currentTarget.dataset.id;
    if (!itemId) return;
    wx.showModal({
      title: '提示',
      content: '确定删除该服务？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await serviceCart.removeItem(itemId);
          await this.loadCart();
        } catch (err) {
          wx.showToast({ title: (err && (err.msg || err.errmsg)) || '删除失败', icon: 'none' });
        }
      }
    });
  },

  clearMarketShop(e) {
    const shopId = e.currentTarget.dataset.shopId;
    const shopName = e.currentTarget.dataset.shopName || '该店铺';
    if (!shopId) return;
    wx.showModal({
      title: '清空店铺购物车',
      content: `确定清空「${shopName}」的全部商品？`,
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await marketCart.clearShopCart(shopId);
          wx.showToast({ title: '已清空', icon: 'success' });
          await this.loadCart();
        } catch (err) {
          wx.showToast({ title: (err && (err.msg || err.errmsg)) || '清空失败', icon: 'none' });
        }
      }
    });
  },

  clearServiceProvider(e) {
    const providerId = e.currentTarget.dataset.providerId;
    const providerName = e.currentTarget.dataset.providerName || '该服务商';
    if (!providerId) return;
    wx.showModal({
      title: '清空服务商购物车',
      content: `确定清空「${providerName}」的全部服务？`,
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await serviceCart.clearProviderCart(providerId);
          wx.showToast({ title: '已清空', icon: 'success' });
          await this.loadCart();
        } catch (err) {
          wx.showToast({ title: (err && (err.msg || err.errmsg)) || '清空失败', icon: 'none' });
        }
      }
    });
  },

  clearAllCart() {
    if (!this.data.marketGroups.length && !this.data.serviceGroups.length) return;
    wx.showModal({
      title: '清空全部购物车',
      content: '将删除购物车和直约服务中的所有项目，是否继续？',
      confirmColor: '#e54d42',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await Promise.all([
            marketCart.clearAllCart().catch(() => {}),
            serviceCart.clearAllCart().catch(() => {})
          ]);
          wx.showToast({ title: '已全部清空', icon: 'success' });
          await this.loadCart();
        } catch (err) {
          wx.showToast({ title: (err && (err.msg || err.errmsg)) || '清空失败', icon: 'none' });
        }
      }
    });
  },

  goMarketSettle(e) {
    const shopId = e.currentTarget.dataset.shopId;
    const group = (this.data.marketGroups || []).find((g) => String(g.shop_id) === String(shopId));
    if (!group || !group.canSettle) {
      wx.showToast({ title: '没有可结算商品', icon: 'none' });
      return;
    }
    const payload = marketCart.buildCheckoutPayload(group);
    if (!payload.goods.length) {
      wx.showToast({ title: '没有可结算商品', icon: 'none' });
      return;
    }
    checkoutStorage.saveCheckout(payload);
    wx.navigateTo({ url: `../goods-confrim/goods-confrim?from=local&shopId=${shopId}` });
  },

  goServiceSettle(e) {
    const providerId = e.currentTarget.dataset.providerId;
    const group = (this.data.serviceGroups || []).find((g) => String(g.provider_id) === String(providerId));
    if (!group || !group.canSettle) {
      wx.showToast({ title: '没有可结算服务', icon: 'none' });
      return;
    }
    const payload = serviceCart.buildCheckoutPayload(group);
    if (!payload.items.length) {
      wx.showToast({ title: '没有可结算服务', icon: 'none' });
      return;
    }
    wx.setStorageSync('sp_bundle_checkout', payload);
    wx.navigateTo({
      url: `/pages/order-confrim/order-confrim?mode=sp_bundle&provider_id=${encodeURIComponent(providerId)}`
    });
  },

  goLogin() {
    wx.navigateTo({ url: '../login/login' });
  }
});
