Page({
  data: {
    navTopPadding: 20,
    topTab: "邻里帮帮",
    serviceTabs: [
      { key: "take", text: "代取", label: "取", placeholder: "填写取货地址", secondLabel: "收", secondPlaceholder: "填写收货地址" },
      { key: "child", text: "接送小孩", label: "服", placeholder: "填写接送服务地址", secondLabel: "", secondPlaceholder: "" },
      { key: "escort", text: "陪诊", label: "服", placeholder: "填写需陪诊服务地址", secondLabel: "", secondPlaceholder: "" },
      { key: "study", text: "陪读", label: "服", placeholder: "填写需陪读人服务地址", secondLabel: "", secondPlaceholder: "" },
      { key: "trash", text: "代扔垃圾", label: "服", placeholder: "填写上门服务地址", secondLabel: "", secondPlaceholder: "" },
      { key: "pet", text: "宠物喂养", label: "服", placeholder: "填写宠物服务地址", secondLabel: "", secondPlaceholder: "" }
    ],
    activeServiceTab: "take",
    history: [
      { tag: "代取", text: "帮取文件1件 重1公斤" }
    ]
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
    if (options.type) {
      this.setData({ activeServiceTab: options.type });
    }
  },
  switchServiceTab(e) {
    this.setData({ activeServiceTab: e.currentTarget.dataset.key });
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  },
  goMonthCard() {
    wx.navigateTo({ url: "../book/book?tab=" + this.data.activeServiceTab });
  },
  goServiceList() {
    wx.navigateTo({ url: "../activity-list/activity-list?tab=" + this.data.activeServiceTab });
  }
});
