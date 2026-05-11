const util = require('../../../utils/util.js');

const TITLE_TO_CHANNEL = {
  品牌好货: "brand_goods",
  寻找九州好物: "jiuzhou_haowu",
  秋冬好物: "autumn_winter",
  九州好食: "jiuzhou_haoshi",
  九州好物: "jiuzhou_haowu",
  九州好味: "jiuzhou_haowei"
};

const JIUZHOU_TABS = [
  { title: "九州好食", key: "jiuzhou_haoshi" },
  { title: "九州好物", key: "jiuzhou_haowu" },
  { title: "九州好味", key: "jiuzhou_haowei" }
];

Page({
  data: {
    navTopPadding: 20,
    pageTitle: "频道",
    channelKey: "jiuzhou_haowu",
    categories: [],
    currentTab: 0,
    allGoods: [],
    goods: []
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    const rawTitle = options.title ? decodeURIComponent(options.title) : "";
    const channelKey = TITLE_TO_CHANNEL[rawTitle] || "jiuzhou_haowu";
    const pageTitle = rawTitle || "九州好物";

    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 6,
      pageTitle,
      channelKey
    });

    if (rawTitle === "寻找九州好物") {
      this.loadAllJiuzhouChannels();
    } else {
      this.loadChannel(channelKey);
    }
  },
  async loadChannel(channelKey) {
    try {
      await util.ensureUserCoordsForShop();
      const q = util.buildShopGoodsQuery({
        channel_key: channelKey,
        page: 1,
        page_size: 80
      });
      const res = await util.get("local-goods-home/channel-products", q);
      const payload = res && typeof res === "object" ? (res.data || res) : {};

      if (Array.isArray(payload.tab_groups) && payload.tab_groups.length > 0) {
        const categories = payload.tab_groups.map((g) => g.tab_name || g.name || "分类");
        const allGoods = payload.tab_groups.map((g) => {
          const raw = g.goods_list || g.goods || g.items || [];
          const filtered = util.filterShopProductsByDistance(raw, 5);
          return filtered.map((it, i) => util.normalizeShopProductRow(it, i));
        });
        this.setData({
          categories,
          allGoods,
          currentTab: 0,
          goods: allGoods[0] || []
        });
        return;
      }

      const rawList = payload.list || payload.items || payload.goods_list || [];
      const filtered = util.filterShopProductsByDistance(rawList, 5);
      const goods = filtered.map((it, i) => util.normalizeShopProductRow(it, i));
      this.setData({
        categories: ["精选"],
        allGoods: [goods],
        currentTab: 0,
        goods
      });
    } catch (e) {
      console.log("channel-products 加载失败", e);
      this.setData({
        categories: [],
        allGoods: [],
        goods: []
      });
      wx.showToast({ title: "商品加载失败", icon: "none" });
    }
  },
  async loadAllJiuzhouChannels() {
    try {
      await util.ensureUserCoordsForShop();
    } catch (e) {
      console.log("定位失败，继续加载", e);
    }

    wx.showLoading({ title: "加载中...", mask: true });
    const categories = JIUZHOU_TABS.map((t) => t.title);
    const allGoods = [[], [], []];

    try {
      const results = await Promise.all(
        JIUZHOU_TABS.map((tab) => {
          const q = util.buildShopGoodsQuery({
            channel_key: tab.key,
            page: 1,
            page_size: 80
          });
          return util.get("local-goods-home/channel-products", q).then((res) => {
            const payload = res && typeof res === "object" ? (res.data || res) : {};
            const rawList = payload.list || payload.items || payload.goods_list || [];
            const filtered = util.filterShopProductsByDistance(rawList, 5);
            return filtered.map((it, i) => util.normalizeShopProductRow(it, i));
          }).catch((err) => {
            console.log(`channel-products ${tab.key} 失败`, err);
            return [];
          });
        })
      );

      results.forEach((list, idx) => {
        allGoods[idx] = list;
      });
    } catch (e) {
      console.log("并行加载九州分类失败", e);
    }

    wx.hideLoading();
    this.setData({
      categories,
      allGoods,
      currentTab: 0,
      goods: allGoods[0] || []
    });
  },
  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    const allGoods = this.data.allGoods || [];
    this.setData({
      currentTab: index,
      goods: allGoods[index] || []
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
