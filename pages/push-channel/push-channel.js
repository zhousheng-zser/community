Page({
  data: {
    navTopPadding: 20,
    categories: ['九州好食', '九州好味', '九州好物'],
    currentTab: 0,
    allGoods: [
      [ // 九州好食
        { id: 101, name: "贵州大方六龙爆浆美味小豆腐", price: "19.90", shareTag: "分享赚/购买返￥3.82", image: "/img/placeholders/home_cleaning.png", tag: "爆浆小豆腐 486g" },
        { id: 102, name: "直播福利！！ 试吃两节 香肠口味任选香肠川...", price: "28.00", shareTag: "分享赚/购买返￥1.43", image: "/img/placeholders/home_repair.png" },
        { id: 103, name: "霞浦正宗干贝瑶柱 颗粒饱满肉质紧实 煲汤煮...", price: "39.90", shareTag: "分享赚/购买返￥2.10", image: "/img/placeholders/home_repair.png" },
        { id: 104, name: "高钙淡干虾皮 无盐少添加 天然晾晒锁鲜", price: "45.00", shareTag: "分享赚/购买返￥5.00", image: "/img/placeholders/home_cleaning.png" }
      ],
      [ // 九州好味
        { id: 201, name: "四川特色老坛酸菜", price: "15.80", shareTag: "分享赚/购买返￥1.50", image: "/img/placeholders/home_repair.png" },
        { id: 202, name: "秘制香辣红油辣椒酱", price: "22.50", shareTag: "分享赚/购买返￥2.20", image: "/img/placeholders/home_cleaning.png" }
      ],
      [ // 九州好物
        { id: 301, name: "竹编收纳篮手工编织", price: "58.00", shareTag: "分享赚/购买返￥6.80", image: "/img/placeholders/home_cleaning.png" },
        { id: 302, name: "景德镇陶瓷茶具套装", price: "128.00", shareTag: "分享赚/购买返￥15.00", image: "/img/placeholders/home_repair.png" }
      ]
    ],
    goods: []
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();

    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 6,
      goods: this.data.allGoods[0]
    });
  },
  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    console.log("Tab clicked! Index:", index);
    console.log("New goods to load:", this.data.allGoods[index]);
    this.setData({
      currentTab: index,
      goods: this.data.allGoods[index]
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
