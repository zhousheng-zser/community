Page({
  data: {
    navTopPadding: 20,
    title: "母婴生活馆"
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 6,
      title: options.title || "母婴生活馆"
    });
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
