// pages/user/user.js
const app = getApp();
const util = require('../../utils/util.js');
const rolePortals = require('../../utils/rolePortals.js');

Page({
  data: {
    navTop: 44,
    user: {},
    loggedIn: false,
    roleLabel: '普通用户',
    points: 0,
    couponCount: 0,
    orderMenus: [
      { name: "服务订单", icon: "service_order", url: "../service-orders-my/service-orders-my" },
      { name: "一键发布", icon: "quick_publish", url: "../order-publish/order-publish" },
      { name: "集市订单", icon: "market_order", url: "../market-order-list/market-order-list" },
      { name: "帮帮订单", icon: "combo_package", url: "../neighbor-assist-orders-my/neighbor-assist-orders-my" },
      { name: "惠民卡订单", icon: "benefit_card_order", url: "../benefit-orders/benefit-orders" },
      { name: "推客订单", icon: "promoter_order", url: "../promoter-orders/promoter-orders" },
      { name: "组合套餐", icon: "combo_package", url: "../combo-orders/combo-orders" }
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
      { name: "服务商入驻", sub: "提供专业到家服务", icon: "service_provider", url: "../join-service/join-service" }
    ],
    serviceMenus: [
      { name: "帮助反馈", icon: "help_feedback", url: "../feedback/feedback" },
      { name: "小区管家", icon: "community_manager", url: "../community-steward/community-steward" },
      { name: "关于我们", icon: "about_us", url: "../about/about" },
      { name: "地址管理", icon: "address_management", url: "../address/address" },
      { name: "平台客服", icon: "platform_service", url: "../platform-kefu/platform-kefu" },
      { name: "设置", icon: "settings", url: "../settings/settings" }
    ]
  },

  showToastWait() {
    wx.showToast({ title: '敬请期待', icon: 'none' });
  },

  computeRoleLabel(user) {
    const roleMap = { admin: '管理员', promoter: '推客', user: '普通用户', worker: '技工', merchant: '服务商' };
    const roles = rolePortals.normalizeRoles(user);
    if (roles.length <= 1) return roleMap[roles[0]] || '普通用户';
    return roles.map((r) => roleMap[r] || r).join('·');
  },

  goWorkerPortal() {
    rolePortals.navigateToWorkerHome();
  },

  goMerchantPortal() {
    rolePortals.navigateToMerchantHome();
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTop: (sys.statusBarHeight || 20) + 10 });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
    const user = app.globalData.user || {};

    // 脱敏手机号
    const mobile = user.userMobile || '';
    if (mobile.length >= 11) {
      user.tel = mobile.slice(0, 3) + '****' + mobile.slice(7);
    } else {
      user.tel = '';
    }

    const roleLabel = this.computeRoleLabel(user);
    const loggedIn = !!wx.getStorageSync('token');

    this.setData({
      user,
      roleLabel,
      loggedIn,
      points: user.points || 0
    });

    this.getProfile();
    this.getMyCoupon();
  },

  // 从服务端拉取用户完整资料（含余额）
  getProfile() {
    util.get('user/profile').then((data) => {
      const balance = parseFloat(data.balance || 0).toFixed(2);
      const cid = data.community_id != null ? data.community_id : data.communityId;
      if (app.globalData.user) {
        app.globalData.user = rolePortals.mergePortalFlags(app.globalData.user, data);
        if (cid != null) app.globalData.user.communityId = cid;
      }
      const user = app.globalData.user || {};
      this.setData({
        balance,
        user,
        roleLabel: this.computeRoleLabel(user)
      });
    }).catch(() => {
      this.setData({ balance: '0.00' });
    });
  },

  // 拉取优惠券数量
  getMyCoupon() {
    const userId = (this.data.user || {}).id;
    if (!userId) return;
    util.get(`wx/user/coupon/${userId}`).then((data) => {
      this.setData({ couponCount: Array.isArray(data) ? data.length : 0 });
    }).catch(() => {
      this.setData({ couponCount: 0 });
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
