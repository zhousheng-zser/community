Page({
  data: {
    navTopPadding: 20,
    skills: ["积分兑换", "爱心公益", "上门私厨", "人力综合服务", "养生按摩"],
    workers: [
      {
        id: 1,
        name: "何志",
        region: "四川巴中",
        gender: "♂",
        serviceCount: 0,
        exp: 4,
        desc: "主要从事建筑回收，全品类建材可回收",
        tags: ["组长", "上门回收"],
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&q=80"
      },
      {
        id: 2,
        name: "余静",
        region: "四川",
        gender: "♀",
        serviceCount: 1,
        exp: 20,
        desc: "我为人热情大方，乐于助人，喜欢家里整洁，给人舒适的感觉。",
        tags: ["组长", "宠物喂养", "衣柜收纳", "陪护作业"],
        avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=240&q=80"
      },
      {
        id: 3,
        name: "邓长超",
        region: "四川",
        gender: "♂",
        serviceCount: 0,
        exp: 0,
        desc: "可接送小孩、家政保洁、简单维修等上门服务。",
        tags: ["组长", "宠物喂养", "宠物搭遛", "衣柜干洗"],
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&q=80"
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
  goWorkerDetail(e) {
    wx.navigateTo({
      url: "../worker-detail/worker-detail?id=" + e.currentTarget.dataset.id
    });
  }
});
