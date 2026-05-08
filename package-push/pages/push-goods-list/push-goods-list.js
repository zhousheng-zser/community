const util = require('../../utils/util.js');

Page({
  data: {
    navTopPadding: 20,
    pageTitle: "专区",
    zoneId: "",
    isGiftZone: false,
    isSidebarLayout: false,
    isHighCommLayout: false,
    subCategories: [],
    sidebarCategories: [],
    activeSidebarCategory: "",
    giftSubActive: "",
    tabs: ["推荐", "最新", "销量", "价格"],
    goods: [],
    loading: false
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    const titles = {
      "1": "爆款专区",
      "2": "礼物专区",
      "3": "本地商城甄选",
      "4": "高佣专区"
    };
    const zoneId = String(options.id || "1");
    const title = titles[zoneId] || "特产专区";
    const isGiftZone = zoneId === "2";
    const isSidebarLayout = zoneId === "3";
    const isHighCommLayout = zoneId === "4";

    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 6,
      pageTitle: title,
      zoneId,
      isGiftZone,
      isSidebarLayout,
      isHighCommLayout,
      // 礼物专区：本地兜底子分类，后端有返回时覆盖
      subCategories: isGiftZone ? [
        { name: '送长辈', image: '/img/gifts/for_elders.png' },
        { name: '送朋友', image: '/img/gifts/for_friends.png' },
        { name: '送同事', image: '/img/gifts/for_colleagues.png' },
        { name: '送伴侣', image: '/img/gifts/for_partner.png' }
      ] : [],
      // 商城籁选：本地兜底左侧类目，后端有返回时覆盖
      sidebarCategories: isSidebarLayout ? [
        '食品生鲜', '家居百货', '美妆洗护',
        '服装箱包', '数码配件', '母婴系列',
        '传统工艺', '其他'
      ] : [],
      activeSidebarCategory: isSidebarLayout ? '食品生鲜' : ''
    });

    this.loadZoneProducts(zoneId, {});
  },
  async loadZoneProducts(zoneId, extra = {}) {
    this.setData({ loading: true });
    try {
      await util.ensureUserCoordsForShop();
      const q = util.buildShopGoodsQuery({
        zone_id: Number(zoneId),
        page: extra.page || 1,
        page_size: extra.page_size || 50,
        ...extra
      });
      const res = await util.get("local-goods-home/zone-products", q);
      const payload = res && typeof res === "object" ? (res.data || res) : {};
      const rawList = payload.list || payload.items || payload.goods_list || [];
      const filtered = util.filterShopProductsByDistance(rawList, 5);
      const goods = filtered.map((it, i) => util.normalizeShopProductRow(it, i));

      const subCategories = Array.isArray(payload.sub_categories)
        ? payload.sub_categories
        : (Array.isArray(payload.gift_sub_categories) ? payload.gift_sub_categories : []);


      const sidebarCategories = Array.isArray(payload.sidebar_categories)
        ? payload.sidebar_categories
        : [];

      const patch = {
        goods,
        loading: false
      };
      // 接口返回了子分类才覆盖本地兜底，否则保持 onLoad 设置的默认值
      if (subCategories.length > 0) {
        // 图片补全：接口未返图时用本地占位
        subCategories.forEach(sub => {
          if (!sub.image || sub.image === '') {
            if (sub.name === '送长辈') sub.image = '/img/gifts/for_elders.png';
            else if (sub.name === '送朋友') sub.image = '/img/gifts/for_friends.png';
            else if (sub.name === '送同事') sub.image = '/img/gifts/for_colleagues.png';
            else if (sub.name === '送伴侣') sub.image = '/img/gifts/for_partner.png';
          }
        });
        patch.subCategories = subCategories;
      }
      // 左侧类目：接口有返回才覆盖本地兜底
      // 注意：只在初次加载时设置默认选中，点击类目后不覆盖用户的选择
      if (sidebarCategories.length > 0) {
        patch.sidebarCategories = sidebarCategories;
        if (!extra.sidebar_category) {
          patch.activeSidebarCategory = sidebarCategories[0];
        }
      }
      this.setData(patch);
    } catch (e) {
      console.log("zone-products 加载失败", e);
      this.setData({ goods: [], loading: false });
      wx.showToast({ title: "商品加载失败", icon: "none" });
    }
  },
  handleSidebarClick(e) {
    const category = e.currentTarget.dataset.name;
    if (!category) return;
    this.setData({ activeSidebarCategory: category });
    this.loadZoneProducts(this.data.zoneId, { sidebar_category: category, page: 1, page_size: 50 });
  },
  handleGiftSubTap(e) {
    const name = e.currentTarget.dataset.name;
    if (!name) return;
    this.setData({ giftSubActive: name });
    this.loadZoneProducts(this.data.zoneId, { gift_sub_category: name, page: 1, page_size: 50 });
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
