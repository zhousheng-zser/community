const MARKET_PRODUCT_MAP = {
  101: { name: "现挖黄心土豆500g", price: "1.68", pay: "1.68", rebate: "0.10", image: "/img/placeholders/home_cleaning.png", shop: "龙泉驿区艺源农副产品经营部" },
  102: { name: "韩国萝卜500g", price: "0.99", pay: "0.99", rebate: "0.08", image: "/img/placeholders/home_cleaning.png", shop: "龙泉驿区艺源农副产品经营部" },
  103: { name: "甜白菜500克", price: "1.28", pay: "1.28", rebate: "0.09", image: "/img/placeholders/home_cleaning.png", shop: "龙泉驿区艺源农副产品经营部" },
  104: { name: "青皮冬瓜", price: "2.50", pay: "2.50", rebate: "0.12", image: "/img/placeholders/home_cleaning.png", shop: "龙泉驿区艺源农副产品经营部" },
  105: { name: "红心红薯500g", price: "2.98", pay: "2.98", rebate: "0.15", image: "/img/placeholders/home_cleaning.png", shop: "龙泉驿区艺源农副产品经营部" },
  301: { name: "日常保洁2小时起做", price: "45.00", pay: "45.00", rebate: "1.58", image: "/img/placeholders/home_cleaning.png", shop: "四川洁而洁保洁有限公司" },
  302: { name: "清洗玻璃(内外)10平米起做", price: "9.00", pay: "9.00", rebate: "0.50", image: "/img/placeholders/home_cleaning.png", shop: "四川洁而洁保洁有限公司" },
  303: { name: "二手房翻新保洁50平米起做", price: "9.00", pay: "9.00", rebate: "0.50", image: "/img/placeholders/home_cleaning.png", shop: "四川洁而洁保洁有限公司" },
  304: { name: "精开荒保洁(含柜子)50平米起做", price: "7.00", pay: "7.00", rebate: "0.45", image: "/img/placeholders/home_cleaning.png", shop: "四川洁而洁保洁有限公司" },
  305: { name: "开荒保洁(不含柜子)50平米起做", price: "5.00", pay: "5.00", rebate: "0.35", image: "/img/placeholders/home_cleaning.png", shop: "四川洁而洁保洁有限公司" }
};

Page({
  data: {
    navTopPadding: 20,
    shopId: 1,
    product: {
      name: "【50片/箱】腹说五黑全麦风吹饼",
      price: "9.90",
      pay: "9.90",
      rebate: "1.58",
      image: "/img/placeholders/home_cleaning.png",
      shop: "腹说营养旗舰店"
    },
    showBuyPanel: false,
    buyQty: 1,
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    const id = Number(options.id || 0);
    const product = MARKET_PRODUCT_MAP[id] || this.data.product;
    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 6,
      product,
      shopId: Number(options.shopId || 1)
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
  goShopAll() {
    wx.navigateTo({ url: "../market-shop/market-shop?id=" + this.data.shopId });
  },

  openBuyPanel() { this.setData({ showBuyPanel: true }); },
  closeBuyPanel() { this.setData({ showBuyPanel: false }); },
  incQty() { this.setData({ buyQty: Math.min(this.data.buyQty + 1, 99) }); },
  decQty() { this.setData({ buyQty: Math.max(this.data.buyQty - 1, 1) }); },

  confirmBuy() {
    const { product, buyQty, shopId } = this.data;
    this.setData({ showBuyPanel: false });
    wx.navigateTo({
      url: `../order-confrim/order-confrim?name=${encodeURIComponent(product.name)}&price=${product.price}&image=${encodeURIComponent(product.image)}&qty=${buyQty}&shopId=${shopId}`
    });
  }
});
