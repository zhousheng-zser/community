// pages/user/user.js
const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    navTop: 44,
    user: {},
    roleLabel: '普通用户',
    points: 0,
    couponCount: 0,
    balance: '0.00',
    orderMenus: [
      { name: "服务订单", emoji: "📋", iconBg: "linear-gradient(135deg,#ffe5ea,#ffd3dc)", url: "../book-my/book-my" },
      { name: "一键发布", emoji: "⚡", iconBg: "linear-gradient(135deg,#ffeccd,#ffe0b2)", url: "../order-publish/order-publish" },
      { name: "集市订单", emoji: "🛒", iconBg: "linear-gradient(135deg,#dff0ff,#c8e4ff)", url: "../order-service/order-service" },
      { name: "福卡订单", emoji: "🎫", iconBg: "linear-gradient(135deg,#f3e7ff,#e6d5ff)" },
      { name: "推客订单", emoji: "🤝", iconBg: "linear-gradient(135deg,#dff7ef,#c9f0e0)" },
      { name: "组合套餐", emoji: "📦", iconBg: "linear-gradient(135deg,#fff4d9,#ffe7b8)" }
    ],
    communityMenus: [
      { name: "我的帖子", emoji: "📝", iconBg: "linear-gradient(135deg,#ffe5ea,#ffd3dc)", url: "../my-posts/my-posts?type=myposts&title=我的帖子" },
      { name: "我的关注", emoji: "👥", iconBg: "linear-gradient(135deg,#fff0d7,#ffe2bd)", url: "../my-follows/my-follows" },
      { name: "我的点赞", emoji: "❤️", iconBg: "linear-gradient(135deg,#dff0ff,#c8e4ff)", url: "../my-posts/my-posts?type=mylikes&title=我的点赞" },
      { name: "参与话题", emoji: "💬", iconBg: "linear-gradient(135deg,#fff7d8,#ffedb8)", url: "../my-posts/my-posts?type=participated&category=热门话题&title=参与话题" },
      { name: "参与活动", emoji: "🎉", iconBg: "linear-gradient(135deg,#e7ecff,#d9e1ff)", url: "../my-activities/my-activities" },
      { name: "活动管理", emoji: "📅", iconBg: "linear-gradient(135deg,#e2f8ee,#cbf0e0)" },
      { name: "诉求列表", emoji: "📢", iconBg: "linear-gradient(135deg,#fff0dc,#ffe2c5)" }
    ],
    joinMenus: [
      { name: "技工入驻", sub: "用技能闲置赚钱", emoji: "🔧", iconBg: "linear-gradient(135deg,#dff0ff,#c8e4ff)", url: "../join-worker/join-worker" },
      { name: "集市商家", sub: "附近商家入驻申请", emoji: "🏪", iconBg: "linear-gradient(135deg,#fff0d7,#ffe2bd)", url: "../join-market/join-market" },
      { name: "服务商入驻", sub: "提供专业到家服务", emoji: "🏠", iconBg: "linear-gradient(135deg,#e7ecff,#d9e1ff)", url: "../join-service/join-service" }
    ],
    serviceMenus: [
      { name: "帮助反馈", emoji: "💬", iconBg: "linear-gradient(135deg,#dff0ff,#c8e4ff)", url: "../feedback/feedback" },
      { name: "小区管家", emoji: "🏘️", iconBg: "linear-gradient(135deg,#fff0dc,#ffe2c5)" },
      { name: "关于我们", emoji: "ℹ️", iconBg: "linear-gradient(135deg,#ffe5ea,#ffd3dc)", url: "../about/about" },
      { name: "地址管理", emoji: "📍", iconBg: "linear-gradient(135deg,#e7ecff,#d9e1ff)", url: "../address/address" },
      { name: "平台客服", emoji: "🎧", iconBg: "linear-gradient(135deg,#fff7d8,#ffedb8)" },
      { name: "设置", emoji: "⚙️", iconBg: "linear-gradient(135deg,#e2f8ee,#cbf0e0)", url: "../settings/settings" }
    ]
  },

  showToastWait() {
    wx.showToast({ title: '敬请期待', icon: 'none' });
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

    // 角色标签
    const roleMap = { admin: '管理员', promoter: '推客', user: '普通用户' };
    const roleLabel = roleMap[user.role] || '普通用户';

    this.setData({
      user,
      roleLabel,
      points: user.points || 0
    });

    this.getProfile();
    this.getMyCoupon();
  },

  // 从服务端拉取用户完整资料（含余额）
  getProfile() {
    util.get('user/profile').then((data) => {
      const balance = parseFloat(data.balance || 0).toFixed(2);
      this.setData({ balance });
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
