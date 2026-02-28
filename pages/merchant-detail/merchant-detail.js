Page({
  data: {
    navTopPadding: 20,
    merchant: {
      name: "四川云朵空间家政工作室",
      avatar: "/img/聚收藏.png",
      time: "00:00-23:59"
    },
    goods: []
  },
  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  }
});
