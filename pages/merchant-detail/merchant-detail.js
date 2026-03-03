Page({
  data: {
    navTopPadding: 20,
    categoryExpanded: false,
    categories: [
      "积分兑换", "爱心公益", "上门私厨", "人力综合服务", "养生按摩",
      "衣物干洗", "专业辅导", "爱宠照护", "工匠艺人", "家庭陪护",
      "宝宝家事", "家庭保洁", "助老家事", "家电维修", "上门维修",
      "家修急事", "家电清洗", "甲醛治理", "康养护理", "上门美业",
      "衣物洗护", "上门服务", "上门安装", "保姆月嫂", "养车养护",
      "除螨服务", "开荒保洁", "深度保洁", "家居养护", "整理收纳",
      "助老护老", "闲置二手", "上门回收", "便民服务", "房屋装修"
    ],
    filterTabs: ["全部", "全部分类", "附近商家"],
    merchants: [
      {
        id: 1,
        name: "四川云朵空间家政工作室",
        orders: "服务0单",
        desc: "门店简介：",
        tags: ["擅长", "衣柜收纳", "全屋收纳", "搬家收纳", "厨房收纳"],
        avatar: "/img/聚收藏.png",
        role: "服务商"
      }
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
  toggleCategory() {
    this.setData({ categoryExpanded: !this.data.categoryExpanded });
  }
});
