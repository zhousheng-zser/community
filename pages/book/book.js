Page({
  data: {
    navTopPadding: 20,
    activeTab: "陪诊",
    tabs: ["代取", "接送小孩", "陪诊", "陪读"],
    perks: [
      { title: "单单立省", icon: "🐷" },
      { title: "优先派单", icon: "📄" },
      { title: "客服特权", icon: "👤" }
    ]
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
    if (options.tab) {
      const tabMap = {
        take: "代取",
        child: "接送小孩",
        escort: "陪诊",
        study: "陪读"
      };
      this.setData({ activeTab: tabMap[options.tab] || "陪诊" });
    }
  },
  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
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
