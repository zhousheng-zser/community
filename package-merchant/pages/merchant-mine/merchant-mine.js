const app = getApp();
const rp = require('../../../utils/rolePortals.js');
const balance = require('../../../utils/balance.js');

const DEF_AVATAR =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    user: {},
    displayName: '商家',
    userPhoto: DEF_AVATAR,
    balanceText: '0.00',
    balanceLabel: '商家结算'
  },

  onShow() {
    const user = app.globalData.user || {};
    this.setData({
      user,
      displayName: user.userName || '商家',
      userPhoto: user.userPhoto || DEF_AVATAR
    });
    this.loadBalance();
  },

  async loadBalance() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ balanceText: '' });
      return;
    }
    try {
      const b = await balance.fetchBalanceFromServer(balance.BALANCE_TYPES.SERVICE_PROVIDER);
      this.setData({
        balanceText: balance.formatBalance(b),
        balanceLabel: balance.getBalanceLabel(balance.BALANCE_TYPES.SERVICE_PROVIDER)
      });
    } catch (e) {
      const localBalance = balance.getDisplayBalance(balance.BALANCE_TYPES.SERVICE_PROVIDER);
      this.setData({ balanceText: localBalance });
    }
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
