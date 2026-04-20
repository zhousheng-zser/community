const app = getApp();
const util = require('../../../utils/util.js');
const { unwrapList } = util;
const rp = require('../../../utils/rolePortals.js');
const mshop = require('../../../utils/merchantShopContext.js');

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

Page({
  data: {
    merchantOk: false,
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
    this.loadOrderStats();
    this.loadGoodsStats();
  },

  onPullDownRefresh() {
    this.refresh();
    this.loadOrderStats();
    this.loadGoodsStats();
    wx.stopPullDownRefresh();
  },

  refresh() {
    const user = app.globalData.user || {};
    const merchantOk = rp.canUseMerchantPortal(user);
    let bannerText = '';
    if (!merchantOk) {
      const st = user.merchant_status || user.merchantStatus || user.shop_status || user.shopStatus;
      if (st === 'pending') bannerText = '商家入驻审核中，通过后可管理订单';
      else if (st === 'rejected') bannerText = '入驻未通过，可重新提交资料';
      else bannerText = '请先完成集市商家入驻，审核通过后可使用本工作台';
    } else {
      bannerText = '您已绑定店铺，可管理商品、库存与买家订单';
    }
    this.setData({
      merchantOk,
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
      let res;
      try {
        res = await util.get('market/merchant/orders', { page: 1, limit: 100 });
      } catch (e1) {
        if (e1 && (Number(e1.errno) === 404 || Number(e1.errno) === 501)) {
          res = await util.get('market/shop/orders', { page: 1, limit: 100 });
        } else {
          throw e1;
        }
      }
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
      let res;
      try {
        res = await util.get('market/merchant/goods', goodsParams);
      } catch (e1) {
        if (e1 && (Number(e1.errno) === 404 || Number(e1.errno) === 501)) {
          res = await util.get('market/shop/goods', goodsParams);
        } else {
          throw e1;
        }
      }
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
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-orders') });
  },

  goMine() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-mine') });
  },

  goService() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-service') });
  },

  goJoin() {
    wx.navigateTo({ url: '/pages/join-market/join-market' });
  },

  goAccount() {
    wx.navigateTo({ url: '/pages/account/account' });
  },

  goGoodsShelfUp() {
    wx.navigateTo({ url: '/package-merchant/pages/merchant-goods/merchant-goods?mode=up' });
  },

  goGoodsShelfDown() {
    wx.navigateTo({ url: '/package-merchant/pages/merchant-goods/merchant-goods?mode=down' });
  },

  goMarketShop() {
    wx.navigateTo({ url: '/pages/market-shop/market-shop' });
  },

  backUser() {
    rp.backToUserTab();
  },

  /** 虚构演示单，便于预览订单列表/详情（不请求后端） */
  goMockOrders() {
    wx.navigateTo({
      url: '/package-merchant/pages/merchant-orders/merchant-orders?mock=1'
    });
  }
});
