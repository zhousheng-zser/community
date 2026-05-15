// pages/commission-overview/commission-overview.js
const app = getApp();
const api = require('../../../api/index.js');

const ROLE_LABEL = {
  promoter: '推广者',
  district_partner: '区县合伙人',
  market_partner: '市场合伙人'
};

const ROLE_COLOR = {
  promoter: '#ff7a00',
  district_partner: '#1890ff',
  market_partner: '#722ed1'
};

Page({
  data: {
    summary: null,
    roles: [],
    loading: true
  },

  onShow() {
    this.loadBalance();
  },

  async loadBalance() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await api.commission.getMyBalance();
      const data = res && res.data ? res.data : res;
      this.setData({
        summary: data,
        roles: (data.roles || []).map(r => ({
          ...r,
          label: ROLE_LABEL[r.role] || r.role,
          color: ROLE_COLOR[r.role] || '#999'
        })),
        loading: false
      });
    } catch (e) {
      console.error('获取佣金余额失败:', e);
      this.setData({ loading: false });
      wx.showToast({ title: '获取余额失败', icon: 'none' });
    }
  },

  goWithdraw() {
    wx.navigateTo({ url: '/pages/account/account?action=withdraw' });
  },

  goRecords() {
    wx.navigateTo({ url: '/package-commission/pages/commission-records/commission-records' });
  },

  goPartner() {
    wx.navigateTo({ url: '/package-commission/pages/partner-manage/partner-manage' });
  }
});
