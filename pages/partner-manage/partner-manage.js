// pages/partner-manage/partner-manage.js
const app = getApp();
const api = require('../../api/index.js');

const ROLE_LABEL = {
  promoter: '推广者',
  district_partner: '区县合伙人',
  market_partner: '市场合伙人'
};

Page({
  data: {
    partnerInfo: null,
    chain: null,
    downlines: [],
    downlineCount: 0,
    loading: true
  },

  onShow() {
    this.loadPartnerInfo();
    this.loadChain();
  },

  async loadPartnerInfo() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await api.partner.getMyPartnerInfo();
      const data = res && res.data ? res.data : res;
      const roleDetails = (data.role_details || []).map(item => ({
        ...item,
        role_name: ROLE_LABEL[item.role] || item.role
      }));
      this.setData({
        partnerInfo: { ...data, role_details: roleDetails },
        downlineCount: data.downline_count || 0,
        loading: false
      });
    } catch (e) {
      console.error('获取合伙人信息失败:', e);
      this.setData({ loading: false });
    }
  },

  async loadChain() {
    try {
      const res = await api.commission.getPartnerChain();
      const data = res && res.data ? res.data : res;
      this.setData({ chain: data });
    } catch (e) {
      console.error('获取合伙人链失败:', e);
    }
  },

  async loadDownlines() {
    try {
      const res = await api.partner.getMyDownlines({ page: 1, limit: 20 });
      const data = res && res.data ? res.data : res;
      this.setData({ downlines: data.list || [] });
    } catch (e) {
      console.error('获取下线列表失败:', e);
    }
  },

  showDownlines() {
    this.loadDownlines();
  },

  async applyPromoter() {
    try {
      wx.showLoading({ title: '申请中...' });
      const res = await api.partner.applyPartner({ role: 'promoter' });
      wx.hideLoading();
      wx.showToast({ title: '申请成功', icon: 'success' });
      this.loadPartnerInfo();
    } catch (e) {
      wx.hideLoading();
      const msg = (e && e.msg) || '申请失败';
      wx.showToast({ title: msg, icon: 'none' });
    }
  },

  copyInviteCode() {
    const user = app.globalData.user || {};
    const code = user.inviteCode || '';
    if (code) {
      wx.setClipboardData({
        data: code,
        success: () => wx.showToast({ title: '邀请码已复制', icon: 'success' })
      });
    } else {
      wx.navigateTo({ url: '/pages/user-code/user-code' });
    }
  },

  goUserCode() {
    wx.navigateTo({ url: '/pages/user-code/user-code' });
  }
});
