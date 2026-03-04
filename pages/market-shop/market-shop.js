Page({
  data: {
    navTopPadding: 20,
    categories: ["桂花香薰", "桂花香包", "玫瑰香包", "香草香包", "古龙香包"],
    goods: [
      { id: 1, name: "明辉香薰", sold: "已售0", price: "5", oldPrice: "6", image: "/img/placeholders/home_cleaning.png" }
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
  },
  goProduct() {
    wx.navigateTo({ url: "../push-product-detail/push-product-detail?id=1" });
  }
});
