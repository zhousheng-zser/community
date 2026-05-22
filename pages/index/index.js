//index.js
//获取应用实例
const app = getApp();
const util = require('../../utils/util.js');
const config = require('../../utils/config.js');
const geo = require('../../utils/geo.js');
const api = require('../../api/index.js');
const { unwrapList, imgUrl } = util;
const images = require('../../utils/images.js');
const indexHelper = require('../../utils/indexHelper.js');
const { listImageFromHome3, resolveServiceListImage } = require('../../utils/serviceHome3.js');
const { mapWorkerForHomeCard } = require('../../utils/workerApiMap.js');
const {
  getActiveCommunityId,
  isManualLocationPick,
  applyPortalCommunityFromLocation,
  fetchWorkerRows,
  fetchServiceProviderRows,
  mapServiceProviderForHomeCard
} = require('../../utils/communityPortal.js');
const { getLocalBenefitCardPayload } = require('../../utils/benefitAllianceLocal.js');
const { pickHeroFromApi, getThemeBannerPath } = require('../../utils/benefitAllianceHero.js');
const { mapRawModulesToCategoryRows, HOME_CATEGORY_ICON_BY_KEY } = require('../../utils/homeModulesMap.js');

/** 惠民卡 · 肯德基/星巴克/百果园：与「京东联盟」区块同一套字段（头图 + 精选网格 + GO） */
function mapChainBrandToAllianceSection(raw, imgUrlFn) {
  const key = String(raw.key || '').trim();
  const title = raw.title || '';
  const subtitle = raw.subtitle != null ? String(raw.subtitle) : String(raw.sub || '');
  const keyword = (raw.keyword != null ? String(raw.keyword) : '').trim();
  const miniAppId = (raw.miniAppId || raw.mini_app_id || '').trim();
  const miniPath = (raw.miniPath || raw.mini_path || '').trim();
  const heroByKey = {
    kfc: images.benefitChainKfcHero,
    xbk: images.benefitChainXbkHero,
    bgy: images.benefitChainBgyHero
  };
  const cardByKey = {
    kfc: images.benefitChainKfc,
    xbk: images.benefitChainXbk,
    bgy: images.benefitChainBgy
  };
  const imgRaw = (raw.imageUrl || raw.image_url || '').trim() || cardByKey[key] || '';
  const cardImage = imgRaw ? imgUrlFn(imgRaw) : imgUrlFn(cardByKey[key] || images.benefitChainKfc);
  const banner = imgUrlFn(heroByKey[key] || cardByKey[key] || images.benefitJdAllianceHero);
  return {
    key,
    title,
    sub: subtitle,
    keyword,
    miniAppId,
    miniPath,
    banner,
    cardImage,
    heroTitle: raw.heroTitle ? String(raw.heroTitle) : `惠民卡 · ${title}`,
    heroSub: raw.heroSub ? String(raw.heroSub) : (subtitle || '聚推客 · 先领券再下单'),
    listTitle: raw.listTitle ? String(raw.listTitle) : `${title} · 精选`,
    cardTitle: raw.cardTitle ? String(raw.cardTitle) : `${title}在线点餐`,
    priceHint: raw.priceHint ? String(raw.priceHint) : '活动价以小程序为准 · 点击进入',
    ctaTitle: raw.ctaTitle ? String(raw.ctaTitle) : `去${title}小程序`,
    ctaSub: raw.ctaSub ? String(raw.ctaSub) : '打开合作方微信小程序（与活动页路径一致）'
  };
}

function defaultBenefitChainBrandList(imgUrlFn) {
  return [
    mapChainBrandToAllianceSection(
      {
        key: 'kfc',
        title: '肯德基',
        subtitle: '炸鸡汉堡 · 在线点餐（聚推客）',
        keyword: '肯德基',
        miniAppId: 'wx89752980e795bfde',
        miniPath: '/pages/index/index?pub_id=462602&sid=123456&act_id=16&source=jutuike',
        image_url: '/img/benefit_chain/kfc.jpg'
      },
      imgUrlFn
    ),
    mapChainBrandToAllianceSection(
      {
        key: 'xbk',
        title: '星巴克',
        subtitle: '咖啡星享 · 在线点单（聚推客）',
        keyword: '星巴克',
        miniAppId: 'wx89752980e795bfde',
        miniPath: '/pages/index/index?pub_id=462602&sid=123456&act_id=34&source=jutuike',
        image_url: '/img/benefit_chain/xbk.jpg'
      },
      imgUrlFn
    ),
    mapChainBrandToAllianceSection(
      {
        key: 'bgy',
        title: '百果园',
        subtitle: '时令水果 · 外送门店（聚推客）',
        keyword: '百果园',
        miniAppId: 'wx89752980e795bfde',
        miniPath: '/pages/index/index?pub_id=462602&sid=123456&act_id=31&source=jutuike',
        image_url: '/img/benefit_chain/bgy.jpg'
      },
      imgUrlFn
    )
  ];
}

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
      { text: "本地商城" },
      { text: "首页" },
      { text: "本地集市" }
    ],
    categoryList: [],
    /** 轮播：须在 data 中有初值，避免 wx:for 在 undefined 上行为异常或旧基础库问题 */
    banner: [],
    quickActions: [],
    knowledgeList: [],
    hotList: [],
    assistMarqueeList: [],
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
    pushFeedTabs: [],
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
    /** 新增：美团 / 淘宝 / 闪购 / 社群 / 推销 */
    mtGoods: [],
    mtBanner: "",
    mtHeroTitle: "",
    mtHeroSubtitle: "",
    tbGoods: [],
    tbBanner: "",
    tbHeroTitle: "",
    tbHeroSubtitle: "",
    sgGoods: [],
    sgBanner: "",
    sgHeroTitle: "",
    sgHeroSubtitle: "",
    sqGoods: [],
    sqBanner: "",
    sqHeroTitle: "",
    sqHeroSubtitle: "",
    txGoods: [],
    txBanner: "",
    txHeroTitle: "",
    txHeroSubtitle: "",
    /** 大牌餐饮：与京东联盟同版式（头图+精选+GO），接口 chainBrands 覆盖 */
    benefitBrandList: defaultBenefitChainBrandList(imgUrl),
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
    marketShopsCacheByCat: {}, // { [catName]: mappedShopList }
    /** 第三方便民小程序：仅展示中台配置了 appId 的项，无配置时不占位 */
    thirdPartyMiniPrograms: []
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
    const runInit = () =>
      that.init().catch((err) => {
        console.error('[index] init 失败', err);
      });
    runInit();
    app.save(parentOpId, runInit);
  },
  onShow: function () {
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
    if (isManualLocationPick()) {
      try {
        const text =
          wx.getStorageSync('portal_last_location_text') ||
          wx.getStorageSync('market_location_label') ||
          '';
        if (text) this._applyPortalCommunityFromLocation({ name: text, label: text }, { manual: true });
      } catch (e) {
        /* ignore */
      }
    } else if (getActiveCommunityId(app) == null) {
      try {
        const locLabel = wx.getStorageSync('market_location_label');
        if (locLabel) this._applyPortalCommunityFromLocation({ label: locLabel }, { manual: false });
      } catch (e) {
        /* ignore */
      }
    }
    this.refreshPortalListsForCommunity();
  },

  /**
   * 地图选点 / 地址吸附 → 直约小区；主动选点且不在运营范围时清空直约列表
   * @returns {boolean} 是否匹配到运营站点
   */
  async _applyPortalCommunityFromLocation(loc, options) {
    const matched = await applyPortalCommunityFromLocation(loc, options);
    if (matched) {
      const cid = getActiveCommunityId(getApp());
      if (cid != null) this._syncUserCommunityId(cid);
    }
    this.refreshPortalListsForCommunity();
    return matched;
  },

  /** 首页选点匹配到运营站点时，同步写入用户资料，便于社区发帖 */
  _syncUserCommunityId(communityId) {
    const cid = Number(communityId);
    if (!Number.isFinite(cid) || cid <= 0) return;
    const app = getApp();
    const user = (app.globalData && app.globalData.user) || {};
    if (user.communityId === cid || user.community_id === cid) return;
    api.user.updateProfileFields({ community_id: cid }).then(() => {
      app.globalData.user = Object.assign({}, user, {
        communityId: cid,
        community_id: cid
      });
      try { wx.setStorageSync('user_community_id', String(cid)); } catch (e) { /* ignore */ }
    }).catch(() => {});
  },

  /** 按当前小区刷新「直约技工」「直约服务商」（与查看全部页同源） */
  async refreshPortalListsForCommunity() {
    const communityId = getActiveCommunityId(getApp());
    try {
      const rows = await fetchWorkerRows(communityId, { page: 1, limit: 50 });
      this.setData({ workerList: rows.slice(0, 8).map(mapWorkerForHomeCard) });
    } catch (e) {
      console.log('[index] 刷新技工列表失败', e);
      this.setData({ workerList: [] });
    }
    try {
      const plist = await fetchServiceProviderRows(communityId, { limit: 8 });
      this.setData({
        merchantList: plist.slice(0, 8).map((p) => mapServiceProviderForHomeCard(p, imgUrl))
      });
    } catch (e) {
      console.log('[index] 刷新服务商列表失败', e);
      this.setData({ merchantList: [] });
    }
  },
  /** 地址页保存/编辑/删除/设默认后，清空本地集市缓存并重拉当前分类店铺 */
  _maybeRefreshMarketAfterAddressChange() {
    const flag = wx.getStorageSync('market_refresh_after_address');
    if (!flag) return;
    util.clearMarketLocationCache();
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
    this.init().catch((err) => console.error('[index] 下拉刷新 init 失败', err));
    wx.stopPullDownRefresh();
  },
  switchTopTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },
  /** Banner：link_type none | service | h5 | page */
  onHomeBannerTap(e) {
    const idx = e.currentTarget.dataset.idx;
    const list = this.data.banner || [];
    const item = list[idx];
    if (!item) return;
    const t = (item.linkType || 'none').toLowerCase();
    const val = item.linkValue != null ? String(item.linkValue).trim() : '';
    if (t === 'none' || !val) return;
    if (t === 'service') {
      wx.navigateTo({ url: `/pages/service/service?id=${encodeURIComponent(val)}` });
      return;
    }
    if (t === 'page') {
      const path = val.startsWith('/') ? val : `/${val}`;
      wx.navigateTo({ url: path });
      return;
    }
    if (t === 'h5') {
      wx.setClipboardData({
        data: val,
        success: () => wx.showToast({ title: '链接已复制', icon: 'none' })
      });
    }
  },
  /** 本地集市：定位缓存键（与 radius 联动时避免错误命中旧缓存） */
  getMarketLocationCacheKey() {
    const coords = util.getMarketUserCoords();
    if (!coords) return 'noloc';
    return `${coords.lat.toFixed(3)}_${coords.lng.toFixed(3)}`;
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
    const coords = util.getMarketUserCoords();
    const hasCoords = !!coords;
    if (hasCoords) {
      q.user_lat = coords.lat;
      q.user_lng = Number(coords.lng);
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
    const hasCoords = !!util.getMarketUserCoords();
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
      const res = await api.user.getAddressList();
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
        if (util.getMarketUserCoords()) {
          resolve({ hasCoords: true });
          return;
        }
        wx.removeStorageSync('market_user_location_manual');
      }
      if (util.getMarketUserCoords()) {
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
              util.setMarketSnapInfo(snap.id, snap.dKm);
            } else {
              util.removeMarketSnapInfo();
            }
          } catch (e) {
            /* 吸附失败则仍用 GPS */
          }
          util.setMarketUserCoords(finalLat, finalLng);
          if (snapLabel) {
            util.setMarketLocationLabel(snapLabel);
            this.setData({ currentCity: snapLabel });
            this._applyPortalCommunityFromLocation({ label: snapLabel }, { manual: false });
          } else {
            util.removeMarketLocationLabel();
            this.setData({ currentCity: '已定位' });
          }
          resolve({ hasCoords: true });
        },
        fail: async () => {
          try {
            const list = await this.loadUserAddressesForSnap();
            const fallback = geo.getDefaultAddressCoords(list);
            if (fallback) {
              util.setMarketUserCoords(fallback.lat, fallback.lng);
              util.setMarketLocationLabel(fallback.label);
              if (fallback.id != null) util.setMarketSnapInfo(fallback.id, fallback.dKm);
              this.setData({ currentCity: fallback.label });
              this._applyPortalCommunityFromLocation(
                { label: fallback.label, address: fallback.label },
                { manual: false }
              );
              resolve({ hasCoords: true });
              return;
            }
          } catch (e) {
            /* ignore */
          }
          util.removeMarketUserCoords();
          util.removeMarketSnapInfo();
          util.removeMarketLocationLabel();
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
      const marketRes = await api.market.getShopList(query);
      wx.hideLoading();
      const list = Array.isArray(marketRes)
        ? marketRes
        : (marketRes.list || (marketRes.data && marketRes.data.list) || marketRes.data || []);
      const mapped = Array.isArray(list) ? list.map(s => indexHelper.normalizeMarketShop(s)).filter(s => !!s.id) : [];
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
  onHomeSearchInput(e) {
    this.setData({ homeSearchKeyword: e.detail.value });
  },
  goSearch() {
    const isMall = this.data.activeTab === '本地商城';
    // 当跳转到搜索页面时，携带关键字以及标识是否商城
    const kw = this.data.homeSearchKeyword || '';
    wx.navigateTo({
      url: `/pages/shopping-search/shopping-search?kw=${encodeURIComponent(kw)}&isMall=${isMall}`
    });
  },
  /** 用户主动选点：覆盖自动定位逻辑，本地集市后续请求以本次坐标为准，直至地址变更等场景清空 manual */
  handleLocationTap() {
    wx.chooseLocation({
      success: async (res) => {
        wx.setStorageSync('market_user_location_manual', 1);
        util.setMarketUserCoords(res.latitude, res.longitude);
        util.removeMarketSnapInfo();
        util.removeMarketLocationLabel();
        this.setData({ marketShopsCacheByCat: {} });
        const city = res.address ? res.address.replace(/省.*/, '').replace(/市.*/, '').slice(0, 4) : (res.name ? res.name.slice(0, 4) : '已定位');
        this.setData({ currentCity: city || '已定位' });
        const syncedCommunity = await this._applyPortalCommunityFromLocation(
          {
            name: res.name,
            address: res.address,
            latitude: res.latitude,
            longitude: res.longitude
          },
          { manual: true }
        );
        let toastTitle = res.name ? '已定位到' + res.name : '定位已更新';
        if (syncedCommunity) toastTitle = '已匹配服务小区';
        else if (isManualLocationPick()) toastTitle = '当前区域暂无直约服务';
        wx.showToast({ title: toastTitle, icon: 'none' });
        const cat = this.data.activeMarketCat;
        this.switchMarketCategory({ currentTarget: { dataset: { code: cat } } }, true);
        this.refreshLocalGoodsModulesForLocation();
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

  goNeighborCommunity() {
    const app = getApp();
    if (app.globalData) app.globalData.communityTargetTab = '邻里互动';
    wx.switchTab({ url: '/pages/community/community' });
  },

  goHotListMore() {
    wx.navigateTo({ url: '../community-hot-list/community-hot-list' });
  },

  goServiceProviderPortal() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/package-service-provider/pages/sp-home/sp-home' });
  },

  jumpToMiniProgram(e) {
    const idx = e.currentTarget.dataset.idx;
    const mp = this.data.thirdPartyMiniPrograms[idx];
    if (!mp) return;

    if (!mp.appId) return;

    wx.navigateToMiniProgram({
      appId: mp.appId,
      path: mp.path,
      envVersion: 'release',
      success(res) {
        console.log('跳转成功', res);
      },
      fail(err) {
        console.log('跳转失败', err);
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  },

  goAssistFromMarquee(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const mock = String(id).startsWith('m') ? '&mock=1' : '';
    wx.navigateTo({
      url: `/pages/neighbor-assist-order-detail/neighbor-assist-order-detail?id=${id}${mock}`
    });
  },
  goMarketShop(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: "../market-shop/market-shop?id=" + id });
  },
  goMarketGoods(e) {
    const id = e.currentTarget.dataset.id;
    const image = e.currentTarget.dataset.image || '';
    const name = e.currentTarget.dataset.name || '';
    const price = e.currentTarget.dataset.price || '';
    const shopId = e.currentTarget.dataset.shopId || '';
    wx.navigateTo({ url: "/package-push/pages/push-product-detail/push-product-detail?id=" + id + "&shopId=" + encodeURIComponent(shopId) + "&image=" + encodeURIComponent(image) + "&name=" + encodeURIComponent(name) + "&price=" + encodeURIComponent(price) });
  },

  onTapHomeCategory(e) {
    const ds = e.currentTarget.dataset || {};
    const url = ds.url;
    if (!url) return;
    wx.navigateTo({ url });
  },

  onCategoryIconError(e) {
    const idx = e.currentTarget.dataset.index;
    const list = this.data.categoryList;
    if (idx == null || !list[idx]) return;
    const item = list[Number(idx)];
    if (item._iconFallbackUsed) {
      const updated = list.map((row, i) => (i === Number(idx) ? { ...row, iconOk: false } : row));
      this.setData({ categoryList: updated });
      return;
    }
    const fallback = item.iconFallback || HOME_CATEGORY_ICON_BY_KEY[item.groupKey] || '/img/index/menuicon1.png';
    const updated = list.map((row, i) => {
      if (i !== Number(idx)) return row;
      return { ...row, icon: fallback, _iconFallbackUsed: true, iconOk: true };
    });
    this.setData({ categoryList: updated });
  },
  async init() {
    const { id, userFlag, userMobile } = app.globalData.user || {};
    const communityId = getActiveCommunityId(app);
    // 假数据填充，方便本地预览首页布局；有接口时由 core/banners 覆盖
    let banner = [
      { id: 'local1', imageUrl: images.bannerHome, linkType: 'none', linkValue: '' },
      { id: 'local2', imageUrl: images.bannerSale, linkType: 'none', linkValue: '' }
    ];

    const mapHomeIcon = (rows) => rows.map((r) => ({
      ...r,
      icon: imgUrl(r.icon),
      iconFallback: r.iconFallback || HOME_CATEGORY_ICON_BY_KEY[r.groupKey] || '/img/index/menuicon1.png'
    }));
    // 与「直约服务商」卡片一致的暖灰底 + 橙色系点缀（无图标时 emoji 兜底仍保持同色系）
    // groupKey 与 tidy-service 页的 key 一致，用于本小区热卖数据推导「不可提供」
    let categoryList = mapHomeIcon([
      { groupKey: 'tidy', name: "整理收纳", icon: "/img/home_categories/tidy.png", emoji: "🗂", bgColor: "#fff4eb", url: "../tidy-service/tidy-service?key=tidy" },
      { groupKey: 'urgent_fix', name: "家修急事", icon: "/img/home_categories/urgent_fix.png", emoji: "🔧", bgColor: "#fff0e6", url: "../tidy-service/tidy-service?key=urgent_fix" },
      { groupKey: 'appliance_clean', name: "家电清洗", icon: "/img/home_categories/appliance_clean.png", emoji: "🫧", bgColor: "#fff7ed", url: "../tidy-service/tidy-service?key=appliance_clean" },
      { groupKey: 'pioneer_clean', name: "开荒保洁", icon: "/img/home_categories/pioneer_clean.png", emoji: "🧹", bgColor: "#ffedd5", url: "../tidy-service/tidy-service?key=pioneer_clean" },
      { groupKey: 'mite_remove', name: "除螨服务", icon: "/img/home_categories/mite_remove.png", emoji: "🌿", bgColor: "#fff5eb", url: "../tidy-service/tidy-service?key=mite_remove" },
      { groupKey: 'furniture_care', name: "家具养护", icon: "/img/home_categories/furniture_care.png", emoji: "🪑", bgColor: "#ffeee6", url: "../tidy-service/tidy-service?key=furniture_care" },
      { groupKey: 'baby_home', name: "宝宝家事", icon: "/img/home_categories/baby_home.png", emoji: "👶", bgColor: "#fff8f0", url: "../tidy-service/tidy-service?key=baby_home" },
      { groupKey: 'house_repair', name: "房屋修缮", icon: "/img/home_categories/house_repair.png", emoji: "🏠", bgColor: "#ffe8dc", url: "../tidy-service/tidy-service?key=house_repair" },
      { groupKey: 'beauty_home', name: "上门美业", icon: "/img/home_categories/beauty_home.png", emoji: "💄", bgColor: "#ffeadf", url: "../tidy-service/tidy-service?key=beauty_home" }
    ]);
    const quickActions = mapHomeIcon([
      { name: "直约服务商", icon: "/img/home_icons2/merchant_direct.png", emoji: "🏪", bgColor: "#fff0e0", url: "../service-provider-list/service-provider-list" },
      { name: "直约技工", icon: "/img/home_icons2/worker_direct.png", emoji: "🔨", bgColor: "#e8f5e0" },
      { name: "秒杀", icon: "/img/home_icons2/miaosha.png", emoji: "⚡", bgColor: "#fff5e0" },
      { name: "领券", icon: "/img/home_icons2/coupon.png", emoji: "🎫", bgColor: "#ffe0ee" },
      { name: "家事积分商城", icon: "/img/home_icons2/points.png", emoji: "🎯", bgColor: "#e0eeff" }
    ]);
    const knowledgeList = mapHomeIcon([
      { name: "代取", icon: "/img/home_icons2/pickup.png", emoji: "📦", bgColor: "#ede8ff", url: "../order-publish/order-publish?tab=邻里帮帮&category=代取" },
      { name: "接送小孩", icon: "/img/home_icons2/child_pickup.png", emoji: "🚗", bgColor: "#e0f3ff", url: "../order-publish/order-publish?tab=邻里帮帮&category=接送小孩" },
      { name: "陪诊", icon: "/img/home_icons2/escort.png", emoji: "🏥", bgColor: "#ffe0e0", url: "../order-publish/order-publish?tab=邻里帮帮&category=陪诊" },
      { name: "代扔垃圾", icon: "/img/home_icons2/trash_proxy.png", emoji: "♻️", bgColor: "#e4ffe0", url: "../order-publish/order-publish?tab=邻里帮帮&category=代扔垃圾" },
      { name: "宠物喂养", icon: "/img/home_icons2/pet_feed.png", emoji: "🐾", bgColor: "#fff5e0", url: "../order-publish/order-publish?tab=邻里帮帮&category=宠物喂养" }
    ]);

    // ===== 小区热卖榜：优先 core/community/hot，回退 core/services/hot =====
    const hotRankFallback = ['NO.1', 'NO.2', 'NO.3', 'NO.4', 'NO.5', '上新'];
    /** 热卖榜/直约服务商兜底：须为包内路径或本机 uploads，勿用 Unsplash（真机域名未白名单会全白） */
    const hotImageFallbackPool = [
      images.hotClean,
      images.hotWasher,
      images.hotHeater,
      images.hotHood,
      '/img/home_categories/tidy.png',
      '/img/home_categories/urgent_fix.png',
      '/img/home_categories/appliance_clean.png'
    ];
    const mapHotRows = (rows) => {
      if (!Array.isArray(rows) || rows.length === 0) return null;
      return rows.slice(0, 6).map((s, i) => {
        const rawTitle = s.title || s.name || '';
        const title = rawTitle.replace(/【.*?】/g, '').trim();
        const it = String(s.item_type || 'service').toLowerCase();
        const resolved = resolveServiceListImage(rawTitle, s.cover_image, null);
        const fallbackImage = imgUrl(hotImageFallbackPool[i % hotImageFallbackPool.length] || images.hotClean);
        return {
          id: s.id,
          itemType: it === 'shop' ? 'shop' : 'service',
          name: title || '热门项',
          price: String(s.price != null ? s.price : ''),
          image: resolved || fallbackImage,
          rank: s.rank != null && s.rank !== '' ? String(s.rank) : (hotRankFallback[i] || '热门')
        };
      });
    };
    let hotList = [
      { id: 73, itemType: 'service', name: '局部瓷砖铺贴', price: '229', image: listImageFromHome3('局部瓷砖铺贴【2小时】', images.svcTile), rank: 'NO.1' },
      { id: 74, itemType: 'service', name: '壁纸铺贴施工', price: '239', image: listImageFromHome3('壁纸铺贴施工【2小时】', images.svcWall), rank: 'NO.2' },
      { id: 75, itemType: 'service', name: '厨卫漏水防水修缮', price: '299', image: listImageFromHome3('厨卫漏水防水修缮【2小时】', images.svcWaterproof), rank: 'NO.3' },
      { id: 76, itemType: 'service', name: '地板铺贴修缮', price: '279', image: listImageFromHome3('地板铺贴修缮【2小时】', images.svcFloor), rank: 'NO.4' },
      { id: 77, itemType: 'service', name: '墙面刷新施工', price: '259', image: listImageFromHome3('墙面刷新施工【2小时】', images.svcWall), rank: 'NO.5' }
    ];
    let goods = [
      { id: 1, remarkC: images.hotClean, goodsTitle: '金牌日常保洁 (2小时)', goodsSub: '专业团队，含客厅、卧室、厨房、卫生间清洁', price: '99.00' },
      { id: 2, remarkC: images.svcAircon, goodsTitle: '挂壁式空调深度清洗', goodsSub: '高温蒸汽杀菌，拆洗过滤网、导风板，去除异味', price: '89.00' },
      { id: 3, remarkC: images.svcWasher, goodsTitle: '洗衣机深度清洗', goodsSub: '专业拆洗内桶，高温消毒除霉，恢复洁净如新', price: '128.00' },
      { id: 4, remarkC: images.svcHood, goodsTitle: '油烟机深度清洗', goodsSub: '专业拆洗油网、风轮，高温溶油去污', price: '158.00' }
    ];

    const hotFilters = ["保洁", "家电清洗", "安装维修", "搬家拉货"];
    const mapMerchantList = () => goods.map((item, i) => ({
      id: item.id,
      name: item.goodsTitle,
      sub: '服务' + item.id + '单',
      image: item.image || imgUrl(hotImageFallbackPool[i % hotImageFallbackPool.length] || images.hotClean),
      url: '../service/service?id=' + item.id
    }));
    let merchantList = [];
    let workerList = [];
    let marketList = [
      { id: 2001, name: "映萃美活研奇肌霜", price: "469", image: images.goodsSkincare1 },
      { id: 2002, name: "映萃美活肤洁颜粉", price: "235", image: images.goodsSkincare2 },
      { id: 2003, name: "当地特产一键速达", price: "99", image: images.goodsLocal }
    ];

    let thirdPartyMiniPrograms = this.data.thirdPartyMiniPrograms;
    // 打包/弱网/未配置 request 合法域名时，上面多个 await 会长时间卡住；先同步铺底再拉接口
    this.setData({
      banner,
      categoryList,
      quickActions,
      knowledgeList,
      hotList,
      hotFilters,
      merchantList,
      workerList,
      marketList,
      thirdPartyMiniPrograms
    });

    try {
      const hm = await api.core.getServiceHomeModules();
      const list = Array.isArray(hm) ? hm : (hm && hm.modules) || [];
      const rows = mapRawModulesToCategoryRows(list);
      if (rows.length > 0) {
        categoryList = mapHomeIcon(rows);
        this.setData({ categoryList });
      }
    } catch (eHm) {
      console.log('core/service-home-modules 不可用，使用本地九宫格', eHm);
    }

    try {
      const bRes = await util.get('core/banners', { scene: 'home' });
      const rows = unwrapList(bRes);
      if (rows.length > 0) {
        const mapped = rows.map((b, idx) => ({
          id: b.id != null ? b.id : `b${idx}`,
          imageUrl: imgUrl(b.image_url || b.imageUrl || ''),
          linkType: (b.link_type || b.linkType || 'none').toLowerCase(),
          linkValue: b.link_value || b.linkValue || ''
        })).filter((x) => !!x.imageUrl);
        if (mapped.length > 0) banner = mapped;
      }
    } catch (e) {
      console.log('core/banners 不可用，使用本地轮播', e);
    }

    try {
      const res = await api.miniProgram.getMiniPrograms();
      const programs = res.list || (res.data && res.data.list) || [];
      const mapped = programs
        .map((p) => ({
          name: p.name,
          icon: imgUrl(p.icon || p.icon_url || '/img/index/menuicon1.png'),
          appId: String(p.appId || p.app_id || '').trim(),
          path: p.path || ''
        }))
        .filter((p) => p.name && p.appId);
      thirdPartyMiniPrograms = mapped;
    } catch (e) {
      console.log('加载第三方小程序配置失败', e);
      thirdPartyMiniPrograms = [];
    }

    if (!config.useCuratedHomeHotList) {
      let mappedHot = null;
      try {
        const q = { limit: 80 };
        if (communityId != null && communityId !== '') q.community_id = communityId;
        const commRes = await util.get('core/community/hot', q);
        const services = commRes && (commRes.services || commRes.service_list);
        if (Array.isArray(services) && services.length > 0) {
          mappedHot = mapHotRows(services);
        } else {
          const flat = unwrapList(commRes);
          if (flat.length > 0) {
            mappedHot = mapHotRows(flat);
          }
        }
      } catch (e) {
        console.log('core/community/hot 不可用', e);
      }
      if (!mappedHot) {
        try {
          const hotQ = { limit: 80 };
          if (communityId != null && communityId !== '') hotQ.community_id = communityId;
          const hotRes = await util.get('core/services/hot', hotQ);
          const hotData = unwrapList(hotRes);
          if (hotData.length > 0) {
            mappedHot = mapHotRows(hotData);
          }
        } catch (e2) {
          console.log('core/services/hot 不可用', e2);
        }
      }
      if (mappedHot) hotList = mappedHot;
    }

    this.setData({
      banner,
      thirdPartyMiniPrograms,
      hotList
    });

    // ===== 从数据库获取服务商品（直约服务商）=====
    try {
      const svcRes = await util.get('core/services/hot', { limit: 10 });
      const svcData = unwrapList(svcRes);
      if (svcData.length > 0) {
        goods = svcData.slice(0, 4).map((s, i) => ({
          id: s.id,
          image: resolveServiceListImage(s.title || '', s.cover_image, null)
            || imgUrl(hotImageFallbackPool[i % hotImageFallbackPool.length] || images.hotClean),
          goodsTitle: (s.title || '').replace(/【.*?】/g, '').trim(),
          goodsSub: s.description || '',
          price: String(Number(s.price).toFixed(2))
        }));
      }
    } catch (e) { }
    // ===== 直约技工（按小区，与 classify 页一致）=====
    try {
      const wData = await fetchWorkerRows(communityId, { page: 1, limit: 50 });
      workerList = wData.slice(0, 8).map(mapWorkerForHomeCard);
    } catch (e) {
      console.log('[index] core/workers 请求失败', e);
      workerList = [];
    }

    // ===== 从数据库获取管家精选商品（建议按小区配置，传 community_id）=====
    try {
      const featuredQ = {};
      if (communityId != null && communityId !== '') featuredQ.community_id = communityId;
      const mRes = await util.get('core/goods/featured', featuredQ);
      const mData = unwrapList(mRes);
      if (Array.isArray(mData) && mData.length > 0) {
        marketList = mData.slice(0, 6).map(g => ({
          id: g.id,
          name: g.goodsTitle || g.title || g.name || '精选商品',
          price: String(g.goodsRealPrice || g.price || ''),
          image: g.mainPicture || g.cover_image || g.image ? imgUrl(g.mainPicture || g.cover_image || g.image) : ''
        }));
      }
    } catch (e) { }
    // ======================================
    // 本地商城：仅展示真实商品（无兜底商品）
    // ======================================

    // 模块一：顶级海报轮播图
    const pushHeroBanners = [
      { 
        id: 1, 
        image: images.bannerHome, 
        title: '品牌好物', 
        sub: '严选之品，生活之味',
        url: '/package-push/pages/push-channel/push-channel?title=品牌好物' 
      },
      { 
        id: 2, 
        image: images.bannerSale, 
        title: '秋冬好物', 
        sub: '温暖一冬，质感生活',
        url: '/package-push/pages/push-channel/push-channel?title=秋冬好物' 
      }
    ];

    // 模块二：分类金刚
    const pushCategories = mapHomeIcon([
      { name: "爆款专区", icon: images.pushCateFire, url: "/package-push/pages/push-goods-list/push-goods-list?id=1" },
      { name: "礼物专区", icon: images.pushCateGift, url: "/package-push/pages/push-goods-list/push-goods-list?id=2" },
      { name: "本地商城甄选", icon: images.pushCateStar, url: "/package-push/pages/push-goods-list/push-goods-list?id=3" },
      { name: "高佣专区", icon: images.pushCateMoney, url: "/package-push/pages/push-goods-list/push-goods-list?id=4" }
    ]);

    // 模块三：导购窗
    const pushPromoCards = {
      left: { title: "品牌好货", image: images.goodsSkincare1 },
      right: { title: "秋冬好物", image: images.pushFashion1 }
    };

    let pushDailyNews = [];
    let pushTopSales = [];
    let pushPeriodicTabs = [];
    let activePeriodicTabIndex = 0;
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
      activePeriodicTabIndex = moduleGoods.activePeriodicTabIndex || 0;
      pushFeedTabs = moduleGoods.pushFeedTabs;
      pushFeedGoodsDict = moduleGoods.pushFeedGoodsDict;
      pushFeedGoods = moduleGoods.pushFeedGoods;
      activeFeedTab = moduleGoods.activeFeedTab;
      feedPageByTab = moduleGoods.feedPageByTab;
      feedHasMoreByTab = moduleGoods.feedHasMoreByTab;
    } catch (e) {
      console.log("本地商城模块真实商品加载失败", e);
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
      { title: "精选生活好物", price: "9.9专区", image: images.goodsSkincare2 }
    ];
    const fukaFilterTabs = ["精选", "拼多多", "京东"];
    const fukaGoods = [
      { id: 3001, name: "正宗大凉山核桃", price: "36.8", image: images.pushFood1 },
      { id: 3002, name: "近视眼镜", price: "79.9", image: images.pushDaily2 },
      { id: 3003, name: "冻干草莓", price: "39.9", image: images.pushFood2 },
      { id: 3004, name: "黄冰糖", price: "29.9", image: images.pushFood1 }
    ];
    const marketTopCats = mapHomeIcon([
      { name: "食品生鲜", code: "AAAA", icon: "/img/market_icons/food.png" },
      { name: "美妆洗护", code: "AAAB", icon: "/img/market_icons/star.png" },
      { name: "居家百货", code: "AAAC", icon: "/img/market_icons/supermarket.png" },
      { name: "服装箱包", code: "AAAD", icon: "/img/market_icons/clothes.png" },
      { name: "母婴系列", code: "AAAE", icon: "/img/market_icons/baby.png" },
      { name: "家用电器", code: "AAAF", icon: "/img/market_icons/home.png" },
      { name: "数码产品", code: "AAAG", icon: "/img/market_icons/tech.png" },
      { name: "珠宝饰品", code: "AAAH", icon: "/img/market_icons/money.png" },
      { name: "旅游出行", code: "AAAI", icon: "/img/market_icons/fun.png" },
      { name: "传统工艺", code: "AAAJ", icon: "/img/market_icons/gift.png" }
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
        const mapped = marketData.map(indexHelper.normalizeMarketShop).filter(s => !!s.id);
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

    let jdHero = pickHeroFromApi('jd', null, imgUrl);
    let pddHero = pickHeroFromApi('pdd', null, imgUrl);
    let jdBanner = jdHero.banner;
    let pddBanner = pddHero.banner;
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
    let benefitBrandList = defaultBenefitChainBrandList(imgUrl);
    const pickAllianceList = (res) => {
      if (Array.isArray(res)) return res;
      if (res && res.data && Array.isArray(res.data.list)) return res.data.list;
      if (res && Array.isArray(res.list)) return res.list;
      return [];
    };

    const preferLocalAlliance = config.benefitAlliancePreferLocal !== false;
    let useLocalJd = false;
    let useLocalPdd = false;
    if (preferLocalAlliance) {
      try {
        const L = getLocalBenefitCardPayload();
        if (L.jdGoods && L.jdGoods.length > 0) {
          jdGoods = L.jdGoods.map((x) => ({
            ...x,
            image: x.image ? imgUrl(x.image) : ''
          }));
          jdEntry = L.jdEntry;
          jdHeroTitle = L.jdHeroTitle || jdHero.title;
          jdHeroSubtitle = L.jdHeroSubtitle || jdHero.subtitle;
          jdBanner = getThemeBannerPath('jd', imgUrl) || jdBanner;
          useLocalJd = true;
        }
        if (L.pddGoods && L.pddGoods.length > 0) {
          pddGoods = L.pddGoods.map((x) => ({
            ...x,
            image: x.image ? imgUrl(x.image) : ''
          }));
          pddEntry = L.pddEntry;
          pddHeroTitle = L.pddHeroTitle || pddHero.title;
          pddHeroSubtitle = L.pddHeroSubtitle || pddHero.subtitle;
          pddBanner = getThemeBannerPath('pdd', imgUrl) || pddBanner;
          useLocalPdd = true;
        }
      } catch (e) {
        console.warn('[惠民卡] 流量联盟本地数据失败', e && (e.errmsg || e.message || e));
      }
    }

    if (!useLocalJd || !useLocalPdd) {
      try {
        const disp = await util.get('benefit-alliance/display', { scene: 'benefit_card' });
        if (!useLocalJd && disp && disp.jd) {
          jdHero = pickHeroFromApi('jd', disp.jd, imgUrl);
          jdBanner = jdHero.banner;
          jdHeroTitle = disp.jd.title || jdHero.title;
          jdHeroSubtitle = disp.jd.subtitle || jdHero.subtitle;
        }
        if (!useLocalPdd && disp && disp.pdd) {
          pddHero = pickHeroFromApi('pdd', disp.pdd, imgUrl);
          pddBanner = pddHero.banner;
          pddHeroTitle = disp.pdd.title || pddHero.title;
          pddHeroSubtitle = disp.pdd.subtitle || pddHero.subtitle;
        }
      } catch (e) {
        console.warn('[惠民卡] benefit-alliance/display 失败', e && (e.errmsg || e.message || e));
      }
    }
    if (!useLocalJd) {
      try {
        const res = await util.get('benefit-alliance/goods', { platform: 'jd', scene: 'benefit_card', limit: 8 });
        const list = pickAllianceList(res);
        if (list.length > 0) {
          jdGoods = list.map((x) => ({
            id: x.id || 0,
            skuId: String(x.skuId || x.sku_id || ''),
            title: x.title || '',
            image: x.image ? imgUrl(x.image) : imgUrl(images.pushFood1),
            price: x.price != null && x.price !== '' ? String(x.price) : '',
            rebateAmount: x.rebateAmount || x.rebate_amount || '',
            spreadUrl: x.spreadUrl || x.spread_url || ''
          })).filter((x) => !!x.skuId);
          if (jdGoods.length > 0) {
            jdEntry = { skuId: jdGoods[0].skuId, spreadUrl: jdGoods[0].spreadUrl };
          }
        }
      } catch (e) {
        console.warn('[惠民卡] benefit-alliance/goods?platform=jd 失败', e && (e.errmsg || e.message || e));
      }
    }
    if (!useLocalPdd) {
      try {
        const res = await util.get('benefit-alliance/goods', { platform: 'pdd', scene: 'benefit_card', limit: 8 });
        const list = pickAllianceList(res);
        if (list.length > 0) {
          pddGoods = list.map((x) => ({
            id: x.id || 0,
            goodsId: String(x.goodsId || x.goods_id || ''),
            title: x.title || '',
            image: x.image ? imgUrl(x.image) : imgUrl(images.pushFood1),
            price: String(x.price || ''),
            couponPrice: String(x.couponPrice || x.coupon_price || ''),
            rebateAmount: x.rebateAmount || x.rebate_amount || '',
            spreadUrl: x.spreadUrl || x.spread_url || '',
            miniPath: x.miniPath || x.mini_path || ''
          })).filter((x) => !!(x.goodsId || x.spreadUrl));
        }
      } catch (e) {
        console.warn('[惠民卡] benefit-alliance/goods?platform=pdd 失败', e && (e.errmsg || e.message || e));
      }
    }
    if (Array.isArray(pddGoods) && pddGoods.length > 0) {
      const first = pddGoods[0];
      pddEntry = {
        spreadUrl: first.spreadUrl || pddEntry.spreadUrl,
        miniPath: first.miniPath || '',
        goodsId: first.goodsId || ''
      };
    }

    // ===== 加载美团 / 淘宝 / 闪购 / 社群 / 推销 数据 =====
    let mtGoods = [], tbGoods = [], sgGoods = [], sqGoods = [], txGoods = [];
    let mtHero = pickHeroFromApi('meituan', null, imgUrl);
    let tbHero = pickHeroFromApi('taobao', null, imgUrl);
    let sgHero = pickHeroFromApi('shangou', null, imgUrl);
    let sqHero = pickHeroFromApi('shequn', null, imgUrl);
    let txHero = pickHeroFromApi('tuixiao', null, imgUrl);
    let mtBanner = mtHero.banner;
    let tbBanner = tbHero.banner;
    let sgBanner = sgHero.banner;
    let sqBanner = sqHero.banner;
    let txBanner = txHero.banner;
    let mtHeroTitle = '', mtHeroSubtitle = '';
    let tbHeroTitle = '', tbHeroSubtitle = '';
    let sgHeroTitle = '', sgHeroSubtitle = '';
    let sqHeroTitle = '', sqHeroSubtitle = '';
    let txHeroTitle = '', txHeroSubtitle = '';

    try {
      const disp5 = await util.get('benefit-alliance/display', { scene: 'benefit_card' });
      if (disp5 && disp5.meituan) {
        mtHero = pickHeroFromApi('meituan', disp5.meituan, imgUrl);
        mtBanner = mtHero.banner;
        mtHeroTitle = disp5.meituan.title || mtHero.title;
        mtHeroSubtitle = disp5.meituan.subtitle || mtHero.subtitle;
      }
      if (disp5 && disp5.taobao) {
        tbHero = pickHeroFromApi('taobao', disp5.taobao, imgUrl);
        tbBanner = tbHero.banner;
        tbHeroTitle = disp5.taobao.title || tbHero.title;
        tbHeroSubtitle = disp5.taobao.subtitle || tbHero.subtitle;
      }
      if (disp5 && disp5.shangou) {
        sgHero = pickHeroFromApi('shangou', disp5.shangou, imgUrl);
        sgBanner = sgHero.banner;
        sgHeroTitle = disp5.shangou.title || sgHero.title;
        sgHeroSubtitle = disp5.shangou.subtitle || sgHero.subtitle;
      }
      if (disp5 && disp5.shequn) {
        sqHero = pickHeroFromApi('shequn', disp5.shequn, imgUrl);
        sqBanner = sqHero.banner;
        sqHeroTitle = disp5.shequn.title || sqHero.title;
        sqHeroSubtitle = disp5.shequn.subtitle || sqHero.subtitle;
      }
      if (disp5 && disp5.tuixiao) {
        txHero = pickHeroFromApi('tuixiao', disp5.tuixiao, imgUrl);
        txBanner = txHero.banner;
        txHeroTitle = disp5.tuixiao.title || txHero.title;
        txHeroSubtitle = disp5.tuixiao.subtitle || txHero.subtitle;
      }
      if (Array.isArray(disp5.chainBrands) && disp5.chainBrands.length > 0) {
        benefitBrandList = disp5.chainBrands.map((b) => mapChainBrandToAllianceSection(b, imgUrl));
      }
    } catch (e) {
      console.warn('[惠民卡] benefit-alliance/display(5platform) 失败', e && (e.errmsg || e.message || e));
    }

    const mapAllianceItem = (x) => ({
      id: x.id || 0,
      title: x.title || '',
      subtitle: x.subtitle || '',
      image: x.image ? imgUrl(x.image) : '',
      price: x.price != null && x.price !== '' ? String(x.price) : '',
      couponPrice: x.couponPrice || x.coupon_price || '',
      rebateAmount: x.rebateAmount || x.rebate_amount || '',
      spreadUrl: x.spreadUrl || x.spread_url || ''
    });

    try {
      const mtRes = await util.get('benefit-alliance/goods', { platform: 'meituan', scene: 'benefit_card', limit: 8 });
      mtGoods = pickAllianceList(mtRes).map(mapAllianceItem);
    } catch (e) { console.warn('[惠民卡] meituan 加载失败', e); }

    try {
      const tbRes = await util.get('benefit-alliance/goods', { platform: 'taobao', scene: 'benefit_card', limit: 8 });
      tbGoods = pickAllianceList(tbRes).map(mapAllianceItem);
    } catch (e) { console.warn('[惠民卡] taobao 加载失败', e); }

    try {
      const sgRes = await util.get('benefit-alliance/goods', { platform: 'shangou', scene: 'benefit_card', limit: 8 });
      sgGoods = pickAllianceList(sgRes).map(mapAllianceItem);
    } catch (e) { console.warn('[惠民卡] shangou 加载失败', e); }

    try {
      const sqRes = await util.get('benefit-alliance/goods', { platform: 'shequn', scene: 'benefit_card', limit: 8 });
      sqGoods = pickAllianceList(sqRes).map(mapAllianceItem);
    } catch (e) { console.warn('[惠民卡] shequn 加载失败', e); }

    try {
      const txRes = await util.get('benefit-alliance/goods', { platform: 'tuixiao', scene: 'benefit_card', limit: 8 });
      txGoods = pickAllianceList(txRes).map(mapAllianceItem);
    } catch (e) { console.warn('[惠民卡] tuixiao 加载失败', e); }

    try {
      const plist = await fetchServiceProviderRows(communityId, { limit: 8 });
      merchantList = plist.slice(0, 8).map((p) => mapServiceProviderForHomeCard(p, imgUrl));
    } catch (eSp) {
      console.log('core/service-providers 不可用', eSp);
      merchantList = [];
    }

    let assistMarqueeList = [];
    try {
      const feedRes = await util.get('neighbor-assist/orders/my', { role: 'publisher', page: 1, limit: 10 });
      const list = Array.isArray(feedRes)
        ? feedRes
        : (feedRes.list || (feedRes.data && feedRes.data.list) || []);
      assistMarqueeList = list.slice(0, 10).map((x, i) => {
        const fullText = String(x.content || x.title || x.remark || x.assist_type_label || '').slice(0, 40);
        return {
          id: x.id != null ? x.id : `f${i}`,
          text: fullText,
          assist_type: x.assist_type,
          assist_type_label: x.assist_type_label,
          amount: x.amount || x.reward_amount || '',
          status: x.status,
          status_text: x.status_text,
          time: x.created_at
        };
      }).filter((x) => x.text);
    } catch (eFeed) {
      assistMarqueeList = [
        { id: 999001, text: '代取快递：菜鸟驿站 → 3 栋', assist_type_label: '代取快递' },
        { id: 999002, text: '老人陪诊：市医院上午', assist_type_label: '陪诊' },
        { id: 999003, text: '临时遛狗 30 分钟', assist_type_label: '宠物喂养' },
        { id: 999004, text: '帮拿快递：西门 → 5 栋', assist_type_label: '代取快递' },
        { id: 999005, text: '宠物临时喂养 1 小时', assist_type_label: '宠物喂养' }
      ];
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
      activePeriodicTabIndex,
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
      mtGoods,
      mtBanner,
      mtHeroTitle,
      mtHeroSubtitle,
      tbGoods,
      tbBanner,
      tbHeroTitle,
      tbHeroSubtitle,
      sgGoods,
      sgBanner,
      sgHeroTitle,
      sgHeroSubtitle,
      sqGoods,
      sqBanner,
      sqHeroTitle,
      sqHeroSubtitle,
      txGoods,
      txBanner,
      txHeroTitle,
      txHeroSubtitle,
      benefitBrandList,
      assistMarqueeList,
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
          const { name } = util.stateTabel(v.orderState, userFlag),
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
  onBenefitBrandTap(e) {
    const ds = (e && e.currentTarget && e.currentTarget.dataset) || {};
    const appId = ds.miniappid != null ? String(ds.miniappid).trim() : (ds.miniAppId != null ? String(ds.miniAppId).trim() : '');
    let miniPath = ds.minipath != null ? String(ds.minipath).trim() : (ds.miniPath != null ? String(ds.miniPath).trim() : '');
    if (appId && miniPath) {
      if (!miniPath.startsWith('/')) miniPath = `/${miniPath}`;
      wx.navigateToMiniProgram({
        appId,
        path: miniPath,
        envVersion: 'release',
        fail: (err) => {
          console.warn('[惠民卡] 大牌连锁跳转失败', err);
          wx.showToast({ title: '跳转失败，已改复制关键词', icon: 'none' });
          this.copyBrandKeyword(e);
        }
      });
      return;
    }
    this.copyBrandKeyword(e);
  },
  copyBrandKeyword(e) {
    const kw = e.currentTarget.dataset.keyword ? String(e.currentTarget.dataset.keyword).trim() : '';
    if (!kw) return;
    wx.setClipboardData({
      data: kw,
      success: () => wx.showToast({ title: '已复制「' + kw + '」', icon: 'none' })
    });
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
  handleCopyBenefitLink(e) {
    const url = e.currentTarget.dataset.url;
    this.copyBenefitLink(url, '推广链接已复制');
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

    // 仅含 H5 推广链（流量联盟本地清单）：不请求进宝接口，直接复制链接
    if (spreadUrl && String(spreadUrl).trim() && !goodsId) {
      this.copyBenefitLink(String(spreadUrl).trim(), '推广链接已复制，可在浏览器打开');
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
    // 流量联盟本地清单已带 u.jd.com 短链时直跳，减少无效请求
    if (config.benefitAlliancePreferLocal !== false && fallbackSpreadUrl) {
      openBySpreadUrl(fallbackSpreadUrl);
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
    if (this.data.activeTab !== '本地商城') return;
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
  async loadLocalGoodsModules() {
    await this.ensureMarketUserCoordsForList();
    const res = await util.get('local-goods-home/modules', indexHelper.buildLocalGoodsQuery());
    const payload = indexHelper.unwrapLocalGoodsPayload(res);

    const rawDaily = payload.daily_news || payload.dailyNews || [];
    const rawTop = payload.top_sales || payload.topSales || [];
    const rawPeriodic = payload.periodic_modules || payload.periodic || [];
    const rawFeed = payload.feed_modules || payload.feed || [];

    const pushDailyNews = indexHelper.normalizeModuleList(rawDaily, { module: 'daily_news' }).slice(0, 4);
    const pushTopSales = indexHelper.normalizeModuleList(rawTop, { module: 'top_sales' }).slice(0, 3);

    const pushPeriodicTabs = [];
    const pushPeriodicGoodsDict = {};
    indexHelper.normalizeModuleGroups(rawPeriodic).forEach((m, idx) => {
      const tab = m.module_name || m.name || m.title || `周期模块${idx + 1}`;
      const list = indexHelper.normalizeModuleList(indexHelper.pickModuleGoodsList(m), { module: tab });
      pushPeriodicTabs.push(tab);
      pushPeriodicGoodsDict[tab] = list;
    });
    const activePeriodicTab = pushPeriodicTabs.find((tab) => (pushPeriodicGoodsDict[tab] || []).length > 0) || pushPeriodicTabs[0] || "";
    const activePeriodicTabIndex = activePeriodicTab ? Math.max(pushPeriodicTabs.indexOf(activePeriodicTab), 0) : 0;
    const pushPeriodicGoods = activePeriodicTab ? (pushPeriodicGoodsDict[activePeriodicTab] || []) : [];

    const pushFeedTabs = [];
    const pushFeedGoodsDict = {};
    const feedPageByTab = {};
    const feedHasMoreByTab = {};
    indexHelper.normalizeModuleGroups(rawFeed).forEach((m) => {
      const tab = m.module_name || m.name || m.title;
      if (!tab) return;
      const list = indexHelper.normalizeModuleList(indexHelper.pickModuleGoodsList(m), { module: tab });
      pushFeedTabs.push(tab);
      pushFeedGoodsDict[tab] = list;
      feedPageByTab[tab] = Number(m.page || 1);
      feedHasMoreByTab[tab] = !!m.has_more;
    });
    const activeFeedTab = pushFeedTabs.find((tab) => (pushFeedGoodsDict[tab] || []).length > 0) || pushFeedTabs[0] || "";
    const pushFeedGoods = activeFeedTab ? [...(pushFeedGoodsDict[activeFeedTab] || [])] : [];

    console.log('local-goods-home/modules parsed', {
      daily: pushDailyNews.length,
      top: pushTopSales.length,
      periodicTabs: pushPeriodicTabs,
      periodicCounts: pushPeriodicTabs.map((tab) => (pushPeriodicGoodsDict[tab] || []).length),
      feedTabs: pushFeedTabs,
      feedCounts: pushFeedTabs.map((tab) => (pushFeedGoodsDict[tab] || []).length)
    });

    return {
      pushDailyNews,
      pushTopSales,
      pushPeriodicTabs,
      pushPeriodicGoodsDict,
      pushPeriodicGoods,
      activePeriodicTabIndex,
      pushFeedTabs,
      pushFeedGoodsDict,
      pushFeedGoods,
      activeFeedTab,
      feedPageByTab,
      feedHasMoreByTab
    };
  },
  async refreshLocalGoodsModulesForLocation() {
    try {
      const moduleGoods = await this.loadLocalGoodsModules();
      this.setData({
        pushDailyNews: moduleGoods.pushDailyNews,
        pushTopSales: moduleGoods.pushTopSales,
        pushPeriodicTabs: moduleGoods.pushPeriodicTabs,
        pushPeriodicGoodsDict: moduleGoods.pushPeriodicGoodsDict,
        pushPeriodicGoods: moduleGoods.pushPeriodicGoods,
        activePeriodicTabIndex: moduleGoods.activePeriodicTabIndex,
        pushFeedTabs: moduleGoods.pushFeedTabs,
        pushFeedGoodsDict: moduleGoods.pushFeedGoodsDict,
        pushFeedGoods: moduleGoods.pushFeedGoods,
        activeFeedTab: moduleGoods.activeFeedTab,
        feedPageByTab: moduleGoods.feedPageByTab,
        feedHasMoreByTab: moduleGoods.feedHasMoreByTab,
        isLoadingMore: false
      });
    } catch (e) {
      console.log('local-goods-home/modules refresh after location failed', e);
    }
  },
  async loadMoreFeedGoods(tabName) {
    const currentPage = Number((this.data.feedPageByTab || {})[tabName] || 1);
    const nextPage = currentPage + 1;
    const q = indexHelper.buildLocalGoodsQuery({
      module_name: tabName,
      page: nextPage,
      page_size: this.data.pageSize || 10
    });
    const res = await util.get('local-goods-home/feed-products', q);
    const payload = res && typeof res === 'object' ? (res.data || res) : {};
    const list = indexHelper.normalizeModuleList(payload.list || payload.items || payload.goods_list || [], { module: tabName });
    const hasMore = !!payload.has_more;
    return { list, hasMore, page: nextPage };
  },
  goActivity(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/package-customer/pages/activity/activity?id=' + id,
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
