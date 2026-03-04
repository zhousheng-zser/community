Page({
  data: {
    navTopPadding: 20,
    theme: "brown",
    tabs: ["九州好食", "九州好味", "九州好物"],
    goods: [
      { id: 11, name: "贵州大方六龙爆浆美味小豆腐", price: "19.90", image: "/img/placeholders/home_cleaning.png" },
      { id: 12, name: "试吃两节香肠任选", price: "28.00", image: "/img/placeholders/home_cleaning.png" },
      { id: 13, name: "高钙淡干虾皮", price: "12.90", image: "/img/placeholders/home_cleaning.png" },
      { id: 14, name: "颗粒饱满干贝柱", price: "68.90", image: "/img/placeholders/home_cleaning.png" }
    ]
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 6,
      theme: options.theme || "brown"
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
