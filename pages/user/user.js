// pages/user/user.js
const app = getApp();
const util = require('../../utils/util.js');
const rolePortals = require('../../utils/rolePortals.js');
const api = require('../../api/index.js');
const balance = require('../../utils/balance.js');
const localPrefs = require('../../utils/localPrefs.js');
const browseFootprint = require('../../utils/browseFootprint.js');
const userSession = require('../../utils/userSession.js');
const favoritesStore = require('../../utils/favoritesStore.js');
const serviceFavStore = require('../../utils/serviceFavStore.js');

Page({
  data: {
    navTop: 44,
    user: {},
    loggedIn: false,
    roleLabel: '普通用户',
    couponCount: 0,
    footprintCount: 0,
    favoriteCount: 0,
    workbenchCollapsed: true,
    orderMenus: [
      { name: "服务订单", icon: "service_order", url: "../market-order-list/market-order-list?type=service" },
      { name: "一键发布", icon: "quick_publish", url: "../order-publish/order-publish" },
      { name: "购物订单", icon: "market_order", url: "../market-order-list/market-order-list" },
      { name: "帮帮订单", icon: "combo_package", url: "../neighbor-assist-orders-my/neighbor-assist-orders-my" },
      { name: "惠民卡订单", icon: "benefit_card_order", url: "../benefit-orders/benefit-orders" },
      { name: "推客订单", icon: "promoter_order", url: "../promoter-orders/promoter-orders" },
      { name: "合伙人中心", icon: "promoter_order", url: "/package-commission/pages/commission-overview/commission-overview" }
    ],
    communityMenus: [
      { name: "我的帖子", icon: "my_posts", url: "../my-posts/my-posts?type=myposts&title=我的帖子" },
      { name: "我的关注", icon: "my_follows", url: "../my-follows/my-follows" },
      { name: "我的点赞", icon: "my_likes", url: "../my-posts/my-posts?type=mylikes&title=我的点赞" },
      { name: "参与话题", icon: "joined_topics", url: "../my-posts/my-posts?type=participated&category=热门话题&title=参与话题" },
      { name: "参与活动", icon: "joined_activities", url: "../my-activities/my-activities" },
      { name: "活动管理", icon: "activity_management", url: "../activity-manage/activity-manage" },
      { name: "诉求列表", icon: "appeal_list", url: "../appeal-list/appeal-list" }
    ],
    joinMenus: [
      { name: "技工入驻", sub: "用技能闲置赚钱", icon: "worker_join", url: "../join-worker/join-worker" },
      { name: "集市商家", sub: "附近商家入驻申请", icon: "market_merchant", url: "../join-market/join-market" },
      { name: "服务商入驻", sub: "提供专业到家服务", icon: "service_provider", url: "../join-service/join-service" },
      { name: "小区管家入驻", sub: "社区便民服务管家", icon: "community_manager", iconDir: "other_services", tap: "steward" }
    ],
    serviceMenus: [
      { name: "帮助反馈", icon: "help_feedback", url: "../feedback/feedback" },
      { name: "小区管家", icon: "community_manager", tap: "steward_menu" },
      { name: "关于我们", icon: "about_us", url: "../about/about" },
      { name: "地址管理", icon: "address_management", url: "../address/address" },
      { name: "平台客服", icon: "platform_service", url: "/package-account/pages/platform-kefu/platform-kefu" },
      { name: "设置", icon: "settings", url: "../settings/settings" }
    ]
  },

  scanInviterCode() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.scanCode({
      onlyFromCamera: false,
      success: async (res) => {
        if (!res.result) return;
        wx.showLoading({ title: '绑定中...' });
        try {
          await api.user.bindInviter(res.result.trim());
          wx.hideLoading();
          wx.showToast({ title: '绑定成功', icon: 'success' });
          // 刷新用户信息
          this.onShow();
        } catch (e) {
          wx.hideLoading();
          const msg = (e && e.msg) || (e && e.errmsg) || '绑定失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '扫码取消', icon: 'none' });
      }
    });
  },

  showToastWait() {
    wx.showToast({ title: '敬请期待', icon: 'none' });
  },

  computeRoleLabel(user) {
    const roleMap = { admin: '管理员', promoter: '推客', district_partner: '区县合伙人', market_partner: '市场合伙人', user: '普通用户', worker: '技工', merchant: '服务商' };
    const roles = rolePortals.normalizeRoles(user);
    if (roles.length <= 1) return roleMap[roles[0]] || '普通用户';
    return roles.map((r) => roleMap[r] || r).join('·');
  },

  toggleWorkbench() {
    this.setData({ workbenchCollapsed: !this.data.workbenchCollapsed });
  },

  async loadCommissionBalance() {
    try {
      const res = await api.promoter.getCommission();
      const data = res.data || res;
      const available = Number(data.available_amount || data.availAcount || 0);
      this.setData({ balance: available.toFixed(2) });
    } catch (e) {
      // keep existing balance
    }
  },

  async _refreshUserFromProfile() {
    try {
      const data = await api.user.getUserProfile();
      if (app.globalData.user) {
        app.globalData.user = rolePortals.mergePortalFlags(app.globalData.user, data);
        const sid = data.id != null ? String(data.id) : null;
        if (sid != null) app.globalData.user.id = sid;
      }
    } catch (e) {
      console.log('刷新用户信息失败，使用缓存', e);
    }
    return app.globalData.user || {};
  },

  _navigateByStewardStatus(user, options) {
    const opts = options || {};
    if (rolePortals.canUseStewardPortal(user)) {
      if (opts.approvedUrl) {
        wx.navigateTo({ url: opts.approvedUrl });
      } else {
        rolePortals.navigateToStewardHome();
      }
      return;
    }
    const st = user.steward_status != null ? user.steward_status : user.stewardStatus;
    if (st === 'pending' || st === 'reviewing') {
      wx.showToast({ title: '管家入驻审核中', icon: 'none' });
    } else if (st === 'rejected') {
      wx.showModal({
        title: '入驻未通过',
        content: '您的管家入驻申请已被驳回，可修改资料后重新提交',
        confirmText: '重新申请',
        success: (r) => {
          if (r.confirm) wx.navigateTo({ url: '../join-steward/join-steward' });
        }
      });
    } else {
      wx.navigateTo({ url: '../join-steward/join-steward' });
    }
  },

  _ensureLoginForSteward() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '../login/login' }), 500);
      return false;
    }
    return true;
  },

  goStewardJoin() {
    if (!this._ensureLoginForSteward()) return;
    this.goStewardPortal();
  },

  /** 其他服务 · 小区管家：非管家身份 → 入驻申请；已入驻 → 管家服务页 */
  async goStewardMenu() {
    if (!this._ensureLoginForSteward()) return;
    wx.showLoading({ title: '加载中', mask: true });
    const user = await this._refreshUserFromProfile();
    wx.hideLoading();
    this._navigateByStewardStatus(user, { approvedUrl: '../community-steward/community-steward' });
  },

  async goStewardPortal() {
    wx.showLoading({ title: '加载中', mask: true });
    const user = await this._refreshUserFromProfile();
    wx.hideLoading();
    this._navigateByStewardStatus(user);
  },

  async goWorkerPortal() {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const data = await api.user.getUserProfile();
      if (app.globalData.user) {
        app.globalData.user = rolePortals.mergePortalFlags(app.globalData.user, data);
        const sid = data.id != null ? String(data.id) : null;
        if (sid != null) app.globalData.user.id = sid;
      }
    } catch (e) {
      console.log('刷新用户信息失败，使用缓存', e);
    }
    wx.hideLoading();

    const user = app.globalData.user || {};
    if (rolePortals.canUseWorkerPortal(user)) {
      rolePortals.navigateToWorkerHome();
    } else {
      const st = user.worker_status != null ? user.worker_status : user.workerStatus;
      if (st === 'pending' || st === 'reviewing') {
        wx.showToast({ title: '技工入驻审核中', icon: 'none' });
      } else {
        wx.navigateTo({ url: '../join-worker/join-worker' });
      }
    }
  },

  async goServiceProviderPortal() {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const data = await api.user.getUserProfile();
      if (app.globalData.user) {
        app.globalData.user = rolePortals.mergePortalFlags(app.globalData.user, data);
        const sid = data.id != null ? String(data.id) : null;
        if (sid != null) app.globalData.user.id = sid;
      }
    } catch (e) {
      console.log('刷新用户信息失败，使用缓存', e);
    }
    wx.hideLoading();

    const user = app.globalData.user || {};
    if (rolePortals.canUseServiceProviderPortal(user)) {
      rolePortals.navigateToServiceProviderHome();
    } else {
      const st = user.service_provider_status != null ? user.service_provider_status : user.serviceProviderStatus;
      if (st === 'pending' || st === 'reviewing') {
        wx.showToast({ title: '服务商入驻审核中', icon: 'none' });
      } else {
        wx.navigateTo({ url: '../join-service/join-service' });
      }
    }
  },

  async goMarketPortal() {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const data = await api.user.getUserProfile();
      if (app.globalData.user) {
        app.globalData.user = rolePortals.mergePortalFlags(app.globalData.user, data);
        const sid = data.id != null ? String(data.id) : null;
        if (sid != null) app.globalData.user.id = sid;
        const st = data.merchant_status != null ? data.merchant_status : data.merchantStatus;
        if (st != null) app.globalData.user.merchant_status = st;
      }
    } catch (e) {
      console.log('刷新用户信息失败，使用缓存', e);
    }
    wx.hideLoading();

    const user = app.globalData.user || {};
    if (rolePortals.canUseMarketPortal(user)) {
      rolePortals.navigateToMarketHome();
    } else {
      const mStatus = user.merchant_status != null ? user.merchant_status : user.merchantStatus;
      if (mStatus === 'pending' || mStatus === 'reviewing') {
        wx.showToast({ title: '集市商家入驻审核中', icon: 'none' });
      } else {
        wx.navigateTo({ url: '../join-market/join-market' });
      }
    }
  },

  goToLogin() {
    if (!this.data.loggedIn) {
      wx.navigateTo({ url: '../login/login' });
    }
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTop: (sys.statusBarHeight || 20) + 10 });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
    const loggedIn = !!wx.getStorageSync('token');
    const cached = loggedIn ? (app.globalData.user || {}) : {};
    const user = loggedIn ? Object.assign({ userName: '加载中...', userMobile: '', tel: '' }, cached) : {};

    // 脱敏手机号
    const mobile = user.userMobile || '';
    if (mobile.length >= 11) {
      user.tel = mobile.slice(0, 3) + '****' + mobile.slice(7);
    } else {
      user.tel = '';
    }

    const roleLabel = this.computeRoleLabel(user);

    this.setData({
      user,
      roleLabel,
      loggedIn,
      footprintCount: 0,
      favoriteCount: 0  // 先置 0，异步更新
    });

    browseFootprint.countAsync().then((c) => {
      if (this.data.loggedIn) this.setData({ footprintCount: c });
    }).catch(() => {});

    this.getProfile();
    this.getMyCoupon();
    this.loadFavoriteCount();
  },

  async loadFavoriteCount() {
    try {
      const { total } = await favoritesStore.fetchList({ page: 1, page_size: 1 });
      const svcCount = serviceFavStore.count();
      this.setData({ favoriteCount: (total || 0) + svcCount });
    } catch (e) {
      this.setData({ favoriteCount: serviceFavStore.count() });
    }
  },

  // 从服务端拉取用户完整资料（含余额）
  getProfile() {
    const prevStatus = (app.globalData.user || {}).worker_status || (app.globalData.user || {}).workerStatus || '';
    api.user.getUserProfile().then((data) => {
      const cid = data.community_id != null ? data.community_id : data.communityId;
      const sid = data.id != null ? String(data.id) : null;
      const gid = app.globalData.user && app.globalData.user.id != null ? String(app.globalData.user.id) : null;
      if (sid != null && gid != null && sid !== gid) {
        console.warn('[getProfile] 用户 id 与登录缓存不一致，以服务端资料为准', { cached: gid, profile: sid });
      }
      if (sid != null) userSession.rememberUserId(sid);
      if (app.globalData.user) {
        app.globalData.user = rolePortals.mergePortalFlags(app.globalData.user, data);
        if (sid != null) app.globalData.user.id = sid;
        if (cid != null) app.globalData.user.communityId = cid;
        // 同步头像、昵称等用户信息
        const nickname = data.nickname || data.userName || data.name;
        const avatar = data.avatar_url || data.avatarUrl || data.avatar || data.userPhoto;
        const mobile = data.phone || data.userMobile || data.mobile;
        if (nickname != null) app.globalData.user.userName = nickname;
        if (avatar != null) app.globalData.user.userPhoto = avatar;
        if (mobile != null) app.globalData.user.userMobile = mobile;
        if (data.points != null) app.globalData.user.points = Number(data.points);
      }
      const user = app.globalData.user || {};
      const newStatus = user.worker_status || user.workerStatus || '';
      // 检测技工审核状态变更，推送系统通知
      if (prevStatus === 'pending' && newStatus === 'approved') {
        localPrefs.pushSystemNotice({
          id: `worker_approved_${Date.now()}`,
          title: '技工入驻审核通过',
          content: '恭喜！您的技工入驻申请已通过审核，现在可以进入技工工作台开始接单了。',
          time: new Date().toISOString()
        });
      } else if (prevStatus === 'pending' && newStatus === 'rejected') {
        // 尝试获取驳回原因
        this.fetchWorkerRejectReason();
      }
      const balanceValue = balance.getDisplayBalance(balance.BALANCE_TYPES.USER);
      this.setData({
        balance: balanceValue,
        user,
        roleLabel: this.computeRoleLabel(user)
      });
      this.loadCommissionBalance();
      browseFootprint.syncLocalToServer();
      serviceFavStore.syncLocalToServer();
      browseFootprint.countAsync().then((c) => {
        this.setData({ footprintCount: c });
      }).catch(() => {});
    }).catch(() => {
      this.setData({ balance: '0.00' });
    });
  },

  // 获取技工申请驳回原因并推送通知
  fetchWorkerRejectReason() {
    util.get('worker/application/me').then((res) => {
      const reason = res && res.data && res.data.reject_reason ? res.data.reject_reason : '';
      const content = reason
        ? `很遗憾，您的技工入驻申请未通过审核。\n驳回原因：${reason}\n请完善资料后重新提交。`
        : '很遗憾，您的技工入驻申请未通过审核，请完善资料后重新提交。';
      localPrefs.pushSystemNotice({
        id: `worker_rejected_${Date.now()}`,
        title: '技工入驻审核未通过',
        content,
        time: new Date().toISOString()
      });
    }).catch(() => {
      localPrefs.pushSystemNotice({
        id: `worker_rejected_${Date.now()}`,
        title: '技工入驻审核未通过',
        content: '很遗憾，您的技工入驻申请未通过审核，请完善资料后重新提交。',
        time: new Date().toISOString()
      });
    });
  },

  // 拉取优惠券数量（进入个人中心时确保发放新人券）
  getMyCoupon() {
    if (!wx.getStorageSync('token')) {
      this.setData({ couponCount: 0 });
      return;
    }
    api.coupon.getMyCoupons({ page: 1, page_size: 50, status: 'unused' })
      .then((res) => {
        const list = (res && res.list) || (res && res.data && res.data.list) || [];
        this.setData({ couponCount: Array.isArray(list) ? list.length : 0 });
      })
      .catch(() => {
        const userId = (this.data.user || {}).id;
        if (!userId) {
          this.setData({ couponCount: 0 });
          return;
        }
        util.get(`wx/user/coupon/${userId}`).then((data) => {
          const list = Array.isArray(data) ? data : (data && data.list) || [];
          this.setData({ couponCount: list.length });
        }).catch(() => {
          this.setData({ couponCount: 0 });
        });
      });
  },

  onShareAppMessage() {
    const openid = (app.globalData.user || {}).opId || '';
    return app.onShare(openid, {});
  },

  goAddress() {
    wx.navigateTo({ url: '../address/address' });
  },

  goAccount() {
    wx.navigateTo({ url: '../account/account' });
  }
})
