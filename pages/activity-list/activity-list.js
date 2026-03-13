const util = require('../../utils/util.js');
const { imgUrl } = util;
Page({
  data: {
    navTopPadding: 20,
    tabs: ["热门服务", "孩子接送", "陪读辅导", "起居照顾", "育儿嫂"],
    activeTab: "热门服务",
    services: [
      { name: "代照看小孩", price: "50元/小时", sold: "已售1 好评率100%", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { name: "代接送小孩", price: "30元/次", sold: "已售0 好评率100%", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { name: "陪读辅导作业", price: "20元/小时", sold: "已售1 好评率100%", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
    ]
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
    if (options.tab) {
      const tabMap = {
        take: "热门服务",
        child: "孩子接送",
        escort: "陪读辅导",
        study: "陪读辅导",
        trash: "起居照顾",
        pet: "育儿嫂"
      };
      this.setData({ activeTab: tabMap[options.tab] || "热门服务" });
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
