Page({
  data: {
    navTopPadding: 20,
    worker: {
      name: "余静",
      gender: "♀",
      region: "四川",
      serviceCount: 1,
      exp: 20,
      desc: "我为人热情大方，乐于助人，喜欢家里整洁，给人舒适的感觉。",
      avatar: "/img/placeholders/home_cleaning.png",
      tags: ["擅长", "衣柜收纳", "宠物喂养", "宠物搭遛", "衣服干洗", "家庭快修", "陪护作业"]
    },
    goods: [
      { name: "衣橱整理收纳（2小时）", price: "196/份", image: "/img/placeholders/home_cleaning.png" },
      { name: "羽绒服/大衣（任意2件）", price: "79/2件", image: "/img/placeholders/home_cleaning.png" },
      { name: "马桶疏通", price: "158/洞", image: "/img/placeholders/home_cleaning.png" }
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
  goBuy() {
    wx.navigateTo({ url: "../service/service?id=2" });
  }
});
