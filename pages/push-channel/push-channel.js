Page({
  data: {
    navTopPadding: 20,
    goods: [
      { id: 1, name: "五黑风吹饼", price: "9.90", image: "https://images.unsplash.com/photo-1612198529147-6f7f38f4f9f5?w=420&q=80" },
      { id: 2, name: "10提悬挂式抽纸", price: "6.90", image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=420&q=80" },
      { id: 3, name: "玫瑰洗衣液", price: "26.90", image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=420&q=80" },
      { id: 4, name: "情侣保暖内衣", price: "125.90", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=420&q=80" }
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
