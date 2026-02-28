Page({
  data: {
    navTopPadding: 20,
    product: {
      name: "【50片/箱】腹说五黑全麦风吹饼",
      price: "9.90",
      pay: "9.90",
      rebate: "1.58",
      image: "https://images.unsplash.com/photo-1612198529147-6f7f38f4f9f5?w=800&q=80",
      shop: "腹说营养旗舰店"
    }
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
  goShopAll() {
    wx.navigateTo({ url: "../market-shop/market-shop?id=1" });
  }
});
