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
      avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=240&q=80",
      tags: ["擅长", "衣柜收纳", "宠物喂养", "宠物搭遛", "衣服干洗", "家庭快修", "陪护作业"]
    },
    goods: [
      { name: "衣橱整理收纳（2小时）", price: "196/份", image: "https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=300&q=80" },
      { name: "羽绒服/大衣（任意2件）", price: "79/2件", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80" },
      { name: "马桶疏通", price: "158/洞", image: "https://images.unsplash.com/photo-1586798271654-0471bb628b71?w=300&q=80" }
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
