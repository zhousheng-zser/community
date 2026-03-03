//index.js
//获取应用实例
const app = getApp();
const util = require('../../utils/util.js');
Page({
  data: {
    noOrderTip: "您还没有订单",
    showGetTelModal: false,
    userFlag: 0,
    homeSearchKeyword: "",
    navTopPadding: 20,
    activeTab: "首页",
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
    pushCategories: [],
    pushPromoCards: [],
    pushTags: [],
    pushGoods: [],
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
  goMarketShop(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: "../market-shop/market-shop?id=" + id });
  },
  goMarketGoods(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: "../push-product-detail/push-product-detail?id=" + id });
  },
  init() {
    const { id, userFlag, userMobile } = app.globalData.user || {};
    // 假数据填充，方便本地预览首页布局
    const banner = [
      { imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80' },
      { imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80' }
    ];

    const goods = [
      {
        id: 1,
        remarkC: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
        goodsTitle: '金牌日常保洁 (2小时)',
        goodsSub: '专业团队，包含客厅、卧室、厨房、卫生间表面清洁，不含擦玻璃。',
        price: '99.00'
      },
      {
        id: 2,
        remarkC: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80',
        goodsTitle: '挂壁式空调深度清洗',
        goodsSub: '高温蒸汽杀菌，拆洗过滤网、导风板，去除异味。',
        price: '89.00'
      },
      {
        id: 3,
        remarkC: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
        goodsTitle: '家庭常驻保姆 (按月)',
        goodsSub: '负责三餐及家庭卫生，持证上岗，经验丰富。',
        price: '4500.00'
      },
      {
        id: 4,
        remarkC: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
        goodsTitle: '同城小面搬家',
        goodsSub: '适合单身公寓搬迁，含司机帮忙搬运，价格透明不坐地起价。',
        price: '150.00'
      }
    ];

    const categoryList = [
      { name: "整理收纳", icon: "/img/index/menuicon1.png", url: "../tidy-service/tidy-service?key=tidy" },
      { name: "家修急事", icon: "/img/index/menuicon2.png", url: "../tidy-service/tidy-service?key=urgent_fix" },
      { name: "家电清洗", icon: "/img/index/menuicon3.png", url: "../tidy-service/tidy-service?key=appliance_clean" },
      { name: "开荒保洁", icon: "/img/index/menuicon4.png", url: "../tidy-service/tidy-service?key=pioneer_clean" },
      { name: "除螨服务", icon: "/img/index/menuicon1.png", url: "../tidy-service/tidy-service?key=mite_remove" },
      { name: "家具养护", icon: "/img/index/menuicon2.png", url: "../tidy-service/tidy-service?key=furniture_care" },
      { name: "宝宝家事", icon: "/img/index/menuicon3.png", url: "../tidy-service/tidy-service?key=baby_home" },
      { name: "房屋修缮", icon: "/img/index/menuicon4.png", url: "../tidy-service/tidy-service?key=house_repair" },
      { name: "上门美业", icon: "/img/index/menuicon1.png", url: "../tidy-service/tidy-service?key=beauty_home" }
    ];
    const quickActions = [
      { name: "直约服务商", icon: "/img/index/ticon1.png" },
      { name: "直约技工", icon: "/img/index/ticon2.png" },
      { name: "秒杀", icon: "/img/index/ticon3.png" },
      { name: "领券", icon: "/img/index/ticon1.png" },
      { name: "家事积分商城", icon: "/img/index/ticon2.png" }
    ];
    const knowledgeList = [
      { name: "代取", avatar: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=120&q=80", url: "../recomm/recomm?type=take" },
      { name: "接送小孩", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80", url: "../recomm/recomm?type=child" },
      { name: "陪诊", avatar: "https://images.unsplash.com/photo-1542204625-de293a36f5c5?w=120&q=80", url: "../recomm/recomm?type=escort" },
      { name: "代扔垃圾", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80", url: "../recomm/recomm?type=trash" },
      { name: "宠物喂养", avatar: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=120&q=80", url: "../recomm/recomm?type=pet" }
    ];
    const hotList = [
      { name: "洗衣机清洗", price: "128", image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300&q=80", rank: "NO.1" },
      { name: "热水器清洗", price: "150", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=300&q=80", rank: "NO.2" },
      { name: "油烟机清洗", price: "158", image: "https://images.unsplash.com/photo-1556911220-bda9f7f7597e?w=300&q=80", rank: "NO.3" },
      { name: "家电清洗(新)", price: "399", image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300&q=80", rank: "上新" }
    ];
    const hotFilters = ["保洁", "家电清洗", "安装维修", "搬家拉货"];
    const merchantList = goods.map((item) => ({
      id: item.id,
      name: item.goodsTitle,
      sub: "服务" + item.id + "单",
      image: item.remarkC,
      url: "../merchant-detail/merchant-detail?id=" + item.id
    }));
    const workerList = [
      { id: 1, name: "余静", orders: "服务1单", avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=220&q=80" },
      { id: 2, name: "张乾坤", orders: "服务0单", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=220&q=80" },
      { id: 3, name: "张谕晗", orders: "服务0单", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=220&q=80" }
    ];
    const marketList = [
      { name: "映萃美活研奇肌霜", price: "469", image: "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400&q=80" },
      { name: "映萃美活肤洁颜粉", price: "235", image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80" },
      { name: "当地特产一键速达", price: "99", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80" },
      { name: "初开荒 60平以内", price: "480", image: "https://images.unsplash.com/photo-1527515545081-5db817172677?w=400&q=80" }
    ];
    const pushCategories = [
      { name: "母婴", icon: "/img/index/menuicon1.png", url: "../push-goods-list/push-goods-list?theme=pink" },
      { name: "水果", icon: "/img/index/menuicon2.png", url: "../push-goods-list/push-goods-list?theme=brown" },
      { name: "粮油", icon: "/img/index/menuicon3.png", url: "../push-goods-list/push-goods-list?theme=red" },
      { name: "零食", icon: "/img/index/menuicon4.png", url: "../push-goods-list/push-goods-list?theme=brown" },
      { name: "日百", icon: "/img/index/menuicon1.png", url: "../push-goods-list/push-goods-list?theme=pink" }
    ];
    const pushPromoCards = [
      { title: "爆品上新", sub: "品牌好货直降", image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400&q=80", url: "../push-channel/push-channel" },
      { title: "邻区TOP榜", sub: "本周口碑推荐", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80", url: "../push-goods-list/push-goods-list?theme=brown" }
    ];
    const pushTags = [
      { name: "满39包邮", url: "../push-goods-list/push-goods-list?theme=red" },
      { name: "小区团购", url: "../push-goods-list/push-goods-list?theme=brown" },
      { name: "限时秒杀", url: "../push-goods-list/push-goods-list?theme=pink" },
      { name: "新人专享", url: "../push-goods-list/push-goods-list?theme=red" }
    ];
    const pushGoods = [
      { id: 1, name: "正宗东北木耳", price: "39.90", unit: "/袋", image: "https://images.unsplash.com/photo-1505575967455-40e256f73376?w=300&q=80", url: "../push-product-detail/push-product-detail?id=1" },
      { id: 2, name: "高原蜂蜜", price: "69.95", unit: "/瓶", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&q=80", url: "../push-product-detail/push-product-detail?id=2" },
      { id: 3, name: "山核桃仁", price: "35.90", unit: "/袋", image: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=300&q=80", url: "../push-product-detail/push-product-detail?id=3" },
      { id: 4, name: "牛肉丸", price: "49.90", unit: "/盒", image: "https://images.unsplash.com/photo-1604908176997-4318f804bafa?w=300&q=80", url: "../push-product-detail/push-product-detail?id=4" }
    ];
    const fukaLocalList = [
      { name: "天天买菜", icon: "/img/index/menuicon1.png" },
      { name: "外卖", icon: "/img/index/menuicon2.png" },
      { name: "鲜花", icon: "/img/index/menuicon3.png" },
      { name: "生活缴费", icon: "/img/index/menuicon4.png" },
      { name: "电影", icon: "/img/index/menuicon1.png" },
      { name: "话费充值", icon: "/img/index/menuicon2.png" },
      { name: "出行", icon: "/img/index/menuicon3.png" },
      { name: "加油", icon: "/img/index/menuicon4.png" },
      { name: "优惠领券", icon: "/img/index/menuicon1.png" },
      { name: "全部", icon: "/img/index/menuicon2.png" }
    ];
    const fukaServices = [
      { name: "话费充值", icon: "/img/index/ticon1.png" },
      { name: "生活缴费", icon: "/img/index/ticon2.png" },
      { name: "优惠加油", icon: "/img/index/ticon3.png" },
      { name: "电影票", icon: "/img/index/ticon1.png" },
      { name: "京东优标", icon: "/img/index/ticon2.png" },
      { name: "爆品会玩", icon: "/img/index/ticon3.png" }
    ];
    const fukaTopicCards = [
      { title: "低价福利专区", price: "19.9专区", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80" },
      { title: "精选生活好物", price: "9.9专区", image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&q=80" }
    ];
    const fukaFilterTabs = ["精选", "拼多多", "淘宝", "京东"];
    const fukaGoods = [
      { name: "正宗大凉山核桃", price: "36.8", image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=300&q=80" },
      { name: "近视眼镜", price: "79.9", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&q=80" },
      { name: "冻干草莓", price: "39.9", image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&q=80" },
      { name: "黄冰糖", price: "29.9", image: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=300&q=80" }
    ];
    const marketTopCats = [
      { name: "母婴生活馆", icon: "/img/index/menuicon1.png", url: "../market-banner/market-banner?title=母婴生活馆" },
      { name: "家庭服务", icon: "/img/index/menuicon2.png", url: "../market-banner/market-banner?title=家庭服务" },
      { name: "超市便利", icon: "/img/index/menuicon3.png", url: "../market-banner/market-banner?title=超市便利" }
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
          { id: 101, name: "明辉紫薯", price: "5", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=180&q=80" },
          { id: 102, name: "明辉香黍", price: "4", image: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=180&q=80" }
        ]
      },
      {
        id: 2,
        name: "成都尚辰空间装饰",
        badge: "邻工秒送",
        delivery: "起送￥0  免配送费",
        sold: "已售3",
        goods: [
          { id: 201, name: "卫生间翻新", price: "1", image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=180&q=80" },
          { id: 202, name: "旧房改装", price: "19800", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=180&q=80" }
        ]
      },
      {
        id: 3,
        name: "四川洁而诺保洁有限公司",
        badge: "商家自送",
        delivery: "起送￥0  免配送费",
        sold: "已售1",
        goods: [
          { id: 301, name: "日常保洁", price: "45", image: "https://images.unsplash.com/photo-1527515545081-5db817172677?w=180&q=80" },
          { id: 302, name: "清洗油烟机", price: "160", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=180&q=80" }
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
      pushCategories,
      pushPromoCards,
      pushTags,
      pushGoods,
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
  }
})
