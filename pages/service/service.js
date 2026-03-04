Page({
  data: {
    navTopPadding: 20,
    service: {},
    specs: [],
    detailImages: [],
    descText: ""
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
    const id = Number(options.id || 1);
    const mockMap = {
      1: {
        title: "住院探视护理（预约）",
        subTitle: "住院探视护理（预约）",
        price: "免费预约",
        banner: "/img/placeholders/home_cleaning.png",
        tags: ["无额外收费", "未服务随时退", "不满意重服务"],
        spec: "住院探视护理（预约）",
        desc: "本次支付费用不包含医疗耗材，如您无法提供相关医疗耗材，可联系我们服务人员，由上门护士提供，费用需自理。",
        detailImages: [
          "/img/placeholders/home_cleaning.png",
          "/img/placeholders/home_cleaning.png"
        ]
      },
      2: {
        title: "【初开荒】60平以内含擦窗、除胶点漆点",
        subTitle: "【初开荒】60平以内 含擦窗、除胶点漆点",
        price: "480元/次",
        banner: "/img/placeholders/home_cleaning.png",
        tags: ["无额外收费", "未服务随时退", "不满意重服务"],
        spec: "【初开荒】60平以内含擦窗、除胶点漆点",
        desc: "家政开荒保洁服务，按面积与难度报价，包含客厅、卧室、厨卫基础清洁。",
        detailImages: [
          "/img/placeholders/home_cleaning.png",
          "/img/placeholders/home_cleaning.png",
          "/img/placeholders/home_cleaning.png"
        ]
      }
    };
    const service = mockMap[id] || mockMap[1];
    this.setData({
      service,
      specs: [service.spec],
      detailImages: service.detailImages,
      descText: service.desc
    });
  },
  orderConfrim() {
    wx.navigateTo({
      url: "../order-confrim/order-confrim?id=1"
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
