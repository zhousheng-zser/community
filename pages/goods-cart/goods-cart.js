// pages/goods-cart/goods-cart.js
Page({
  data: {
    navTopPadding: 20,
    messageCount: 0,
    messageList: []
  },
  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 8 });
  }
});
