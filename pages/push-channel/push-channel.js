Page({
  data: {
    navTopPadding: 20,
    goods: [
      { id: 1, name: "五黑风吹饼", price: "9.90", image: "/img/placeholders/home_cleaning.png" },
      { id: 2, name: "10提悬挂式抽纸", price: "6.90", image: "/img/placeholders/home_cleaning.png" },
      { id: 3, name: "玫瑰洗衣液", price: "26.90", image: "/img/placeholders/home_cleaning.png" },
      { id: 4, name: "情侣保暖内衣", price: "125.90", image: "/img/placeholders/home_cleaning.png" }
    ]
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
