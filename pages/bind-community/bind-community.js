const app = getApp();
const api = require('../../api/index.js');
const communityBind = require('../../utils/communityBind.js');
const { getBoundCommunityId } = require('../../utils/communityPortal.js');

Page({
  data: {
    list: [],
    loading: true,
    boundId: null,
    boundName: '',
    saving: false
  },

  onLoad() {
    this.refreshBound();
    this.loadList();
  },

  onShow() {
    this.refreshBound();
  },

  refreshBound() {
    const cid = getBoundCommunityId(app);
    const name = communityBind.getBoundCommunityName();
    this.setData({
      boundId: cid,
      boundName: name || (cid ? `小区#${cid}` : '')
    });
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const res = await api.core.getCommunities();
      const list = (res && res.list) || (res && res.data && res.data.list) || [];
      this.setData({ list: Array.isArray(list) ? list : [], loading: false });
    } catch (e) {
      this.setData({ loading: false, list: [] });
      wx.showToast({ title: '加载小区失败', icon: 'none' });
    }
  },

  async onSelectCommunity(e) {
    const { id, name } = e.currentTarget.dataset;
    if (!id || this.data.saving) return;
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '../login/login' }), 500);
      return;
    }
    this.setData({ saving: true });
    wx.showLoading({ title: '绑定中' });
    try {
      await communityBind.bindCommunity(id, name);
      wx.hideLoading();
      wx.showToast({ title: '已绑定' + (name || ''), icon: 'success' });
      this.setData({ boundId: Number(id), boundName: name || '' });
      setTimeout(() => wx.navigateBack(), 600);
    } catch (err) {
      wx.hideLoading();
      const msg = (err && (err.errmsg || err.msg || err.message)) || '绑定失败';
      console.error('[bind-community]', err);
      wx.showToast({ title: msg, icon: 'none', duration: 2500 });
    } finally {
      this.setData({ saving: false });
    }
  }
});
