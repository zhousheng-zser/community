//index.js
//获取应用实例
const app = getApp();
const util = require('../../utils/util.js');
const config = require('../../utils/config.js');
const geo = require('../../utils/geo.js');
const { imgUrl, pickMarketShopAvatarPath } = util;
const images = require('../../utils/images.js');
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
    pushHotVideos: [],
    pushPeriodicTabs: [],
    pushPeriodicGoods: [],
    pushFeedGoods: [],
    fukaLocalList: [],
    fukaServices: [],
    fukaTopicCards: [],
    fukaFilterTabs: [],
    fukaGoods: [],
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
  /** 地址页保存/编辑/删除/设默认后，清空家集市缓存并重拉当前分类店铺 */
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
  /** 家集市：定位缓存键（与 radius 联动时避免错误命中旧缓存） */
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
   * 家集市定位（须与产品一致）：
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
      cat: item.category || '家集市',
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
  /** 用户主动选点：覆盖自动定位逻辑，家集市后续请求以本次坐标为准，直至地址变更等场景清空 manual */
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
      { id: 28, name: "洗衣机清洗",   price: "128", image: images.hotWasher, rank: "NO.1" },
      { id: 30, name: "热水器清洗",   price: "150", image: images.hotHeater, rank: "NO.2" },
      { id: 27, name: "油烟机清洗",   price: "158", image: images.hotHood,   rank: "NO.3" },
      { id: 26, name: "金牌日常保洁", price: "99",  image: images.hotClean,  rank: "热门" }
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
      { id: 1, remarkC: images.hotClean,   goodsTitle: '金牌日常保洁 (2小时)',   goodsSub: '专业团队，含客厅、卧室、厨房、卫生间清洁', price: '99.00' },
      { id: 2, remarkC: images.svcAircon,  goodsTitle: '挂壁式空调深度清洗',     goodsSub: '高温蒸汽杀菌，拆洗过滤网、导风板，去除异味', price: '89.00' },
      { id: 3, remarkC: images.svcWasher,  goodsTitle: '洗衣机深度清洗',         goodsSub: '专业拆洗内桶，高温消毒除霉，恢复洁净如新', price: '128.00' },
      { id: 4, remarkC: images.svcHood,    goodsTitle: '油烟机深度清洗',         goodsSub: '专业拆洗油网、风轮，高温溶油去污', price: '158.00' }
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
    // ===== 从数据库获取直约技工 =====
    let workerList = [
      { id: 1, name: "余静", orders: "服务1单", avatar: imgUrl('/img/placeholders/home_cleaning.png') },
      { id: 2, name: "张乾坤", orders: "服务0单", avatar: imgUrl('/img/placeholders/home_cleaning.png') },
      { id: 3, name: "张谕晗", orders: "服务0单", avatar: imgUrl('/img/placeholders/home_cleaning.png') }
    ];
    try {
      const wRes = await util.get('core/workers');
      const wData = Array.isArray(wRes) ? wRes : (wRes.data || wRes);
      if (Array.isArray(wData) && wData.length > 0) {
        workerList = wData.slice(0, 5).map(w => ({
          id: w.id,
          name: w.name || '技工',
          orders: w.orders || '服务0单',
          avatar: w.avatar || imgUrl('/img/placeholders/home_cleaning.png')
        }));
      }
    } catch (e) {}

    // ===== 从数据库获取管家精选商品 =====
    let marketList = [
      { id: 2001, name: "映萃美活研奇肌霜", price: "469", image: images.goodsSkincare1 },
      { id: 2002, name: "映萃美活肤洁颜粉", price: "235", image: images.goodsSkincare2 },
      { id: 2003, name: "当地特产一键速达", price: "99",  image: images.goodsLocal }
    ];
    try {
      const mRes = await util.get('core/goods/featured');
      const mData = Array.isArray(mRes) ? mRes : (mRes.data || mRes);
      if (Array.isArray(mData) && mData.length > 0) {
        marketList = mData.slice(0, 6).map(g => ({
          id: g.id,
          name: g.goodsTitle || g.title || g.name || '精选商品',
          price: String(g.goodsRealPrice || g.price || ''),
          image: g.mainPicture || g.cover_image || g.image || imgUrl('/img/placeholders/home_cleaning.png')
        }));
      }
    } catch (e) {}
    // ======================================
    // 家推 (JiaTui) 真实图片源 Mock 数据注入
    // ======================================

    // 模块一：顶级海报轮播图
    const pushHeroBanners = [
      { id: 1, image: images.bannerHome },
      { id: 2, image: images.bannerSale }
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
      left:  { title: "品牌好货", image: images.goodsSkincare1 },
      right: { title: "秋冬好物", image: images.pushFashion1 }
    };

    // 模块四：上新与热卖
    const pushDailyNews = [
      { id: 1, name: "正宗东北黑木耳",   price: "19.00", comm: "2.43",  image: images.pushFood1,   isHot: false },
      { id: 2, name: "大果新鲜蓝莓",     price: "39.90", comm: "13.53", image: images.pushFood2,   isHot: true },
      { id: 3, name: "深层洁净洗衣液",   price: "15.90", comm: "2.04",  image: images.pushDaily1,  isHot: false },
      { id: 4, name: "特级婴儿柔护纸巾", price: "99.00", comm: "22.18", image: images.pushDaily2,  isHot: false }
    ];

    const pushTopSales = [
      { rank: "01", name: "浓缩纯牛奶整箱",   comm: "3.83", image: images.pushFood1 },
      { rank: "02", name: "早餐手撕面包",     comm: "2.52", image: images.pushFood2 },
      { rank: "03", name: "除菌持久洗衣凝珠", comm: "4.78", image: images.pushDaily1 }
    ];

    // 模块七：横排带货视频录播
    const pushHotVideos = [
      { id: 101, title: "老榆木板原木桌面实木切割测试",          price: "300.00", comm: "15.00", likes: 2,  author: "榆园家具",   image: images.pushDaily1 },
      { id: 102, title: "日常保养，补钙还是喝奶更好？",          price: "97.80",  comm: "14.67", likes: 0,  author: "养生说",     image: images.pushFood2 },
      { id: 103, title: "新西兰厚切牛排，买二送一！",            price: "129.9",  comm: "8.80",  likes: 5,  author: "生鲜直供",   image: images.pushFood1 },
      { id: 104, title: "大师香氛玫瑰洗衣液护色洁净柔顺",       price: "99.90",  comm: "24.97", likes: 13, author: "立白精品",   image: images.pushDaily1 },
      { id: 105, title: "立白大师格拉斯玫瑰香氛洗衣液深层...",  price: "69.0",   comm: "10.00", likes: 8,  author: "立白精品",   image: images.pushDaily2 },
      { id: 106, title: "立白小白白衣物去油王250g精化...",       price: "35.50",  comm: "5.00",  likes: 11, author: "立白精品",   image: images.pushDaily2 }
    ];

    // 模块八：排期榜单 (周期主推) - 提供不同的三组带货数据假刷新效果
    const pushPeriodicTabs = ["今日主推", "本周热卖", "本月排行"];
    const pushPeriodicBaseGoods = [
      { id: 201, title: "多功能厨房沥水篮家用洗菜盆三件套加厚",       price: "24.90", comm: "3.22", tag: "全网爆款", image: images.pushDaily1 },
      { id: 202, title: "网红小零食休闲充饥夜宵干脆面拉面丸子",       price: "9.90",  comm: "1.08",              image: images.pushFood2 },
      { id: 203, title: "[品质升级！ 三合一快充线]三合一数据线快充...", price: "4.99",  comm: "0.22",              image: images.pushDaily2 },
      { id: 204, title: "[年年宏]桑葚坚果糕红枣枸杞核桃软糕美味手...", price: "39.90", comm: "6.38",              image: images.pushFood1 }
    ];
    // 默认展示两项
    const pushPeriodicGoods = [pushPeriodicBaseGoods[0], pushPeriodicBaseGoods[1]];

    // 模块九长效分类导航数据与缓存字典
    const pushFeedTabs = ["高佣推荐", "健康食品", "美妆个护", "日用百货"];
    // 记录获取到的商品
    let pushFeedGoodsDict = {
      "高佣推荐": [
        { id: 201, title: "内衣裤清新剂清洁内裤持久清洗液抑菌专用", price: "5.90",  comm: "0.45", image: images.pushDaily1 },
        { id: 202, title: "体重秤充电款 电子秤 精准光能驱动",         price: "19.90", comm: "2.16", image: images.pushDaily2 }
      ],
      "健康食品": [], "美妆个护": [], "日用百货": []
    };

    // 统一切换拉取真实推送商品（包含上新、热卖等所有品类）
    try {
      const spRes = await util.get('api/v1/shop-products');
      const spData = Array.isArray(spRes) ? spRes : (spRes.data || spRes);
      if (Array.isArray(spData) && spData.length > 0) {
        // 分配给每日上新
        const news = spData.filter(s => s.category === '每日上新');
        if (news.length > 0) {
          pushDailyNews = news.map(s => ({
            id: s.id, name: s.name, price: String(s.pay_price), comm: String(s.rebate_amount), image: s.main_image || imgUrl('/img/placeholders/home_cleaning.png'), isHot: false
          }));
        }
        
        // 分配给热卖榜
        const tops = spData.filter(s => s.category === '热卖TOP榜');
        if (tops.length > 0) {
          pushTopSales = tops.map((s, i) => ({
            id: s.id, rank: (i + 1).toString().padStart(2, '0'), name: s.name, comm: String(s.rebate_amount), image: s.main_image || imgUrl('/img/placeholders/home_cleaning.png')
          }));
        }

        // 分配给 Feed 流
        ["高佣推荐", "健康食品", "美妆个护", "日用百货"].forEach(cat => {
          const feedItems = spData.filter(s => s.category === cat);
          if (feedItems.length > 0) {
            pushFeedGoodsDict[cat] = feedItems.map(s => ({
              id: s.id, title: s.name, price: String(s.pay_price), comm: String(s.rebate_amount), image: s.main_image || imgUrl('/img/placeholders/home_cleaning.png'), tag: cat === "高佣推荐" ? "定向高佣" : ""
            }));
          }
        });
      }
    } catch (e) {
      console.log("加载真实推流商品数据失败, 仍采用兜底测试数据", e);
    }

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
      { title: "低价福利专区", price: "19.9专区", image: images.pushDaily1 },
      { title: "精选生活好物", price: "9.9专区",  image: images.goodsSkincare2 }
    ];
    const fukaFilterTabs = ["精选", "拼多多", "淘宝", "京东"];
    const fukaGoods = [
      { id: 3001, name: "正宗大凉山核桃", price: "36.8", image: images.pushFood1 },
      { id: 3002, name: "近视眼镜",       price: "79.9", image: images.pushDaily2 },
      { id: 3003, name: "冻干草莓",       price: "39.9", image: images.pushFood2 },
      { id: 3004, name: "黄冰糖",         price: "29.9", image: images.pushFood1 }
    ];
    const marketTopCats = [
      { name: "母婴生活馆", code: "AAAA", emoji: "👶", bgColor: "#fff5e0", url: "../market-banner/market-banner?title=母婴生活馆" },
      { name: "家庭服务", code: "AAAB", emoji: "🏠", bgColor: "#e0eeff", url: "../market-banner/market-banner?title=家庭服务" },
      { name: "超市便利", code: "AAAC", emoji: "🛒", bgColor: "#e4ffe0", url: "../market-banner/market-banner?title=超市便利" },
      { name: "美食外卖", code: "AAAD", emoji: "🍱", bgColor: "#ffe0df", url: "../market-banner/market-banner?title=美食外卖" },
      { name: "看病买药", code: "AAAE", emoji: "💊", bgColor: "#e6ffe0", url: "../market-banner/market-banner?title=看病买药" },
      { name: "鲜花礼品", code: "AAAF", emoji: "💐", bgColor: "#ffe0f5", url: "../market-banner/market-banner?title=鲜花礼品" },
      { name: "水果蔬菜", code: "AAAG", emoji: "🥬", bgColor: "#f0ffe0", url: "../market-banner/market-banner?title=水果蔬菜" },
      { name: "服装首饰", code: "AAAH", emoji: "👗", bgColor: "#ede8ff", url: "../market-banner/market-banner?title=服装首饰" },
      { name: "电子数码", code: "AAAI", emoji: "💻", bgColor: "#e0f3ff", url: "../market-banner/market-banner?title=电子数码" },
      { name: "本地玩乐", code: "AAAJ", emoji: "🎡", bgColor: "#fff0f5", url: "../market-banner/market-banner?title=本地玩乐" }
    ];
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
      console.log('家集市店铺接口不可用', e);
    }
    const marketShops = mergedMarketShops.filter(s => s.cat === activeMarketCat);

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
        { id: 900 + newPage * 10, title: `[第${newPage}页加载] ${activeFeedTab} 热卖好物`, price: (Math.random() * 50).toFixed(2), comm: "0.88", image: imgUrl('/img/placeholders/home_cleaning.png') },
        { id: 901 + newPage * 10, title: `网销爆款 ${activeFeedTab} 超值特购包邮`, price: (Math.random() * 80).toFixed(2), comm: "1.10", image: imgUrl('/img/placeholders/home_cleaning.png') },
        { id: 902 + newPage * 10, title: `品质严选 ${activeFeedTab} 家用装`, price: (Math.random() * 30).toFixed(2), comm: "1.50", image: imgUrl('/img/placeholders/home_cleaning.png') }
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
