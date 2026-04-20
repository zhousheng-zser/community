const app = getApp();
const rp = require('../../../utils/rolePortals.js');

const STORAGE_ACCEPT = 'worker_accept_orders';
const DEF_AVATAR =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    user: {},
    acceptOn: true,
    displayName: '师傅',
    userPhoto: DEF_AVATAR
  },

  onShow() {
    const user = app.globalData.user || {};
    let acceptOn = true;
    try {
      const v = wx.getStorageSync(STORAGE_ACCEPT);
      if (v === '0' || v === false) acceptOn = false;
    } catch (e) {}
    this.setData({
      user,
      acceptOn,
      displayName: user.userName || '师傅',
      userPhoto: user.userPhoto || DEF_AVATAR
    });
  },

  onAcceptChange(e) {
    const v = !!e.detail.value;
    try {
      wx.setStorageSync(STORAGE_ACCEPT, v ? '1' : '0');
    } catch (err) {}
    this.setData({ acceptOn: v });
    wx.showToast({ title: v ? '已开启接单' : '已暂停接单', icon: 'none' });
  },

  goHome() {
    wx.redirectTo({ url: rp.workerTabUrl('worker-home') });
  },

  goOrders() {
    wx.redirectTo({ url: rp.workerTabUrl('worker-orders') });
  },

  backUser() {
    rp.backToUserTab();
  }
});
