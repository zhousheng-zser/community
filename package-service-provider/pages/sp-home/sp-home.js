const app = getApp();
const util = require('../../../utils/util.js');
const rp = require('../../../utils/rolePortals.js');
const api = require('../../../api/index.js');
const spCtx = require('../../utils/spContext.js');
const balance = require('../../../utils/balance.js');
const { createPortalCoverHandlers } = require('../../../utils/portalCoverPageMixin.js');
const portalHandlers = createPortalCoverHandlers('service_provider');

const DEF_AVATAR =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '上午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

Page({
  data: {
    spOk: false,
    bannerText: '',
    greeting: '你好',
    displayName: '服务商',
    shopName: '',
    userPhoto: DEF_AVATAR,
    coverImage: '',
    balanceText: '0.00',
    stats: {
      pendingOrders: 0,
      inService: 0,
      completed: 0,
      totalServices: 0
    },
    loading: false
  },

  onEditCover: portalHandlers.onEditCover,

  onShow() {
    this.checkSPStatus();
  },

  onPullDownRefresh() {
    this.checkSPStatus();
    this.loadBalance();
    this.loadStats();
    wx.stopPullDownRefresh();
  },

  async checkSPStatus() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ spOk: false });
      return;
    }
    const user = app.globalData.user || {};
    const roles = user.roles || user.roleList || [];
    const hasRole = Array.isArray(roles)
      ? roles.some(r => String(r).includes('service_provider'))
      : (user.service_provider_status === 'approved' || user.service_provider_status === 'active');

    // Try to load profile to verify
    try {
      const res = await api.serviceProvider.getProfile();
      const profile = spCtx.normalizeProfilePayload(res);
      if (profile && profile.status === 'active') {
        spCtx.syncBoundProfile(app, profile);
        try { await api.serviceProvider.exchangeServiceProviderToken(); } catch (e) {}
        this.setData({
          spOk: true,
          shopName: profile.shop_name || '',
          displayName: profile.contact_name || user.userName || '服务商',
          userPhoto: user.userPhoto || DEF_AVATAR,
          bannerText: `欢迎使用服务商工作台，管理您的服务与订单`,
          greeting: getGreeting()
        });
        this.loadBalance();
        this.loadStats();
        await portalHandlers.loadPortalCoverImages.call(this, 'service_provider', true);
        return;
      }
    } catch (e) {}

    // Fallback: check local role
    if (hasRole || user.service_provider_status) {
      try { await api.serviceProvider.exchangeServiceProviderToken(); } catch (e) {}
      const fallbackId = user.service_provider_profile_id || user.serviceProviderProfileId;
      if (fallbackId) {
        spCtx.syncBoundProfile(app, { id: fallbackId, shop_name: user.sp_shop_name || user.shop_name || '' });
      }
      this.setData({
        spOk: true,
        displayName: user.userName || '服务商',
        userPhoto: user.userPhoto || DEF_AVATAR,
        bannerText: '欢迎使用服务商工作台，管理您的服务与订单',
        greeting: getGreeting()
      });
      this.loadBalance();
      this.loadStats();
      await portalHandlers.loadPortalCoverImages.call(this, 'service_provider', true);
    } else {
      this.setData({ spOk: false, greeting: getGreeting(), displayName: user.userName || '用户' });
    }
  },

  async loadBalance() {
    const token = wx.getStorageSync('token');
    if (!token) { this.setData({ balanceText: '' }); return; }
    try {
      const b = await balance.fetchBalanceFromServer(balance.BALANCE_TYPES.SERVICE_PROVIDER);
      this.setData({ balanceText: balance.formatBalance(b) });
    } catch (e) {
      const localBalance = balance.getDisplayBalance(balance.BALANCE_TYPES.SERVICE_PROVIDER);
      this.setData({ balanceText: localBalance });
    }
  },

  async loadStats() {
    const token = wx.getStorageSync('token');
    if (!token) { this.setData({ stats: { pendingOrders: 0, inService: 0, completed: 0, totalServices: 0 } }); return; }
    this.setData({ loading: true });
    try {
      const [statsRes, servicesRes] = await Promise.allSettled([
        api.serviceProvider.getDashboard(),
        api.serviceProvider.getServices({ page: 1, limit: 1 })
      ]);
      const data = statsRes.status === 'fulfilled'
        ? (statsRes.value && statsRes.value.data !== undefined ? statsRes.value.data : statsRes.value) || {}
        : {};
      const svcTotal = servicesRes.status === 'fulfilled'
        ? ((servicesRes.value && (servicesRes.value.total || (servicesRes.value.data && servicesRes.value.data.total))) || 0)
        : 0;
      this.setData({
        stats: {
          pendingOrders: data.pending_orders || data.pendingOrders || data.pending || 0,
          inService: data.in_service || data.inService || data.in_progress || 0,
          completed: data.completed || data.completed_today || 0,
          totalServices: svcTotal
        },
        loading: false
      });
    } catch (e) {
      this.setData({ stats: { pendingOrders: 0, inService: 0, completed: 0, totalServices: 0 }, loading: false });
    }
  },

  goJoin() { wx.navigateTo({ url: '/pages/join-service/join-service' }); },
  goOrders() { wx.navigateTo({ url: '/package-merchant/pages/merchant-orders/merchant-orders?scene=direct_service' }); },
  goDispatch() { wx.navigateTo({ url: '/package-service-provider/pages/sp-dispatch/sp-dispatch' }); },
  goServices() { wx.navigateTo({ url: '/package-service-provider/pages/sp-services/sp-services' }); },
  goMine() { wx.navigateTo({ url: '/package-service-provider/pages/sp-mine/sp-mine' }); },
  goSettings() { wx.navigateTo({ url: '/package-service-provider/pages/sp-settings/sp-settings' }); },
  goQualification() { wx.navigateTo({ url: '/package-service-provider/pages/sp-qualification/sp-qualification' }); },
  goServiceShelfUp() { wx.navigateTo({ url: '/package-service-provider/pages/sp-services/sp-services?mode=up' }); },
  goServiceShelfDown() { wx.navigateTo({ url: '/package-service-provider/pages/sp-services/sp-services?mode=down' }); },
  goShop() {
    const profile = spCtx.getBoundProfile(app);
    const user = (app.globalData && app.globalData.user) || {};
    const shopRef = user.sp_user_id || profile.userId || profile.profileId || profile.id || profile.profile_id;
    if (!shopRef) { wx.showToast({ title: '暂未绑定门店', icon: 'none' }); return; }
    wx.navigateTo({ url: `/pages/service-provider-shop/service-provider-shop?provider_id=${encodeURIComponent(String(shopRef))}` });
  },
  goAccount() { wx.navigateTo({ url: '/pages/account/account' }); },
  backUser() { rp.backToUserTab(); }
});
