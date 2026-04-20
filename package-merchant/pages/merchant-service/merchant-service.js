const rp = require('../../../utils/rolePortals.js');

Page({
  goHome() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-home') });
  },

  goOrders() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-orders') });
  },

  goMine() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-mine') });
  },

  /** 店铺订单并默认「售后」分组，处理客户退单/退款相关订单 */
  goMerchantAfterSale() {
    wx.navigateTo({
      url: '/package-merchant/pages/merchant-orders/merchant-orders?tab=after_sale'
    });
  },

  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  },

  goMessage() {
    wx.navigateTo({ url: '/pages/message/message' });
  },

  goMarketOrdersBuyer() {
    wx.navigateTo({ url: '/pages/market-order-list/market-order-list' });
  },

  backUser() {
    rp.backToUserTab();
  }
});
