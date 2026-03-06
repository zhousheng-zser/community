const SHOP_MAP = {
  1: {
    id: 1,
    cover: "/img/placeholders/home_cleaning.png",
    logo: "/img/placeholders/home_cleaning.png",
    name: "龙泉驿区艺源农副产品经营部",
    scoreText: "暂无评分",
    soldCount: "31",
    deliveryType: "邻工配送",
    businessHours: "09:00~22:00",
    categories: [
      { key: "vegetables", name: "有机蔬菜" },
      { key: "meat", name: "鲜猪牛肉" },
      { key: "fruits", name: "新鲜水果" },
      { key: "poultry", name: "农家土鸡土鸭" },
      { key: "grain", name: "粮油米面" },
      { key: "eggs", name: "农土鲜蛋" },
      { key: "mushroom", name: "菌菇类" },
      { key: "special", name: "土特产" },
      { key: "seafood", name: "海鲜" },
      { key: "soy", name: "豆制品类" }
    ],
    goodsByCategory: {
      vegetables: [
        { id: 101, name: "现挖黄心土豆500g", sold: "已售12", price: "1.68", oldPrice: "2", image: "/img/placeholders/home_cleaning.png" },
        { id: 102, name: "韩国萝卜500g", sold: "已售3", price: "0.99", oldPrice: "1.5", image: "/img/placeholders/home_cleaning.png" },
        { id: 103, name: "甜白菜500克", sold: "已售3", price: "1.28", oldPrice: "1.5", image: "/img/placeholders/home_cleaning.png" },
        { id: 104, name: "青皮冬瓜", sold: "已售2", price: "2.5", oldPrice: "3.8", image: "/img/placeholders/home_cleaning.png" },
        { id: 105, name: "红心红薯500g", sold: "已售2", price: "2.98", oldPrice: "3.5", image: "/img/placeholders/home_cleaning.png" }
      ],
      meat: [{ id: 111, name: "甘孜现杀牦牛肉", sold: "已售2", price: "42.99", oldPrice: "46.8", image: "/img/placeholders/home_cleaning.png" }],
      fruits: [{ id: 121, name: "应季水果拼盘", sold: "已售5", price: "19.9", oldPrice: "25.9", image: "/img/placeholders/home_cleaning.png" }],
      poultry: [{ id: 131, name: "农家土鸡1只", sold: "已售1", price: "68", oldPrice: "79", image: "/img/placeholders/home_cleaning.png" }],
      grain: [{ id: 141, name: "高原蜂蜜", sold: "已售6", price: "39.8", oldPrice: "68", image: "/img/placeholders/home_cleaning.png" }],
      eggs: [{ id: 151, name: "农家土鸡蛋30枚", sold: "已售4", price: "29.9", oldPrice: "36", image: "/img/placeholders/home_cleaning.png" }],
      mushroom: [{ id: 161, name: "鲜香菌菇组合", sold: "已售1", price: "16.8", oldPrice: "21.8", image: "/img/placeholders/home_cleaning.png" }],
      special: [{ id: 171, name: "本地风干肉", sold: "已售1", price: "58", oldPrice: "69", image: "/img/placeholders/home_cleaning.png" }],
      seafood: [{ id: 181, name: "冷鲜虾仁500g", sold: "已售2", price: "35.9", oldPrice: "42.9", image: "/img/placeholders/home_cleaning.png" }],
      soy: [{ id: 191, name: "手工豆腐", sold: "已售3", price: "6.8", oldPrice: "8.8", image: "/img/placeholders/home_cleaning.png" }]
    },
    phone: "199****6695",
    contact: "曹勤昌",
    categoryName: "超市便利",
    shopAddress: "四川省成都市龙泉驿区桃都大道",
    facadeImage: "/img/placeholders/home_cleaning.png",
    interiorImage: "/img/placeholders/home_cleaning.png",
    licenseImage: "/img/placeholders/home_cleaning.png"
  },
  3: {
    id: 3,
    cover: "/img/placeholders/home_cleaning.png",
    logo: "/img/placeholders/home_cleaning.png",
    name: "四川洁而洁保洁有限公司",
    scoreText: "暂无评分",
    soldCount: "1",
    deliveryType: "商家自配",
    businessHours: "06:00~23:14",
    categories: [
      { key: "professional", name: "专业保洁" },
      { key: "electric", name: "家电清洗" },
      { key: "home", name: "家居清洗" },
      { key: "large", name: "大型保洁清洗" }
    ],
    goodsByCategory: {
      professional: [
        { id: 301, name: "日常保洁2小时起做", sold: "已售2", price: "45", oldPrice: "50", image: "/img/placeholders/home_cleaning.png" },
        { id: 302, name: "清洗玻璃(内外)10平米起做", sold: "已售0", price: "9", oldPrice: "13", image: "/img/placeholders/home_cleaning.png" },
        { id: 303, name: "二手房翻新保洁50平米起做", sold: "已售0", price: "9", oldPrice: "13", image: "/img/placeholders/home_cleaning.png" },
        { id: 304, name: "精开荒保洁(含柜子)50平米起做", sold: "已售0", price: "7", oldPrice: "10", image: "/img/placeholders/home_cleaning.png" },
        { id: 305, name: "开荒保洁(不含柜子)50平米起做", sold: "已售0", price: "5", oldPrice: "8", image: "/img/placeholders/home_cleaning.png" }
      ],
      electric: [
        { id: 311, name: "清洗油烟机(家用)", sold: "已售0", price: "160", oldPrice: "180", image: "/img/placeholders/home_cleaning.png" }
      ],
      home: [{ id: 321, name: "沙发深度清洁", sold: "已售0", price: "66", oldPrice: "78", image: "/img/placeholders/home_cleaning.png" }],
      large: [{ id: 331, name: "商用地毯清洗10平米", sold: "已售0", price: "3", oldPrice: "5", image: "/img/placeholders/home_cleaning.png" }]
    },
    phone: "199****6695",
    contact: "曹勤昌",
    categoryName: "家庭服务",
    shopAddress: "四川省成都市龙泉驿区桃都大道",
    facadeImage: "/img/placeholders/home_cleaning.png",
    interiorImage: "/img/placeholders/home_cleaning.png",
    licenseImage: "/img/placeholders/home_cleaning.png"
  }
};

Page({
  data: {
    navTopPadding: 20,
    shop: {},
    activeTab: "goods",
    categories: [],
    activeCategoryKey: "",
    filteredGoods: [],
    cartCount: 0,
    totalAmount: "0.00"
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    const id = Number(options.id || 1);
    const shop = SHOP_MAP[id] || SHOP_MAP[1];
    const firstCategoryKey = shop.categories[0] ? shop.categories[0].key : "";
    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 8,
      shop,
      categories: shop.categories,
      activeCategoryKey: firstCategoryKey
    });
    this.filterGoods(firstCategoryKey);
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  },
  switchMainTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },
  switchCategory(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeCategoryKey: key });
    this.filterGoods(key);
  },
  filterGoods(key) {
    const { shop } = this.data;
    const list = (shop.goodsByCategory && shop.goodsByCategory[key]) || [];
    this.setData({ filteredGoods: list });
  },
  addGoods(e) {
    const price = Number(e.currentTarget.dataset.price || 0);
    const nextCount = this.data.cartCount + 1;
    const nextAmount = (Number(this.data.totalAmount) + price).toFixed(2);
    this.setData({
      cartCount: nextCount,
      totalAmount: nextAmount
    });
  },
  goProductDetail(e) {
    const id = e.currentTarget.dataset.id;
    const shopId = this.data.shop.id;
    wx.navigateTo({
      url: "../push-product-detail/push-product-detail?id=" + id + "&shopId=" + shopId
    });
  }
});
