//index.js
//获取应用实例
const app = getApp();
const util = require('../../utils/util.js');
const { imgUrl } = util;
Page({
  data: {
    noOrderTip: "您还没有订单",
    currentCity: "定位",
    showGetTelModal: false,
    userFlag: 0,
    videoScrollRatio: 0,
    homeSearchKeyword: "",
    navTopPadding: 20,
    activeTab: "首页",
    activePeriodicTabIndex: 0,
    activeFeedTab: "高佣推荐",
    isLoadingMore: false,
    pageIndex: 1,
    topTabs: [
      { text: "福卡" },
      { text: "家推" },
      { text: "首页" },
      { text: "家集市" }
    ],
    categoryList: [],
    quickActions: [],
    knowledgeList: [],
    hotList: [],
    hotFilters: [],
    merchantList: [],
    workerList: [],
    marketList: [],
    pushHeroBanners: [],
    pushCategories: [],
    pushPromoCards: {},
    pushDailyNews: [],
    pushTopSales: [],
    pushHotLiveStreams: [],
    pushLocalLiveStreams: [],
    pushLocalPavilions: [],
    pushHotVideos: [],
    pushPeriodicTabs: [],
    pushPeriodicGoods: [],
    pushFeedGoods: [],
    fukaLocalList: [],
    fukaServices: [],
    fukaTopicCards: [],
    fukaFilterTabs: [],
    fukaGoods: [],
    marketTopCats: [],
    marketFilters: [],
    marketShops: []
  },
  onLoad: function (options) {
    const sysInfo = wx.getSystemInfoSync();
    const statusBarHeight = sysInfo.statusBarHeight || 20;
    // 额外下移一档，避免和状态栏重叠
    this.setData({ navTopPadding: statusBarHeight + 20 });
    console.log(options)
    let parentOpId = "";
    if (options) {
      if (options.openid) {
        parentOpId = options.openid
      } else if (options.scene) {
        parentOpId = decodeURIComponent(options.scene);
      }
      if (options.service) {
        wx.navigateTo({
          url: '../order-detail/order-detail?id=' + options.service,
        })
      } else if (options.book) {
        wx.navigateTo({
          url: '../book-detail/book-detail?id=' + options.book,
        })
      } else if (options.good) {
        wx.navigateTo({
          url: '../gorder-detail/gorder-detail?orderSn=' + options.good,
        })
      }
    }
    const that = this;
    // 先做一次本地初始化，避免回调异常时首页模块为空
    that.init();
    app.save(parentOpId, that.init.bind(that));
  },
  onShareAppMessage: function (res) {
    const openid = app.globalData.user.opId;
    return app.onShare(openid, res);
  },
  onPullDownRefresh() {
    this.init()
    wx.stopPullDownRefresh()
  },
  switchTopTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },
  onHomeSearchInput(e) {
    this.setData({ homeSearchKeyword: e.detail.value });
  },
  handleLocationTap() {
    wx.chooseLocation({
      success: (res) => {
        const city = res.address ? res.address.replace(/省.*/, '').replace(/市.*/, '').slice(0, 4) : (res.name ? res.name.slice(0, 4) : '已定位');
        this.setData({ currentCity: city || '已定位' });
        wx.showToast({
          title: res.name ? "已定位到" + res.name : "定位已更新",
          icon: "none"
        });
      },
      fail: () => {
        wx.showToast({
          title: "未获取到定位",
          icon: "none"
        });
      }
    });
  },
  goPublish() {
    wx.navigateTo({ url: '../order-publish/order-publish' });
  },
  goMarketShop(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: "../market-shop/market-shop?id=" + id });
  },
  goMarketGoods(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: "../push-product-detail/push-product-detail?id=" + id });
  },
  async init() {
    const { id, userFlag, userMobile } = app.globalData.user || {};
    // 假数据填充，方便本地预览首页布局
    const banner = [
      { imageUrl: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { imageUrl: imgUrl('/uploads/placeholders/sale_banner.png') }
    ];

    const categoryList = [
      { name: "整理收纳", emoji: "🗂", bgColor: "#ede8ff", url: "../tidy-service/tidy-service?key=tidy" },
      { name: "家修急事", emoji: "🔧", bgColor: "#fff0e0", url: "../tidy-service/tidy-service?key=urgent_fix" },
      { name: "家电清洗", emoji: "🫧", bgColor: "#e0f3ff", url: "../tidy-service/tidy-service?key=appliance_clean" },
      { name: "开荒保洁", emoji: "🧹", bgColor: "#e4ffe0", url: "../tidy-service/tidy-service?key=pioneer_clean" },
      { name: "除螨服务", emoji: "🌿", bgColor: "#f0ffe0", url: "../tidy-service/tidy-service?key=mite_remove" },
      { name: "家具养护", emoji: "🪑", bgColor: "#fff0f5", url: "../tidy-service/tidy-service?key=furniture_care" },
      { name: "宝宝家事", emoji: "👶", bgColor: "#fff5e0", url: "../tidy-service/tidy-service?key=baby_home" },
      { name: "房屋修缮", emoji: "🏠", bgColor: "#e0eeff", url: "../tidy-service/tidy-service?key=house_repair" },
      { name: "上门美业", emoji: "💄", bgColor: "#ffe0f5", url: "../tidy-service/tidy-service?key=beauty_home" }
    ];
    const quickActions = [
      { name: "直约服务商", emoji: "🏪", bgColor: "#fff0e0" },
      { name: "直约技工", emoji: "🔨", bgColor: "#e8f5e0" },
      { name: "秒杀", emoji: "⚡", bgColor: "#fff5e0" },
      { name: "领券", emoji: "🎫", bgColor: "#ffe0ee" },
      { name: "家事积分商城", emoji: "🎯", bgColor: "#e0eeff" }
    ];
    const knowledgeList = [
      { name: "代取", emoji: "📦", bgColor: "#ede8ff", url: "../recomm/recomm?type=take" },
      { name: "接送小孩", emoji: "🚗", bgColor: "#e0f3ff", url: "../recomm/recomm?type=child" },
      { name: "陪诊", emoji: "🏥", bgColor: "#ffe0e0", url: "../recomm/recomm?type=escort" },
      { name: "代扔垃圾", emoji: "♻️", bgColor: "#e4ffe0", url: "../recomm/recomm?type=trash" },
      { name: "宠物喂养", emoji: "🐾", bgColor: "#fff5e0", url: "../recomm/recomm?type=pet" }
    ];
    // ===== 从数据库获取热门服务（小区热卖榜）=====
    let hotList = [
      { name: "洗衣机清洗", price: "128", image: imgUrl('/uploads/placeholders/home_cleaning.png'), rank: "NO.1" },
      { name: "热水器清洗", price: "150", image: imgUrl('/uploads/placeholders/home_cleaning.png'), rank: "NO.2" },
      { name: "油烟机清洗", price: "158", image: imgUrl('/uploads/placeholders/home_cleaning.png'), rank: "NO.3" },
      { name: "金牌日常保洁", price: "99", image: imgUrl('/uploads/placeholders/home_cleaning.png'), rank: "热门" }
    ];
    try {
      const hotRes = await util.get('core/services/hot');
      const hotData = Array.isArray(hotRes) ? hotRes : (hotRes.data || hotRes);
      if (Array.isArray(hotData) && hotData.length > 0) {
        const ranks = ["NO.1", "NO.2", "NO.3", "NO.4", "NO.5", "上新"];
        hotList = hotData.slice(0, 6).map((s, i) => ({
          id: s.id,
          name: s.title.replace(/【.*?】/g, '').trim(),
          price: String(s.price),
          image: s.cover_image,
          rank: ranks[i] || "热门"
        }));
      }
    } catch (e) {}

    // ===== 从数据库获取服务商品（直约服务商）=====
    let goods = [
      { id: 1, remarkC: imgUrl('/uploads/placeholders/home_cleaning.png'), goodsTitle: '金牌日常保洁 (2小时)', goodsSub: '专业团队，含客厅、卧室、厨房、卫生间清洁', price: '99.00' },
      { id: 2, remarkC: imgUrl('/uploads/placeholders/home_cleaning.png'), goodsTitle: '挂壁式空调深度清洗', goodsSub: '高温蒸汽杀菌，拆洗过滤网、导风板，去除异味', price: '89.00' },
      { id: 3, remarkC: imgUrl('/uploads/placeholders/home_cleaning.png'), goodsTitle: '洗衣机深度清洗', goodsSub: '专业拆洗内桶，高温消毒除霉，恢复洁净如新', price: '128.00' },
      { id: 4, remarkC: imgUrl('/uploads/placeholders/home_cleaning.png'), goodsTitle: '油烟机深度清洗', goodsSub: '专业拆洗油网、风轮，高温溶油去污', price: '158.00' }
    ];
    try {
      const svcRes = await util.get('core/services/hot');
      const svcData = Array.isArray(svcRes) ? svcRes : (svcRes.data || svcRes);
      if (Array.isArray(svcData) && svcData.length > 0) {
        goods = svcData.slice(0, 4).map(s => ({
          id: s.id,
          remarkC: s.cover_image,
          goodsTitle: s.title.replace(/【.*?】/g, '').trim(),
          goodsSub: s.description || '',
          price: String(Number(s.price).toFixed(2))
        }));
      }
    } catch (e) {}
    const hotFilters = ["保洁", "家电清洗", "安装维修", "搬家拉货"];
    const merchantList = goods.map((item) => ({
      id: item.id,
      name: item.goodsTitle,
      sub: "服务" + item.id + "单",
      image: item.remarkC,
      url: "../merchant-detail/merchant-detail?id=" + item.id
    }));
    const workerList = [
      { id: 1, name: "余静", orders: "服务1单", avatar: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { id: 2, name: "张乾坤", orders: "服务0单", avatar: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { id: 3, name: "张谕晗", orders: "服务0单", avatar: imgUrl('/uploads/placeholders/home_cleaning.png') }
    ];
    const marketList = [
      { name: "映萃美活研奇肌霜", price: "469", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { name: "映萃美活肤洁颜粉", price: "235", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { name: "当地特产一键速达", price: "99", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
    ];
    // ======================================
    // 家推 (JiaTui) 真实图片源 Mock 数据注入
    // ======================================

    // 模块一：顶级海报轮播图
    const pushHeroBanners = [
      { id: 1, image: imgUrl('/uploads/placeholders/home_cleaning.png') }, // Sale/Retail bg
      { id: 2, image: imgUrl('/uploads/placeholders/home_cleaning.png') }  // Lifestyle
    ];

    // 模块二：分类金刚
    const pushCategories = [
      { name: "爆款专区", emoji: "🔥", bgColor: "#ffe0e0", url: "/pages/push-goods-list/push-goods-list?id=1" },
      { name: "礼物专区", emoji: "🎁", bgColor: "#ffe0f5", url: "/pages/push-goods-list/push-goods-list?id=2" },
      { name: "家推甄选", emoji: "⭐", bgColor: "#fff5e0", url: "/pages/push-goods-list/push-goods-list?id=3" },
      { name: "高佣专区", emoji: "💰", bgColor: "#e4ffe0", url: "/pages/push-goods-list/push-goods-list?id=4" },
      { name: "推客学堂", emoji: "📚", bgColor: "#e0eeff", url: "/pages/push-video-list/push-video-list" }
    ];

    // 模块三：导购窗
    const pushPromoCards = {
      left: { title: "品牌好货", image: imgUrl('/uploads/placeholders/home_cleaning.png') }, // Cosmetics
      right: { title: "秋冬好物", image: imgUrl('/uploads/placeholders/home_cleaning.png') } // Fashion
    };

    // 模块四：上新与热卖
    const pushDailyNews = [
      { id: 1, name: "正宗东北黑木耳", price: "19.00", comm: "2.43", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { id: 2, name: "大果新鲜蓝莓", price: "39.90", comm: "13.53", image: imgUrl('/uploads/placeholders/home_cleaning.png'), isHot: true },
      { id: 3, name: "深层洁净洗衣液", price: "15.90", comm: "2.04", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { id: 4, name: "特级婴儿柔护纸巾", price: "99.00", comm: "22.18", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
    ];

    const pushTopSales = [
      { rank: "01", name: "浓缩纯牛奶整箱", comm: "3.83", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { rank: "02", name: "早餐手撕面包", comm: "2.52", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { rank: "03", name: "除菌持久洗衣凝珠", comm: "4.78", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
    ];

    // 模块五：大厂热推直播间
    const pushHotLiveStreams = [
      {
        id: 1, brand: "牛肉生鲜旗舰店", subBrand: "官方补贴 现场切块",
        brandLogo: imgUrl('/uploads/placeholders/home_cleaning.png'),
        rebate: "10%", promoters: "128"
      },
      {
        id: 2, brand: "蒙牛营养官方", subBrand: "学生奶营养加倍",
        brandLogo: imgUrl('/uploads/placeholders/home_cleaning.png'),
        rebate: "10%", promoters: "136"
      }
    ];

    // 模块六：地方馆地球矩阵 + 地方直播间
    // 将一维数组改造为二维数组 (每页10项) 以供 <swiper> 遍历
    const pushLocalPavilions = [
      [
        { name: "贵州馆", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { name: "上海馆", image: imgUrl('/uploads/placeholders/home_repair.png') },
        { name: "江西馆", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { name: "山西馆", image: imgUrl('/uploads/placeholders/home_repair.png') },
        { name: "重庆馆", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { name: "河南馆", image: imgUrl('/uploads/placeholders/home_repair.png') },
        { name: "福建馆", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { name: "云南馆", image: imgUrl('/uploads/placeholders/home_repair.png') },
        { name: "江苏馆", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { name: "湖北馆", image: imgUrl('/uploads/placeholders/home_repair.png') }
      ],
      [
        { name: "浙江馆", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { name: "四川馆", image: imgUrl('/uploads/placeholders/home_repair.png') },
        { name: "宁夏馆", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { name: "甘肃馆", image: imgUrl('/uploads/placeholders/home_repair.png') },
        { name: "湖南馆", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
      ]
    ];

    const pushLocalLiveStreams = [
      {
        id: 3, brand: "家事速配-遵义市汇川区土特产店", subBrand: "云南哀牢山冰糖橙-收官之夜",
        brandLogo: imgUrl('/uploads/placeholders/home_cleaning.png'),
        rebate: "10%", promoters: "1109", status: 'closed'
      },
      {
        id: 4, brand: "家事速配-毕节特产店", subBrand: "暂无",
        brandLogo: imgUrl('/uploads/placeholders/home_repair.png'),
        rebate: "10%", promoters: "159", status: 'closed'
      }
    ];

    // 模块七：横排带货视频录播
    const pushHotVideos = [
      { id: 101, title: "老榆木板原木桌面实木切割测试", price: "300.00", comm: "15.00", likes: 2, author: "榆园家具", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { id: 102, title: "日常保养，补钙还是喝奶更好？", price: "97.80", comm: "14.67", likes: 0, author: "养生说", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { id: 103, title: "新西兰厚切牛排，买二送一！", price: "129.9", comm: "8.80", likes: 5, author: "生鲜直供", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { id: 104, title: "大师香氛玫瑰洗衣液护色洁净柔顺", price: "99.90", comm: "24.97", likes: 13, author: "立白精品", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { id: 105, title: "立白大师格拉斯玫瑰香氛洗衣液深层...", price: "69.0", comm: "10.00", likes: 8, author: "立白精品", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { id: 106, title: "立白小白白衣物去油王250g精化...", price: "35.50", comm: "5.00", likes: 11, author: "立白精品", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
    ];

    // 模块八：排期榜单 (周期主推) - 提供不同的三组带货数据假刷新效果
    const pushPeriodicTabs = ["今日主推", "本周热卖", "本月排行"];
    const pushPeriodicBaseGoods = [
      { id: 201, title: "多功能厨房沥水篮家用洗菜盆三件套加厚", price: "24.90", comm: "3.22", tag: "全网爆款", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { id: 202, title: "网红小零食休闲充饥夜宵干脆面拉面丸子", price: "9.90", comm: "1.08", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { id: 203, title: "[品质升级！ 三合一快充线]三合一数据线快充...", price: "4.99", comm: "0.22", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { id: 204, title: "[年年宏]桑葚坚果糕红枣枸杞核桃软糕美味手...", price: "39.90", comm: "6.38", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
    ];
    // 默认展示两项
    const pushPeriodicGoods = [pushPeriodicBaseGoods[0], pushPeriodicBaseGoods[1]];

    // 模块九长效分类导航数据与缓存字典
    const pushFeedTabs = ["高佣推荐", "健康食品", "美妆个护", "日用百货"];
    const pushFeedGoodsDict = {
      "高佣推荐": [
        { id: 201, title: "内衣裤清新剂清洁内裤持久清洗液抑菌专用", price: "5.90", comm: "0.45", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { id: 202, title: "体重秤充电款 电子秤 精准光能驱动", price: "19.90", comm: "2.16", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { id: 203, title: "舒缓膏清凉薄荷驱蚊止痒婴幼童适用", price: "19.00", comm: "2.43", tag: "定向高佣", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { id: 204, title: "多功能厨房沥水篮家用洗菜盆三件套加厚", price: "24.90", comm: "3.22", tag: "全网爆款", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { id: 205, title: "网红小零食休闲充饥夜宵干脆面拉面丸子", price: "9.90", comm: "1.08", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
      ],
      "健康食品": [
        { id: 601, title: "燕麦麸皮轻食代餐冲饮 500g 饱腹减脂", price: "28.50", comm: "3.10", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { id: 602, title: "纯黑芝麻核桃黑豆粉营养早餐免煮即食", price: "35.00", comm: "4.50", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
      ],
      "美妆个护": [
        { id: 701, title: "氨基酸洗面奶深层清洁温和控油学生男女", price: "15.90", comm: "1.20", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
      ],
      "日用百货": [
        { id: 801, title: "天然竹浆抽纸本色纸巾家用整箱实惠装", price: "12.90", comm: "0.80", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
      ]
    };

    // 初始化默认页签商品
    const pushFeedGoods = [...pushFeedGoodsDict["高佣推荐"]];
    const fukaLocalList = [
      { name: "天天买菜", emoji: "🥦", bgColor: "#e4ffe0" },
      { name: "外卖", emoji: "🍜", bgColor: "#fff0e0" },
      { name: "鲜花", emoji: "🌸", bgColor: "#ffe0f5" },
      { name: "生活缴费", emoji: "💡", bgColor: "#fff5e0" },
      { name: "电影", emoji: "🎬", bgColor: "#e0eeff" },
      { name: "话费充值", emoji: "📱", bgColor: "#ede8ff" },
      { name: "出行", emoji: "🚌", bgColor: "#e0f3ff" },
      { name: "加油", emoji: "⛽", bgColor: "#fff0e0" },
      { name: "优惠领券", emoji: "🎫", bgColor: "#ffe0ee" },
      { name: "全部", emoji: "📋", bgColor: "#f5f5f5" }
    ];
    const fukaServices = [
      { name: "话费充值", emoji: "📱", bgColor: "#ede8ff" },
      { name: "生活缴费", emoji: "💡", bgColor: "#fff5e0" },
      { name: "优惠加油", emoji: "⛽", bgColor: "#fff0e0" },
      { name: "电影票", emoji: "🎬", bgColor: "#e0eeff" },
      { name: "京东优标", emoji: "🛒", bgColor: "#ffe0e0" },
      { name: "爆品会玩", emoji: "🎮", bgColor: "#e4ffe0" }
    ];
    const fukaTopicCards = [
      { title: "低价福利专区", price: "19.9专区", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { title: "精选生活好物", price: "9.9专区", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
    ];
    const fukaFilterTabs = ["精选", "拼多多", "淘宝", "京东"];
    const fukaGoods = [
      { name: "正宗大凉山核桃", price: "36.8", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { name: "近视眼镜", price: "79.9", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { name: "冻干草莓", price: "39.9", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
      { name: "黄冰糖", price: "29.9", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
    ];
    const marketTopCats = [
      { name: "母婴生活馆", emoji: "👶", bgColor: "#fff5e0", url: "../market-banner/market-banner?title=母婴生活馆" },
      { name: "家庭服务", emoji: "🏠", bgColor: "#e0eeff", url: "../market-banner/market-banner?title=家庭服务" },
      { name: "超市便利", emoji: "🛒", bgColor: "#e4ffe0", url: "../market-banner/market-banner?title=超市便利" }
    ];
    const marketFilters = ["综合排序", "邻工秒送", "商家自送", "重置筛选"];
    const marketShops = [
      {
        id: 1,
        name: "明辉香黍",
        badge: "邻工秒送",
        delivery: "起送￥0  免配送费",
        sold: "已售1",
        goods: [
          { id: 101, name: "明辉紫薯", price: "5", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
          { id: 102, name: "明辉香黍", price: "4", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
        ]
      },
      {
        id: 2,
        name: "成都尚辰空间装饰",
        badge: "邻工秒送",
        delivery: "起送￥0  免配送费",
        sold: "已售3",
        goods: [
          { id: 201, name: "卫生间翻新", price: "1", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
          { id: 202, name: "旧房改装", price: "19800", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
        ]
      },
      {
        id: 3,
        name: "四川洁而诺保洁有限公司",
        badge: "商家自送",
        delivery: "起送￥0  免配送费",
        sold: "已售1",
        goods: [
          { id: 301, name: "日常保洁", price: "45", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
          { id: 302, name: "清洗油烟机", price: "160", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
        ]
      }
    ];

    this.setData({
      banner,
      goods,
      categoryList,
      quickActions,
      knowledgeList,
      hotList,
      hotFilters,
      merchantList,
      workerList,
      marketList,

      pushHeroBanners,
      pushCategories,
      pushPromoCards,
      pushDailyNews,
      pushTopSales,
      pushHotLiveStreams,
      pushLocalLiveStreams,
      pushLocalPavilions,
      pushHotVideos,
      pushPeriodicTabs,
      pushPeriodicGoods,
      pushPeriodicBaseGoods,

      pushFeedTabs,
      pushFeedGoodsDict,
      pushFeedGoods,

      fukaLocalList,
      fukaServices,
      fukaTopicCards,
      fukaFilterTabs,
      fukaGoods,
      marketTopCats,
      marketFilters,
      marketShops
    });

    /* 原接口请求暂且注释
    util.get("api/wx/index").then((data) => {
      let { banner, goods, contnets, marketGoods}=data;
      contnets.forEach((v,i)=>{
        contnets[i].time = util.formatTime(new Date(v.createTime));
      })
      this.setData({ banner, goods, contnets, marketGoods });
    })
    */

    if (userFlag == 1) {
      util.post('api/order/all', {
        userFlag,
        id
      }).then((data) => {
        let list = [];
        data.forEach((v, i) => {
          if (new Date().getTime() - v.createTime > 1296000000) {
            return;
          }
          const { name } = util.stateTabel(v.orderState),
            time = util.formatTime(new Date(v.createTime));
          v.stateStr = name;
          v.time = time;
          list.push(v);
        })
        this.setData({ list, userFlag: 1 });
      }).catch(err => {
        // 请求失败时给予容错处理，防止抛错影响预览
        console.log("订单加载失败，可忽略", err);
      })
    }
  },

  // ---- 模块九：长效分类切换处理 ----
  switchFeedTab(e) {
    const tabName = e.currentTarget.dataset.name;
    if (tabName === this.data.activeFeedTab) return;

    this.setData({
      activeFeedTab: tabName,
      pageIndex: 1, // 切换重置页码
      pushFeedGoods: [...this.data.pushFeedGoodsDict[tabName] || []],
      isLoadingMore: false
    });
  },

  // ---- 小程序级：触底加载更多 ----
  onReachBottom() {
    // 只有在家推这个模块（页面实际长列表所在区）才开启触底加载
    if (this.data.activeTab !== '家推') return;
    if (this.data.isLoadingMore) return;

    this.setData({ isLoadingMore: true });

    // 使用假延迟模拟网络请求去服务器索要当前 activeFeedTab 分类下第二页的数据
    wx.showLoading({ title: '加载中...', mask: true });
    setTimeout(() => {
      const { pushFeedGoods, activeFeedTab, pageIndex } = this.data;
      const newPage = pageIndex + 1;

      // 生成几条以假乱真的分页数据
      const mockMoreGoods = [
        { id: 900 + newPage * 10, title: `[第${newPage}页加载] ${activeFeedTab} 热卖好物`, price: (Math.random() * 50).toFixed(2), comm: "0.88", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { id: 901 + newPage * 10, title: `网销爆款 ${activeFeedTab} 超值特购包邮`, price: (Math.random() * 80).toFixed(2), comm: "1.10", image: imgUrl('/uploads/placeholders/home_cleaning.png') },
        { id: 902 + newPage * 10, title: `品质严选 ${activeFeedTab} 家用装`, price: (Math.random() * 30).toFixed(2), comm: "1.50", image: imgUrl('/uploads/placeholders/home_cleaning.png') }
      ];

      this.setData({
        pushFeedGoods: pushFeedGoods.concat(mockMoreGoods), // 追加数据到原数组尾部
        pageIndex: newPage,
        isLoadingMore: false
      });
      wx.hideLoading();
    }, 800);
  },

  chooseAdd() {
    wx.chooseAddress({
      success: function (res) {
        console.log(res.userName)
        console.log(res.postalCode)
        console.log(res.provinceName)
        console.log(res.cityName)
        console.log(res.countyName)
        console.log(res.detailInfo)
        console.log(res.nationalCode)
        console.log(res.telNumber)
      }
    })
  },
  goActivity(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../activity/activity?id=' + id,
    })
  },

  // 周期推荐榜单切换处理
  switchPeriodicTab(e) {
    const idx = e.currentTarget.dataset.idx;
    const { pushPeriodicBaseGoods } = this.data;

    // 我们用不同的假组合来模拟数据变化
    let newList = [];
    if (idx === 0) {
      newList = [pushPeriodicBaseGoods[0], pushPeriodicBaseGoods[1]];
    } else if (idx === 1) {
      newList = [pushPeriodicBaseGoods[3], pushPeriodicBaseGoods[2]];
    } else {
      newList = [pushPeriodicBaseGoods[1], pushPeriodicBaseGoods[3]];
    }

    this.setData({
      activePeriodicTabIndex: idx,
      pushPeriodicGoods: newList
    });
  },

  handleVideoScroll(e) {
    // scrollLeft是当前滑动的距离，scrollWidth是总可滑动宽度
    const { scrollLeft, scrollWidth } = e.detail;
    // 使用系统的框架宽度近似计算 (视口宽度)
    const sys = wx.getSystemInfoSync();
    const windowWidth = sys.windowWidth;

    // 最大可滑动距离
    const maxScroll = scrollWidth - windowWidth;
    if (maxScroll <= 0) return;

    // 计算比例 (0-1)
    let ratio = scrollLeft / maxScroll;
    if (ratio < 0) ratio = 0;
    if (ratio > 1) ratio = 1;

    this.setData({
      videoScrollRatio: ratio
    });
  },

  openFakeVideoChannel() {
    wx.showToast({
      title: '即将打开微信视频号...',
      icon: 'none'
    });
  },

  getPhoneNumber(e) {
    const { iv, encryptedData: decryptData } = e.detail;
    const { id, sessionKey } = app.globalData.user;
    util.post("/api/user_info/update", {
      id,
      sessionKey,
      iv,
      decryptData
    }).then((data) => {
      this.setData({ showGetTelModal: false });
      app.save();//更新globalData中存储的个人信息
    })
  },
  handleCateNav(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({
        url: url
      });
    }
  }
})
