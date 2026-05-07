const app = getApp();
const util = require('../../../utils/util.js');
const { unwrapList } = util;
const rp = require('../../../utils/rolePortals.js');
const mshop = require('../../../utils/merchantShopContext.js');
const api = require('../../../api/index.js');

const DEF_AVATAR =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '上午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

function hasMerchantRole(user) {
  if (!user) return false;
  const roleRaw = user.role;
  if (Array.isArray(roleRaw)) return roleRaw.includes('merchant');
  if (typeof roleRaw === 'string') return roleRaw.split(',').map((x) => x.trim()).includes('merchant');
  return false;
}

Page({
  data: {
    marketOk: false,
    bannerText: '',
    greeting: '你好',
    displayName: '商家',
    userPhoto: DEF_AVATAR,
    orderStats: null,
    goodsCount: 0,
    lowStockCount: 0
  },

  onShow() {
    this.refresh();
    if (this.data.marketOk && hasMerchantRole(app.globalData.user || {})) {
      this.loadOrderStats();
      this.loadGoodsStats();
    } else {
      this.setData({ orderStats: null, goodsCount: 0, lowStockCount: 0 });
    }
  },

  onPullDownRefresh() {
    this.refresh();
    if (this.data.marketOk && hasMerchantRole(app.globalData.user || {})) {
      this.loadOrderStats();
      this.loadGoodsStats();
    } else {
      this.setData({ orderStats: null, goodsCount: 0, lowStockCount: 0 });
    }
    wx.stopPullDownRefresh();
  },

  refresh() {
    const user = app.globalData.user || {};
    const marketOk = rp.canUseMarketPortal(user);
    let bannerText = '';
    if (!marketOk) {
      const st = user.merchant_status != null ? user.merchant_status : user.merchantStatus;
      if (st === 'pending') bannerText = '集市商家入驻审核中，通过后可管理订单';
      else if (st === 'rejected') bannerText = '入驻未通过，可重新提交资料';
      else bannerText = '请先完成集市商家入驻，审核通过后可使用本工作台';
    } else {
      bannerText = '您已绑定集市店铺，可管理商品、库存与买家订单';
    }
    this.setData({
      marketOk,
      bannerText,
      greeting: getGreeting(),
      displayName: user.userName || '商家',
      userPhoto: user.userPhoto || DEF_AVATAR
    });
  },

  async loadOrderStats() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ orderStats: null });
      return;
    }
    try {
      let res = await api.merchant.getOrders({ page: 1, limit: 100 });
      const raw = unwrapList(res);
      let today = 0;
      raw.forEach((o) => {
        const t = o.created_at || o.createdAt;
        if (isToday(t)) today += 1;
      });
      this.setData({
        orderStats: {
          total: raw.length,
          today
        }
      });
    } catch (e) {
      this.setData({ orderStats: { total: 0, today: 0 } });
    }
  },

  async loadGoodsStats() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ goodsCount: 0, lowStockCount: 0 });
      return;
    }
    try {
      const { shopId } = mshop.getBoundShop(app);
      const goodsParams = mshop.goodsListQuery(shopId);
      let res = await api.merchant.getGoods(goodsParams);
      let raw = unwrapList(res);
      raw = mshop.filterGoodsByShop(raw, shopId);
      const safeDef = 5;
      let low = 0;
      raw.forEach((g) => {
        const stock = g.stock != null ? g.stock : g.inventory != null ? g.inventory : 0;
        const safe = g.safe_stock != null ? g.safe_stock : g.low_stock_threshold != null ? g.low_stock_threshold : safeDef;
        if (Number(stock) <= Number(safe)) low += 1;
      });
      this.setData({
        goodsCount: raw.length,
        lowStockCount: low
      });
    } catch (e) {
      this.setData({ goodsCount: 0, lowStockCount: 0 });
    }
  },

  goGoods() {
    wx.navigateTo({ url: '/package-merchant/pages/merchant-goods/merchant-goods' });
  },

  goOrders() {
    wx.navigateTo({ url: '/package-merchant/pages/merchant-orders/merchant-orders' });
  },

  goMine() {
    wx.navigateTo({ url: '/package-merchant/pages/merchant-settings/merchant-settings' });
  },

  goJoin() {
    wx.navigateTo({ url: '/package-merchant/pages/merchant-qualification/merchant-qualification' });
  },

  goAccount() {
    wx.navigateTo({ url: '/pages/account/account' });
  },

  goMarketShop() {
    const { shopId } = mshop.getBoundShop(app);
    if (!shopId) {
      wx.showToast({ title: '暂未绑定店铺', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/market-shop/market-shop?id=${encodeURIComponent(String(shopId))}` });
  },

  goGoodsShelfUp() {
    wx.navigateTo({ url: '/package-merchant/pages/merchant-goods/merchant-goods?mode=up' });
  },

  goGoodsShelfDown() {
    wx.navigateTo({ url: '/package-merchant/pages/merchant-goods/merchant-goods?mode=down' });
  },

  goCreateGoods() {
    wx.navigateTo({ url: '/package-merchant/pages/merchant-goods-edit/merchant-goods-edit?mode=create' });
  },

  backUser() {
    rp.backToUserTab();
  }
});
