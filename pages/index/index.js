//index.js
//获取应用实例
const app = getApp();
const util = require('../../utils/util.js');
const config = require('../../utils/config.js');
const geo = require('../../utils/geo.js');
const { imgUrl, pickMarketShopAvatarPath } = util;
const images = require('../../utils/images.js');
const { listImageFromHome3 } = require('../../utils/serviceHome3.js');
const { workerAvatarUrl } = require('../../utils/workerAvatars.js');
Page({
  data: {
    noOrderTip: "您还没有订单",
    currentCity: "定位",
    showGetTelModal: false,
    userFlag: 0,
    homeSearchKeyword: "",
    navTopPadding: 20,
    activeTab: "首页",
    activePeriodicTabIndex: 0,
    activeFeedTab: "",
    isLoadingMore: false,
    pageSize: 10,
    topTabs: [
      { text: "惠民卡" },
      { text: "本地好物" },
      { text: "首页" },
      { text: "本地集市" }
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
    pushPeriodicTabs: [],
    pushPeriodicGoodsDict: {},
    pushPeriodicGoods: [],
    pushFeedGoods: [],
    pushFeedGoodsDict: {},
    feedPageByTab: {},
    feedHasMoreByTab: {},
    fukaLocalList: [],
    fukaServices: [],
    fukaTopicCards: [],
    fukaFilterTabs: [],
    fukaGoods: [],
    jdGoods: [],
    jdBanner: "",
    jdHeroTitle: "",
    jdHeroSubtitle: "",
    benefitAllianceTabs: [
      { key: 'jd', name: '京东联盟' },
      { key: 'pdd', name: '拼多多' }
    ],
    activeBenefitAlliance: 'jd',
    pddGoods: [],
    pddBanner: '',
    pddHeroTitle: "",
    pddHeroSubtitle: "",
    pddEntry: { spreadUrl: '', miniPath: '', goodsId: '' },
    /** 惠民卡京东底部 GO：接口返回列表后取首条，无数据时为空 */
    jdEntry: { skuId: '', spreadUrl: '' },
    activeMarketCat: "AAAA",
    marketTopCats: [],
    marketFilters: [
      { key: 'comprehensive', label: '综合排序' },
      { key: 'distance', label: '距离优先' }
    ],
    activeMarketSort: 'distance',
    allMarketShops: [],
    marketShops: [],
    marketShopsCacheByCat: {} // { [catName]: mappedShopList }
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
  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    const app = getApp();
    if (app.globalData && app.globalData.targetIndexTab) {
      this.setData({ activeTab: app.globalData.targetIndexTab });
      app.globalData.targetIndexTab = ""; // 消费后清空
      
      // 强制将页面滚动回最顶部
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 300 // 带点平滑滚动的动画体验更好
      });
    }
    this._maybeRefreshMarketAfterAddressChange();
  },
  /** 地址页保存/编辑/删除/设默认后，清空本地集市缓存并重拉当前分类店铺 */
  _maybeRefreshMarketAfterAddressChange() {
    const flag = wx.getStorageSync('market_refresh_after_address');
    if (!flag) return;
    wx.removeStorageSync('market_refresh_after_address');
    wx.removeStorageSync('market_user_lat');
    wx.removeStorageSync('market_user_lng');
    wx.removeStorageSync('market_user_location_manual');
    wx.removeStorageSync('market_snap_address_id');
    wx.removeStorageSync('market_snap_distance_km');
    wx.removeStorageSync('market_location_label');
    const cat = this.data.activeMarketCat;
    this.switchMarketCategory(
      { currentTarget: { dataset: { code: cat } } },
      true
    );
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
  /** 本地集市：定位缓存键（与 radius 联动时避免错误命中旧缓存） */
  getMarketLocationCacheKey() {
    const lat = wx.getStorageSync('market_user_lat');
    const lng = wx.getStorageSync('market_user_lng');
    if (lat == null || lng == null || lat === '' || lng === '') return 'noloc';
    return `${Number(lat).toFixed(3)}_${Number(lng).toFixed(3)}`;
  },
  cacheKeyForMarketCat(cat) {
    const sort = this.data.activeMarketSort || 'distance';
    // 店铺卡片图字段映射变更时递增，避免命中旧版 normalize 的内存缓存
    const MAP_VER = 'avatar-v2';
    return `${MAP_VER}::${this.getMarketLocationCacheKey()}::${cat}::${sort}`;
  },
  buildMarketShopsQuery(extra = {}) {
    const q = { ...extra };
    if (!q.page) q.page = 1;
    if (!q.page_size) q.page_size = 30;
    const lat = wx.getStorageSync('market_user_lat');
    const lng = wx.getStorageSync('market_user_lng');
    const hasCoords = lat != null && lng != null && lat !== '' && lng !== '';
    if (hasCoords) {
      q.user_lat = Number(lat);
      q.user_lng = Number(lng);
      q.radius_km = config.marketShopRadiusKm != null ? config.marketShopRadiusKm : 5;
      const sortMode = this.data.activeMarketSort || 'distance';
      q.sort = sortMode === 'comprehensive' ? 'comprehensive' : 'distance';
    } else {
      // 无定位且无可用坐标回退时：不按距离，固定综合排序
      q.sort = 'comprehensive';
    }
    return q;
  },
  /** 切换「综合排序 / 距离优先」，重新拉取当前分类店铺列表 */
  async switchMarketSort(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeMarketSort) return;
    const lat = wx.getStorageSync('market_user_lat');
    const lng = wx.getStorageSync('market_user_lng');
    const hasCoords = lat != null && lng != null && lat !== '' && lng !== '';
    if (key === 'distance' && !hasCoords) {
      wx.showToast({ title: '需定位或默认地址坐标后可用距离排序', icon: 'none' });
      return;
    }
    this.setData({ activeMarketSort: key, marketShopsCacheByCat: {} });
    await this.switchMarketCategory({
      currentTarget: { dataset: { code: this.data.activeMarketCat } }
    });
  },
  /** 拉取收货地址（接口优先，失败用本地缓存），供「1km 吸附」 */
  async loadUserAddressesForSnap() {
    try {
      const res = await util.get('user/addresses');
      return Array.isArray(res) ? res : (res.list || []);
    } catch (e) {
      return wx.getStorageSync('address_list') || [];
    }
  },

  /**
   * 本地集市定位（须与产品一致）：
   * 1) 拿不到当前 GPS → 用默认收货地址坐标（有经纬度）；
   * 2) 拿不到 GPS 且无可用默认地址坐标 → hasCoords=false，店铺综合排序；
   * 3) 拿到 GPS → 与全部已存地址比，若最近一条 &lt;1km → 用该条存储坐标；
   * 4) 否则 → 用当前 GPS。
   * 用户点「定位」地图选点会设 market_user_location_manual，在清除前会话内不自动覆盖。
   * 自动 getLocation：仅在冷启动清空坐标后首次需要时执行；同一次打开小程序内复用 storage 坐标（无定时、无 Tab 切换重打 GPS）。
   * @returns {Promise<{ hasCoords: boolean }>}
   */
  ensureMarketUserCoordsForList() {
    return new Promise((resolve) => {
      if (wx.getStorageSync('market_user_location_manual')) {
        const lat = wx.getStorageSync('market_user_lat');
        const lng = wx.getStorageSync('market_user_lng');
        if (lat != null && lng != null && lat !== '' && lng !== '') {
          resolve({ hasCoords: true });
          return;
        }
        wx.removeStorageSync('market_user_location_manual');
      }
      const lat0 = wx.getStorageSync('market_user_lat');
      const lng0 = wx.getStorageSync('market_user_lng');
      if (lat0 != null && lng0 != null && lat0 !== '' && lng0 !== '') {
        resolve({ hasCoords: true });
        return;
      }
      wx.getLocation({
        type: 'gcj02',
        success: async (res) => {
          let finalLat = res.latitude;
          let finalLng = res.longitude;
          let snapLabel = '';
          try {
            const list = await this.loadUserAddressesForSnap();
            const snap = geo.findNearestAddressWithin(res.latitude, res.longitude, list, 1);
            if (snap) {
              finalLat = snap.lat;
              finalLng = snap.lng;
              snapLabel = snap.label;
              wx.setStorageSync('market_snap_address_id', snap.id);
              wx.setStorageSync('market_snap_distance_km', snap.dKm);
            } else {
              wx.removeStorageSync('market_snap_address_id');
              wx.removeStorageSync('market_snap_distance_km');
            }
          } catch (e) {
            /* 吸附失败则仍用 GPS */
          }
          wx.setStorageSync('market_user_lat', finalLat);
          wx.setStorageSync('market_user_lng', finalLng);
          if (snapLabel) {
            wx.setStorageSync('market_location_label', snapLabel);
            this.setData({ currentCity: snapLabel });
          } else {
            wx.removeStorageSync('market_location_label');
            this.setData({ currentCity: '已定位' });
          }
          resolve({ hasCoords: true });
        },
        fail: async () => {
          try {
            const list = await this.loadUserAddressesForSnap();
            const fallback = geo.getDefaultAddressCoords(list);
            if (fallback) {
              wx.setStorageSync('market_user_lat', fallback.lat);
              wx.setStorageSync('market_user_lng', fallback.lng);
              wx.setStorageSync('market_location_label', fallback.label);
              if (fallback.id != null) wx.setStorageSync('market_snap_address_id', fallback.id);
              this.setData({ currentCity: fallback.label });
              resolve({ hasCoords: true });
              return;
            }
          } catch (e) {
            /* ignore */
          }
          wx.removeStorageSync('market_user_lat');
          wx.removeStorageSync('market_user_lng');
          wx.removeStorageSync('market_snap_address_id');
          wx.removeStorageSync('market_snap_distance_km');
          wx.removeStorageSync('market_location_label');
          resolve({ hasCoords: false });
        }
      });
    });
  },
  // force：true 时忽略店铺列表缓存（地址变更后需重拉）；定位仍遵循「本会话已算过则复用」
  async switchMarketCategory(e, force) {
    const cat = e.currentTarget.dataset.code || e.currentTarget.dataset.name;
    this.setData({ activeMarketCat: cat });

    wx.showLoading({ title: '加载中...', mask: true });
    try {
      const locRes = await this.ensureMarketUserCoordsForList();
      if (locRes && locRes.hasCoords === false) {
        this.setData({ activeMarketSort: 'comprehensive' });
      }
      const cache = this.data.marketShopsCacheByCat || {};
      const ck = this.cacheKeyForMarketCat(cat);
      if (!force && cache[ck] && Array.isArray(cache[ck])) {
        wx.hideLoading();
        this.setData({ marketShops: cache[ck] });
        return;
      }
      const query = this.buildMarketShopsQuery({ category: cat, page: 1, page_size: 30 });
      const marketRes = await util.get('market/shops', query);
      wx.hideLoading();
      const list = Array.isArray(marketRes)
        ? marketRes
        : (marketRes.list || (marketRes.data && marketRes.data.list) || marketRes.data || []);
      const mapped = Array.isArray(list) ? list.map(s => this.normalizeMarketShop(s)).filter(s => !!s.id) : [];
      const newCache = { ...cache, [ck]: mapped };
      this.setData({
        marketShops: mapped,
        marketShopsCacheByCat: newCache
      });
    } catch (err) {
      wx.hideLoading();
      const cache = this.data.marketShopsCacheByCat || {};
      const ck = this.cacheKeyForMarketCat(cat);
      const marketShops = [];
      const newCache = { ...cache, [ck]: marketShops };
      this.setData({
        marketShops,
        marketShopsCacheByCat: newCache
      });
    }
  },
  normalizeMarketShop(item) {
    const goodsRaw = Array.isArray(item.goods) ? item.goods : (Array.isArray(item.preview_goods) ? item.preview_goods : []);
    const goods = goodsRaw.slice(0, 8).map((g, idx) => ({
      id: g.id || g.goods_id || (idx + 1),
      name: g.name || g.goods_name || '精选商品',
      price: String(g.price || g.goods_price || '0'),
      image: imgUrl(g.main_image || g.image || '/img/placeholders/home_cleaning.png')
    }));
    const soldCount = Number(item.sold_count || 0);
    const deliveryText = item.delivery_desc
      || (item.min_order_amount != null
        ? `起送￥${item.min_order_amount}  配送费￥${item.delivery_fee || 0}`
        : '起送￥0  免配送费');
    let distanceLabel = '';
    if (item.distance_km != null && item.distance_km !== '') {
      const d = Number(item.distance_km);
      if (!Number.isNaN(d)) distanceLabel = `距您${d.toFixed(1)}km`;
    }
    const coverPath = pickMarketShopAvatarPath(item);
    return {
      id: item.id,
      cat: item.category || '本地集市',
      name: item.name || item.shop_name || '社区店铺',
      badge: item.delivery_type_text || item.delivery_type || '商家自送',
      delivery: deliveryText,
      sold: `已售${soldCount}`,
      distanceLabel,
      coverUrl: coverPath ? imgUrl(coverPath) : '',
      ratingText: item.rating != null && item.rating !== '' ? `评分 ${item.rating}` : '',
      goods
    };
  },
  onHomeSearchInput(e) {
    this.setData({ homeSearchKeyword: e.detail.value });
  },
  /** 用户主动选点：覆盖自动定位逻辑，本地集市后续请求以本次坐标为准，直至地址变更等场景清空 manual */
  handleLocationTap() {
    wx.chooseLocation({
      success: (res) => {
        wx.setStorageSync('market_user_location_manual', 1);
        wx.setStorageSync('market_user_lat', res.latitude);
        wx.setStorageSync('market_user_lng', res.longitude);
        wx.removeStorageSync('market_snap_address_id');
        wx.removeStorageSync('market_snap_distance_km');
        wx.removeStorageSync('market_location_label');
        this.setData({ marketShopsCacheByCat: {} });
        const city = res.address ? res.address.replace(/省.*/, '').replace(/市.*/, '').slice(0, 4) : (res.name ? res.name.slice(0, 4) : '已定位');
        this.setData({ currentCity: city || '已定位' });
        wx.showToast({
          title: res.name ? "已定位到" + res.name : "定位已更新",
          icon: "none"
        });
        const cat = this.data.activeMarketCat;
        this.switchMarketCategory({ currentTarget: { dataset: { code: cat } } }, true);
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
      { imageUrl: images.bannerHome },
      { imageUrl: images.bannerSale }
    ];

    const mapHomeIcon = (rows) => rows.map((r) => ({ ...r, icon: imgUrl(r.icon) }));
    const categoryList = mapHomeIcon([
      { name: "整理收纳", icon: "/img/home_categories/tidy.png", emoji: "🗂", bgColor: "#ede8ff", url: "../tidy-service/tidy-service?key=tidy" },
      { name: "家修急事", icon: "/img/home_categories/urgent_fix.png", emoji: "🔧", bgColor: "#fff0e0", url: "../tidy-service/tidy-service?key=urgent_fix" },
      { name: "家电清洗", icon: "/img/home_categories/appliance_clean.png", emoji: "🫧", bgColor: "#e0f3ff", url: "../tidy-service/tidy-service?key=appliance_clean" },
      { name: "开荒保洁", icon: "/img/home_categories/pioneer_clean.png", emoji: "🧹", bgColor: "#e4ffe0", url: "../tidy-service/tidy-service?key=pioneer_clean" },
      { name: "除螨服务", icon: "/img/home_categories/mite_remove.png", emoji: "🌿", bgColor: "#f0ffe0", url: "../tidy-service/tidy-service?key=mite_remove" },
      { name: "家具养护", icon: "/img/home_categories/furniture_care.png", emoji: "🪑", bgColor: "#fff0f5", url: "../tidy-service/tidy-service?key=furniture_care" },
      { name: "宝宝家事", icon: "/img/home_categories/baby_home.png", emoji: "👶", bgColor: "#fff5e0", url: "../tidy-service/tidy-service?key=baby_home" },
      { name: "房屋修缮", icon: "/img/home_categories/house_repair.png", emoji: "🏠", bgColor: "#e0eeff", url: "../tidy-service/tidy-service?key=house_repair" },
      { name: "上门美业", icon: "/img/home_categories/beauty_home.png", emoji: "💄", bgColor: "#ffe0f5", url: "../tidy-service/tidy-service?key=beauty_home" }
    ]);
    const quickActions = mapHomeIcon([
      { name: "直约服务商", icon: "/img/home_icons2/merchant_direct.png", emoji: "🏪", bgColor: "#fff0e0" },
      { name: "直约技工", icon: "/img/home_icons2/worker_direct.png", emoji: "🔨", bgColor: "#e8f5e0" },
      { name: "秒杀", icon: "/img/home_icons2/miaosha.png", emoji: "⚡", bgColor: "#fff5e0" },
      { name: "领券", icon: "/img/home_icons2/coupon.png", emoji: "🎫", bgColor: "#ffe0ee" },
      { name: "家事积分商城", icon: "/img/home_icons2/points.png", emoji: "🎯", bgColor: "#e0eeff" }
    ]);
    const knowledgeList = mapHomeIcon([
      { name: "代取", icon: "/img/home_icons2/pickup.png", emoji: "📦", bgColor: "#ede8ff", url: "../recomm/recomm?type=take" },
      { name: "接送小孩", icon: "/img/home_icons2/child_pickup.png", emoji: "🚗", bgColor: "#e0f3ff", url: "../recomm/recomm?type=child" },
      { name: "陪诊", icon: "/img/home_icons2/escort.png", emoji: "🏥", bgColor: "#ffe0e0", url: "../recomm/recomm?type=escort" },
      { name: "代扔垃圾", icon: "/img/home_icons2/trash_proxy.png", emoji: "♻️", bgColor: "#e4ffe0", url: "../recomm/recomm?type=trash" },
      { name: "宠物喂养", icon: "/img/home_icons2/pet_feed.png", emoji: "🐾", bgColor: "#fff5e0", url: "../recomm/recomm?type=pet" }
    ]);
    // ===== 从数据库获取热门服务（小区热卖榜）=====
    let hotList = [
      { id: 73, name: "局部瓷砖铺贴",     price: "229", image: listImageFromHome3("局部瓷砖铺贴【2小时】", images.svcTile), rank: "NO.1" },
      { id: 74, name: "壁纸铺贴施工",     price: "239", image: listImageFromHome3("壁纸铺贴施工【2小时】", images.svcWall), rank: "NO.2" },
      { id: 75, name: "厨卫漏水防水修缮", price: "299", image: listImageFromHome3("厨卫漏水防水修缮【2小时】", images.svcWaterproof), rank: "NO.3" },
      { id: 76, name: "地板铺贴修缮",     price: "279", image: listImageFromHome3("地板铺贴修缮【2小时】", images.svcFloor), rank: "NO.4" },
      { id: 77, name: "墙面刷新施工",     price: "259", image: listImageFromHome3("墙面刷新施工【2小时】", images.svcWall), rank: "NO.5" }
    ];
    let goods = [
      { id: 1, remarkC: images.hotClean,   goodsTitle: '金牌日常保洁 (2小时)',   goodsSub: '专业团队，含客厅、卧室、厨房、卫生间清洁', price: '99.00' },
      { id: 2, remarkC: images.svcAircon,  goodsTitle: '挂壁式空调深度清洗',     goodsSub: '高温蒸汽杀菌，拆洗过滤网、导风板，去除异味', price: '89.00' },
      { id: 3, remarkC: images.svcWasher,  goodsTitle: '洗衣机深度清洗',         goodsSub: '专业拆洗内桶，高温消毒除霉，恢复洁净如新', price: '128.00' },
      { id: 4, remarkC: images.svcHood,    goodsTitle: '油烟机深度清洗',         goodsSub: '专业拆洗油网、风轮，高温溶油去污', price: '158.00' }
    ];
    if (!config.useCuratedHomeHotList) {
      try {
        const hotRes = await util.get('core/services/hot');
        const hotData = Array.isArray(hotRes) ? hotRes : (hotRes.data || hotRes);
        if (Array.isArray(hotData) && hotData.length > 0) {
          const ranks = ["NO.1", "NO.2", "NO.3", "NO.4", "NO.5", "上新"];
          hotList = hotData.slice(0, 6).map((s, i) => ({
            id: s.id,
            name: s.title.replace(/【.*?】/g, '').trim(),
            price: String(s.price),
            image: listImageFromHome3(
              s.title,
              s.cover_image ? imgUrl(s.cover_image) : '/img/placeholders/home_cleaning.png'
            ),
            rank: ranks[i] || "热门"
          }));
        }
      } catch (e) {}
    }

    const hotFilters = ["保洁", "家电清洗", "安装维修", "搬家拉货"];
    const mapMerchantList = () => goods.map((item) => ({
      id: item.id,
      name: item.goodsTitle,
      sub: "服务" + item.id + "单",
      image: imgUrl(item.remarkC || '/img/placeholders/home_cleaning.png'),
      url: "../merchant-detail/merchant-detail?id=" + item.id
    }));
    let merchantList = mapMerchantList();
    let workerList = [
      { id: 1, name: "何志", orders: "服务0单", avatar: workerAvatarUrl(1) },
      { id: 2, name: "余静", orders: "服务1单", avatar: workerAvatarUrl(2) },
      { id: 3, name: "邓长超", orders: "服务0单", avatar: workerAvatarUrl(3) }
    ];
    let marketList = [
      { id: 2001, name: "映萃美活研奇肌霜", price: "469", image: images.goodsSkincare1 },
      { id: 2002, name: "映萃美活肤洁颜粉", price: "235", image: images.goodsSkincare2 },
      { id: 2003, name: "当地特产一键速达", price: "99",  image: images.goodsLocal }
    ];
    // 首屏先渲染「首页」tab：避免 init 末尾才 setData 时，长时间无任何图片与列表（后续接口在后台继续跑）
    this.setData({
      banner,
      categoryList,
      quickActions,
      knowledgeList,
      hotList,
      hotFilters,
      merchantList,
      workerList,
      marketList
    });

    // ===== 从数据库获取服务商品（直约服务商）=====
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
    merchantList = mapMerchantList();

    // ===== 从数据库获取直约技工 =====
    try {
      const wRes = await util.get('core/workers');
      const wData = Array.isArray(wRes) ? wRes : (wRes.data || wRes);
      if (Array.isArray(wData) && wData.length > 0) {
        workerList = wData.slice(0, 5).map((w) => ({
          id: w.id,
          name: w.name || '技工',
          orders: w.orders || '服务0单',
          avatar: workerAvatarUrl(w.id)
        }));
      }
    } catch (e) {}

    // ===== 从数据库获取管家精选商品 =====
    try {
      const mRes = await util.get('core/goods/featured');
      const mData = Array.isArray(mRes) ? mRes : (mRes.data || mRes);
      if (Array.isArray(mData) && mData.length > 0) {
        marketList = mData.slice(0, 6).map(g => ({
          id: g.id,
          name: g.goodsTitle || g.title || g.name || '精选商品',
          price: String(g.goodsRealPrice || g.price || ''),
          image: imgUrl(g.mainPicture || g.cover_image || g.image || '/img/placeholders/home_cleaning.png')
        }));
      }
    } catch (e) {}
    // ======================================
    // 本地好物：仅展示真实商品（无兜底商品）
    // ======================================

    // 模块一：顶级海报轮播图
    const pushHeroBanners = [
      { id: 1, image: images.bannerHome },
      { id: 2, image: images.bannerSale }
    ];

    // 模块二：分类金刚
    const pushCategories = mapHomeIcon([
      { name: "爆款专区", icon: "/img/local_goods_icons/fire.png", url: "/pages/push-goods-list/push-goods-list?id=1" },
      { name: "礼物专区", icon: "/img/local_goods_icons/gift.png", url: "/pages/push-goods-list/push-goods-list?id=2" },
      { name: "本地好物甄选", icon: "/img/local_goods_icons/star.png", url: "/pages/push-goods-list/push-goods-list?id=3" },
      { name: "高佣专区", icon: "/img/local_goods_icons/money.png", url: "/pages/push-goods-list/push-goods-list?id=4" }
    ]);

    // 模块三：导购窗
    const pushPromoCards = {
      left:  { title: "品牌好货", image: images.goodsSkincare1 },
      right: { title: "秋冬好物", image: images.pushFashion1 }
    };

    let pushDailyNews = [];
    let pushTopSales = [];
    let pushPeriodicTabs = [];
    let pushPeriodicGoodsDict = {};
    let pushPeriodicGoods = [];
    let pushFeedTabs = [];
    let pushFeedGoodsDict = {};
    let pushFeedGoods = [];
    let activeFeedTab = "";
    let feedPageByTab = {};
    let feedHasMoreByTab = {};
    try {
      const moduleGoods = await this.loadLocalGoodsModules();
      pushDailyNews = moduleGoods.pushDailyNews;
      pushTopSales = moduleGoods.pushTopSales;
      pushPeriodicTabs = moduleGoods.pushPeriodicTabs;
      pushPeriodicGoodsDict = moduleGoods.pushPeriodicGoodsDict;
      pushPeriodicGoods = moduleGoods.pushPeriodicGoods;
      pushFeedTabs = moduleGoods.pushFeedTabs;
      pushFeedGoodsDict = moduleGoods.pushFeedGoodsDict;
      pushFeedGoods = moduleGoods.pushFeedGoods;
      activeFeedTab = moduleGoods.activeFeedTab;
      feedPageByTab = moduleGoods.feedPageByTab;
      feedHasMoreByTab = moduleGoods.feedHasMoreByTab;
    } catch (e) {
      console.log("本地好物模块真实商品加载失败", e);
    }
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
      { title: "低价福利专区", price: "19.9专区", image: images.pushDaily1 },
      { title: "精选生活好物", price: "9.9专区",  image: images.goodsSkincare2 }
    ];
    const fukaFilterTabs = ["精选", "拼多多", "京东"];
    const fukaGoods = [
      { id: 3001, name: "正宗大凉山核桃", price: "36.8", image: images.pushFood1 },
      { id: 3002, name: "近视眼镜",       price: "79.9", image: images.pushDaily2 },
      { id: 3003, name: "冻干草莓",       price: "39.9", image: images.pushFood2 },
      { id: 3004, name: "黄冰糖",         price: "29.9", image: images.pushFood1 }
    ];
    const marketTopCats = mapHomeIcon([
      { name: "母婴生活馆", code: "AAAA", icon: "/img/market_icons/baby.png", url: "../market-banner/market-banner?title=母婴生活馆" },
      { name: "家庭服务", code: "AAAB", icon: "/img/market_icons/home.png", url: "../market-banner/market-banner?title=家庭服务" },
      { name: "超市便利", code: "AAAC", icon: "/img/market_icons/supermarket.png", url: "../market-banner/market-banner?title=超市便利" },
      { name: "美食外卖", code: "AAAD", icon: "/img/market_icons/food.png", url: "../market-banner/market-banner?title=美食外卖" },
      { name: "看病买药", code: "AAAE", icon: "/img/market_icons/medicine.png", url: "../market-banner/market-banner?title=看病买药" },
      { name: "鲜花礼品", code: "AAAF", icon: "/img/market_icons/gift.png", url: "../market-banner/market-banner?title=鲜花礼品" },
      { name: "水果蔬菜", code: "AAAG", icon: "/img/market_icons/fruit.png", url: "../market-banner/market-banner?title=水果蔬菜" },
      { name: "服装首饰", code: "AAAH", icon: "/img/market_icons/clothes.png", url: "../market-banner/market-banner?title=服装首饰" },
      { name: "电子数码", code: "AAAI", icon: "/img/market_icons/tech.png", url: "../market-banner/market-banner?title=电子数码" },
      { name: "本地玩乐", code: "AAAJ", icon: "/img/market_icons/fun.png", url: "../market-banner/market-banner?title=本地玩乐" }
    ]);
    const allMarketShops = [];

    let mergedMarketShops = allMarketShops;
    let activeMarketCat = this.data.activeMarketCat;
    let locRes = null;
    try {
      // 仅使用接口返回的店铺；无数据则为空列表
      locRes = await this.ensureMarketUserCoordsForList();
      const marketRes = await util.get('market/shops', this.buildMarketShopsQuery({ page: 1, page_size: 50 }));
      const marketData = Array.isArray(marketRes)
        ? marketRes
        : (marketRes.list || (marketRes.data && marketRes.data.list) || marketRes.data || []);
      if (Array.isArray(marketData) && marketData.length > 0) {
        const mapped = marketData.map(this.normalizeMarketShop).filter(s => !!s.id);
        if (mapped.length > 0) {
          mergedMarketShops = mapped;
          if (!mapped.some(s => s.cat === activeMarketCat)) {
            activeMarketCat = mapped[0].cat;
          }
        }
      }
    } catch (e) {
      console.log('本地集市店铺接口不可用', e);
    }
    const marketShops = mergedMarketShops.filter(s => s.cat === activeMarketCat);

    let jdBanner = imgUrl(images.benefitJdAllianceHero);
    let pddBanner = imgUrl(images.benefitPddAllianceHero);
    let jdHeroTitle = '';
    let jdHeroSubtitle = '';
    let pddHeroTitle = '';
    let pddHeroSubtitle = '';
    let pddEntry = {
      spreadUrl: 'https://mobile.yangkeduo.com/',
      miniPath: '',
      goodsId: ''
    };
    let jdGoods = [];
    let jdEntry = { skuId: '', spreadUrl: '' };
    let pddGoods = [];
    const pickAllianceList = (res) => {
      if (Array.isArray(res)) return res;
      if (res && res.data && Array.isArray(res.data.list)) return res.data.list;
      if (res && Array.isArray(res.list)) return res.list;
      return [];
    };
    try {
      const disp = await util.get('benefit/display', { scene: 'benefit_card' });
      if (disp && disp.jd) {
        if (disp.jd.heroImage) jdBanner = imgUrl(disp.jd.heroImage);
        jdHeroTitle = disp.jd.heroTitle || '';
        jdHeroSubtitle = disp.jd.heroSubtitle || '';
      }
      if (disp && disp.pdd) {
        if (disp.pdd.heroImage) pddBanner = imgUrl(disp.pdd.heroImage);
        pddHeroTitle = disp.pdd.heroTitle || '';
        pddHeroSubtitle = disp.pdd.heroSubtitle || '';
      }
    } catch (e) {
      console.warn('[惠民卡] benefit/display 失败', e && (e.errmsg || e.message || e));
    }
    try {
      const res = await util.get('jd/benefit/goods', { scene: 'benefit_card' });
      const list = pickAllianceList(res);
      if (list.length > 0) {
        jdGoods = list.map((x, idx) => ({
          id: x.id || idx + 1,
          skuId: String(x.skuId || x.sku_id || ''),
          title: x.title || x.name || '',
          image: imgUrl(x.image || x.image_url || images.pushFood1),
          price: x.price != null && x.price !== '' ? String(x.price) : '',
          rebateAmount: x.rebateAmount || x.rebate_amount || '',
          spreadUrl: x.spreadUrl || x.spread_url || ''
        })).filter(x => !!x.skuId);
        if (jdGoods.length > 0) {
          jdEntry = { skuId: jdGoods[0].skuId, spreadUrl: jdGoods[0].spreadUrl };
        }
      }
    } catch (e) {
      console.warn('[惠民卡] jd/benefit/goods 失败', e && (e.errmsg || e.message || e));
    }
    try {
      const res = await util.get('pdd/benefit/goods', { scene: 'benefit_card' });
      const list = pickAllianceList(res);
      if (list.length > 0) {
        pddGoods = list.map((x, idx) => ({
          id: x.id || idx + 1,
          goodsId: String(x.goodsId || x.goods_id || ''),
          title: x.title || x.name || '',
          image: imgUrl(x.image || x.image_url || images.pushFood1),
          price: String(x.price || ''),
          couponPrice: String(x.couponPrice || x.coupon_price || ''),
          rebateAmount: x.rebateAmount || x.rebate_amount || '',
          spreadUrl: x.spreadUrl || x.spread_url || '',
          miniPath: x.miniPath || x.mini_path || ''
        })).filter(x => !!(x.goodsId || x.spreadUrl));
      }
    } catch (e) {
      console.warn('[惠民卡] pdd/benefit/goods 失败', e && (e.errmsg || e.message || e));
    }
    if (Array.isArray(pddGoods) && pddGoods.length > 0) {
      const first = pddGoods[0];
      pddEntry = {
        spreadUrl: first.spreadUrl || pddEntry.spreadUrl,
        miniPath: first.miniPath || '',
        goodsId: first.goodsId || ''
      };
    }
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
      pushPeriodicTabs,
      pushPeriodicGoods,
      pushPeriodicGoodsDict,

      pushFeedTabs,
      pushFeedGoodsDict,
      pushFeedGoods,
      activeFeedTab,
      feedPageByTab,
      feedHasMoreByTab,

      fukaLocalList,
      fukaServices,
      fukaTopicCards,
      fukaFilterTabs,
      fukaGoods,
      jdGoods,
      jdBanner,
      jdHeroTitle,
      jdHeroSubtitle,
      jdEntry,
      pddGoods,
      pddBanner,
      pddHeroTitle,
      pddHeroSubtitle,
      pddEntry,
      marketTopCats,
      marketFilters: [
        { key: 'comprehensive', label: '综合排序' },
        { key: 'distance', label: '距离优先' }
      ],
      activeMarketSort: locRes && locRes.hasCoords === false ? 'comprehensive' : 'distance',
      activeMarketCat,
      allMarketShops: mergedMarketShops,
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
      pushFeedGoods: [...(this.data.pushFeedGoodsDict[tabName] || [])],
      isLoadingMore: false
    });
  },
  switchBenefitAllianceTab(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.activeBenefitAlliance) return;
    this.setData({ activeBenefitAlliance: key });
  },

  copyBenefitLink(url, toastTitle) {
    const u = url && String(url).trim();
    if (!u) {
      wx.showToast({ title: '暂无推广链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: u,
      success: () => wx.showToast({ title: toastTitle || '已复制', icon: 'none' })
    });
  },

  /**
   * 跳转拼多多官方微信小程序：有 path 则打开指定页，无 path 则打开对方首页（与京东不同，拼多多 H5 链不能塞进联盟 proxy，需 path 或先进小程序首页）
   */
  goToPddBenefit(e) {
    const cfg = (config.benefitAlliance || {});
    const d = e && e.currentTarget ? (e.currentTarget.dataset || {}) : {};
    const goodsId = d.goodsId ? String(d.goodsId) : '';
    const spreadUrl = d.spreadUrl ? String(d.spreadUrl) : '';
    const miniPath = d.miniPath ? String(d.miniPath).trim() : '';
    const pddAppId = cfg.pddMiniAppId || '';

    const openPddMini = (path, fallbackCopy) => {
      if (!pddAppId) {
        wx.showToast({ title: '未配置拼多多小程序 AppId', icon: 'none' });
        return false;
      }
      const opt = {
        appId: pddAppId,
        envVersion: 'release',
        fail: (err) => {
          const msg = (err && err.errMsg) ? String(err.errMsg) : '';
          if (/cancel/.test(msg)) return;
          if (typeof fallbackCopy === 'function') fallbackCopy();
          else wx.showToast({ title: msg || '跳转失败', icon: 'none' });
        }
      };
      if (path && String(path).trim()) {
        opt.path = String(path).replace(/^\//, '');
      }
      wx.navigateToMiniProgram(opt);
      return true;
    };

    const tryCopySpread = () => {
      if (spreadUrl) this.copyBenefitLink(spreadUrl, '跳转失败，推广链接已复制');
      else wx.showToast({ title: '跳转失败', icon: 'none' });
    };

    if (miniPath) {
      openPddMini(miniPath, tryCopySpread);
      return;
    }

    if (goodsId) {
      util.get('pdd/promotion/spread-url', { goods_id: goodsId, scene: 'benefit_card' })
        .then((res) => {
          const url = (res && (res.spreadUrl || res.spread_url || (res.data && (res.data.spreadUrl || res.data.spread_url)))) || '';
          const mp = (res && (res.miniPath || res.mini_path || (res.data && (res.data.miniPath || res.data.mini_path)))) || '';
          if (mp) {
            openPddMini(String(mp), tryCopySpread);
            return;
          }
          if (openPddMini('', () => {
            if (url) this.copyBenefitLink(url, '推广链接已复制，可在浏览器打开');
            else tryCopySpread();
          })) return;
        })
        .catch(() => {
          openPddMini('', tryCopySpread);
        });
      return;
    }

    openPddMini('', tryCopySpread);
  },

  goToJDMiniprogram(e) {
    const cfg = (config.benefitAlliance || {});
    const jdAppId = cfg.jdUnionAppId || 'wx91d27dbf599dff74';
    const dataset = e && e.currentTarget ? (e.currentTarget.dataset || {}) : {};
    const skuId = dataset.skuId ? String(dataset.skuId) : '';
    const fallbackSpreadUrl = dataset.spreadUrl ? String(dataset.spreadUrl) : '';
    const openBySpreadUrl = (url) => {
      const encoded = encodeURIComponent(url);
      wx.navigateToMiniProgram({
        appId: jdAppId,
        path: `/pages/union/proxy/proxy?spreadUrl=${encoded}`,
        envVersion: 'release',
        fail: (err) => {
          const msg = (err && err.errMsg) ? err.errMsg : '跳转失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      });
    };
    if (!skuId) {
      if (fallbackSpreadUrl) return openBySpreadUrl(fallbackSpreadUrl);
      wx.showToast({ title: '缺少商品信息', icon: 'none' });
      return;
    }
    util.get('jd/promotion/spread-url', { sku_id: skuId, scene: 'benefit_card' })
      .then((res) => {
        const url = (res && (res.spreadUrl || res.spread_url || (res.data && (res.data.spreadUrl || res.data.spread_url)))) || '';
        if (url) return openBySpreadUrl(url);
        if (fallbackSpreadUrl) return openBySpreadUrl(fallbackSpreadUrl);
        wx.showToast({ title: '暂无法生成推广链接', icon: 'none' });
      })
      .catch(() => {
        if (fallbackSpreadUrl) return openBySpreadUrl(fallbackSpreadUrl);
        wx.showToast({ title: '网络异常', icon: 'none' });
      });
  },

  // ---- 小程序级：触底加载更多 ----
  async onReachBottom() {
    if (this.data.activeTab !== '本地好物') return;
    if (this.data.isLoadingMore) return;
    const activeFeedTab = this.data.activeFeedTab;
    if (!activeFeedTab) return;
    const hasMore = (this.data.feedHasMoreByTab || {})[activeFeedTab];
    if (!hasMore) return;

    this.setData({ isLoadingMore: true });
    wx.showLoading({ title: '加载中...', mask: true });
    try {
      const { list, hasMore: nextHasMore, page } = await this.loadMoreFeedGoods(activeFeedTab);
      const current = this.data.pushFeedGoods || [];
      const merged = current.concat(list);
      const feedPageByTab = { ...(this.data.feedPageByTab || {}), [activeFeedTab]: page };
      const feedHasMoreByTab = { ...(this.data.feedHasMoreByTab || {}), [activeFeedTab]: nextHasMore };
      const pushFeedGoodsDict = {
        ...(this.data.pushFeedGoodsDict || {}),
        [activeFeedTab]: merged
      };
      this.setData({
        pushFeedGoods: merged,
        pushFeedGoodsDict,
        feedPageByTab,
        feedHasMoreByTab,
        isLoadingMore: false
      });
    } catch (e) {
      this.setData({ isLoadingMore: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
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
  normalizeModuleGoods(item, i, extra = {}) {
    const row = util.normalizeShopProductRow(item, i);
    const id = item.id || item.goods_id || `${extra.module || 'mod'}_${i}`;
    const rankRaw = item.rank != null ? item.rank : (i + 1);
    return {
      ...row,
      id,
      title: row.name,
      rank: String(rankRaw).padStart(2, '0'),
      distance_km: util.extractDistanceKmFromProduct(item)
    };
  },
  normalizeModuleList(list, extra = {}) {
    const arr = Array.isArray(list) ? list : [];
    return util.filterShopProductsByDistance(arr, 5).map((item, idx) => this.normalizeModuleGoods(item, idx, extra));
  },
  buildLocalGoodsQuery(extra = {}) {
    return util.buildShopGoodsQuery({ distance_km: 5, ...extra });
  },
  async loadLocalGoodsModules() {
    await this.ensureMarketUserCoordsForList();
    const res = await util.get('local-goods-home/modules', this.buildLocalGoodsQuery());
    const payload = res && typeof res === 'object' ? (res.data || res) : {};

    const rawDaily = payload.daily_news || payload.dailyNews || [];
    const rawTop = payload.top_sales || payload.topSales || [];
    const rawPeriodic = payload.periodic_modules || payload.periodic || [];
    const rawFeed = payload.feed_modules || payload.feed || [];

    const pushDailyNews = this.normalizeModuleList(rawDaily, { module: 'daily_news' }).slice(0, 4);
    const pushTopSales = this.normalizeModuleList(rawTop, { module: 'top_sales' }).slice(0, 3);

    const pushPeriodicTabs = [];
    const pushPeriodicGoodsDict = {};
    (Array.isArray(rawPeriodic) ? rawPeriodic : []).forEach((m, idx) => {
      const tab = m.module_name || m.name || m.title || `周期模块${idx + 1}`;
      const list = this.normalizeModuleList(m.goods_list || m.products || m.items || [], { module: tab });
      pushPeriodicTabs.push(tab);
      pushPeriodicGoodsDict[tab] = list;
    });
    const pushPeriodicGoods = pushPeriodicTabs.length > 0 ? (pushPeriodicGoodsDict[pushPeriodicTabs[0]] || []) : [];

    const pushFeedTabs = [];
    const pushFeedGoodsDict = {};
    const feedPageByTab = {};
    const feedHasMoreByTab = {};
    (Array.isArray(rawFeed) ? rawFeed : []).forEach((m) => {
      const tab = m.module_name || m.name || m.title;
      if (!tab) return;
      const list = this.normalizeModuleList(m.goods_list || m.products || m.items || [], { module: tab });
      pushFeedTabs.push(tab);
      pushFeedGoodsDict[tab] = list;
      feedPageByTab[tab] = Number(m.page || 1);
      feedHasMoreByTab[tab] = !!m.has_more;
    });
    const activeFeedTab = pushFeedTabs[0] || "";
    const pushFeedGoods = activeFeedTab ? [...(pushFeedGoodsDict[activeFeedTab] || [])] : [];

    return {
      pushDailyNews,
      pushTopSales,
      pushPeriodicTabs,
      pushPeriodicGoodsDict,
      pushPeriodicGoods,
      pushFeedTabs,
      pushFeedGoodsDict,
      pushFeedGoods,
      activeFeedTab,
      feedPageByTab,
      feedHasMoreByTab
    };
  },
  async loadMoreFeedGoods(tabName) {
    const currentPage = Number((this.data.feedPageByTab || {})[tabName] || 1);
    const nextPage = currentPage + 1;
    const q = this.buildLocalGoodsQuery({
      module_name: tabName,
      page: nextPage,
      page_size: this.data.pageSize || 10
    });
    const res = await util.get('local-goods-home/feed-products', q);
    const payload = res && typeof res === 'object' ? (res.data || res) : {};
    const list = this.normalizeModuleList(payload.list || payload.items || payload.goods_list || [], { module: tabName });
    const hasMore = !!payload.has_more;
    return { list, hasMore, page: nextPage };
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
    const tabs = this.data.pushPeriodicTabs || [];
    const tabName = tabs[idx];
    const dict = this.data.pushPeriodicGoodsDict || {};
    const newList = tabName ? (dict[tabName] || []) : [];

    this.setData({
      activePeriodicTabIndex: idx,
      pushPeriodicGoods: newList
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
