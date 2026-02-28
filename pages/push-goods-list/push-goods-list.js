Page({
  data: {
    navTopPadding: 20,
    theme: "brown",
    tabs: ["九州好食", "九州好味", "九州好物"],
    goods: [
      { id: 11, name: "贵州大方六龙爆浆美味小豆腐", price: "19.90", image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=420&q=80" },
      { id: 12, name: "试吃两节香肠任选", price: "28.00", image: "https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?w=420&q=80" },
      { id: 13, name: "高钙淡干虾皮", price: "12.90", image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=420&q=80" },
      { id: 14, name: "颗粒饱满干贝柱", price: "68.90", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=420&q=80" }
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
