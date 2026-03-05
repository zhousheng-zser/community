Page({
  data: {
    navTopPadding: 20,
    pageTitle: "专区",
    isGiftZone: false,
    isSidebarLayout: false, // 是否是家推甄选专区(左侧边栏右瀑布流)
    isHighCommLayout: false, // 是否是高佣专区(顶部提示条+满宽单列)
    subCategories: [], // 专属子分类：送长辈等
    sidebarCategories: [], // 左侧分类菜单
    activeSidebarCategory: '家庭清洁', // 当前激活的左侧分类
    tabs: ["推荐", "最新", "销量", "价格"],
    goods: []
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();

    // 映射 ID 为对应标题，规避直接传中文带来的 URL 编码失败风险
    const titles = {
      "1": "爆款专区",
      "2": "礼物专区",
      "3": "家推甄选",
      "4": "高佣专区"
    };
    const title = titles[options.id] || "特产专区";
    const isGiftZone = options.id === "2";
    const isSidebarLayout = options.id === "3";
    const isHighCommLayout = options.id === "4";

    const mockSubCategories = isGiftZone ? [
      { name: "送社群", image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=100&q=80" },
      { name: "送朋友", image: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&q=80" },
      { name: "送对象", image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=100&q=80" },
      { name: "送客户", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" },
      { name: "送长辈", image: "https://images.unsplash.com/photo-1507120410856-1f35574c3b45?w=100&q=80" },
      { name: "送小孩", image: "https://picsum.photos/id/1025/100/100" },
      { name: "送亲戚", image: "https://picsum.photos/id/1011/100/100" }
    ] : [];

    const mockSidebarCategories = isSidebarLayout ? [
      "家庭清洁", "生鲜水果", "美妆护肤", "珠宝首饰", "电脑办公",
      "厨具用品", "文玩文创", "运动户外", "家用电器", "食品饮料",
      "服饰内衣", "文具图书", "汽摩电动", "教育培训", "中外酒类",
      "品质鞋靴", "家居日用", "个人护理", "其他", "品质家纺",
      "宠物生活", "母婴生活", "玩具乐器", "钟表眼镜", "保健食品",
      "箱包皮具", "3C数码", "手机通讯", "家装建材", "品质家具",
      "粮油调味", "农资园艺", "茶具名茶"
    ] : [];

    // 生成 6 个占位商品
    const mockGoods = Array.from({ length: 6 }).map((_, i) => ({
      id: i + 1,
      name: `测试商品占位名称 ${title} 款式 ${i + 1}`,
      price: (Math.random() * 80 + 10).toFixed(2),
      comm: (Math.random() * 5 + 1).toFixed(2),
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
      tag: i % 2 === 0 ? "验货实测" : "资质齐全"
    }));

    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 6,
      pageTitle: title,
      isGiftZone,
      isSidebarLayout,
      isHighCommLayout,
      subCategories: mockSubCategories,
      sidebarCategories: mockSidebarCategories,
      activeSidebarCategory: mockSidebarCategories[0] || "",
      goods: mockGoods
    });
  },
  handleSidebarClick(e) {
    const category = e.currentTarget.dataset.name;
    this.setData({ activeSidebarCategory: category });
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
