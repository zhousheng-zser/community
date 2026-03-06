const SHOP_LIST_BY_TITLE = {
  "家庭服务": [
    {
      id: 3,
      name: "四川洁而洁保洁有限公司",
      logo: "/img/placeholders/home_cleaning.png",
      score: "5分",
      monthSale: "月售1",
      delivery: "起送￥0",
      deliveryFee: "免配送费",
      previewGoods: [
        { id: 301, name: "日常保洁2小时起做", price: "45", oldPrice: "50", image: "/img/placeholders/home_cleaning.png" },
        { id: 302, name: "清洗油烟机(家用)", price: "160", oldPrice: "180", image: "/img/placeholders/home_cleaning.png" },
        { id: 303, name: "深度保洁(可擦玻璃)", price: "55", oldPrice: "60", image: "/img/placeholders/home_cleaning.png" },
        { id: 304, name: "清洗商用地毯10平米", price: "3", oldPrice: "5", image: "/img/placeholders/home_cleaning.png" }
      ]
    },
    {
      id: 4,
      name: "四川巢美环境卫生服务有限公司",
      logo: "/img/placeholders/home_cleaning.png",
      score: "5分",
      monthSale: "月售5",
      delivery: "起送￥0",
      deliveryFee: "免配送费",
      previewGoods: []
    }
  ],
  "超市便利": [
    {
      id: 1,
      name: "龙泉驿区艺源农副产品经营部",
      logo: "/img/placeholders/home_cleaning.png",
      score: "5分",
      monthSale: "月售31",
      delivery: "起送￥0",
      deliveryFee: "配送约￥3",
      previewGoods: [
        { id: 101, name: "现挖黄心土豆500g", price: "1.68", oldPrice: "2", image: "/img/placeholders/home_cleaning.png" },
        { id: 102, name: "甘孜现杀牦牛肉", price: "42.99", oldPrice: "46.8", image: "/img/placeholders/home_cleaning.png" },
        { id: 103, name: "甜白菜500克", price: "1.28", oldPrice: "1.5", image: "/img/placeholders/home_cleaning.png" },
        { id: 104, name: "高原蜂蜜", price: "39.8", oldPrice: "68", image: "/img/placeholders/home_cleaning.png" }
      ]
    },
    {
      id: 5,
      name: "洁柔日化",
      logo: "/img/placeholders/home_cleaning.png",
      score: "5分",
      monthSale: "月售0",
      delivery: "起送￥0",
      deliveryFee: "免配送费",
      previewGoods: []
    }
  ],
  "母婴生活馆": [
    {
      id: 2,
      name: "童趣母婴生活馆",
      logo: "/img/placeholders/home_cleaning.png",
      score: "5分",
      monthSale: "月售12",
      delivery: "起送￥0",
      deliveryFee: "免配送费",
      previewGoods: [
        { id: 201, name: "婴儿湿巾家庭装", price: "29.9", oldPrice: "39.9", image: "/img/placeholders/home_cleaning.png" },
        { id: 202, name: "儿童牙刷4支装", price: "12.8", oldPrice: "15.8", image: "/img/placeholders/home_cleaning.png" },
        { id: 203, name: "奶瓶清洗剂", price: "22.9", oldPrice: "29.9", image: "/img/placeholders/home_cleaning.png" },
        { id: 204, name: "儿童棉柔巾", price: "19.9", oldPrice: "25.9", image: "/img/placeholders/home_cleaning.png" }
      ]
    }
  ]
};

Page({
  data: {
    navTopPadding: 20,
    title: "母婴生活馆",
    shops: []
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    const title = options.title || "母婴生活馆";
    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 10,
      title,
      shops: SHOP_LIST_BY_TITLE[title] || SHOP_LIST_BY_TITLE["母婴生活馆"]
    });
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  },
  goShop(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: "../market-shop/market-shop?id=" + id });
  }
});
