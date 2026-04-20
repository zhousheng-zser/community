const app = getApp();
const rp = require('../../../utils/rolePortals.js');

const DEF_AVATAR =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    user: {},
    displayName: '商家',
    userPhoto: DEF_AVATAR
  },

  onShow() {
    const user = app.globalData.user || {};
    this.setData({
      user,
      displayName: user.userName || '商家',
      userPhoto: user.userPhoto || DEF_AVATAR
    });
  },

  goHome() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-home') });
  },

  goOrders() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-orders') });
  },

  goService() {
    wx.redirectTo({ url: rp.merchantTabUrl('merchant-service') });
  },

  backUser() {
    rp.backToUserTab();
  }
});
