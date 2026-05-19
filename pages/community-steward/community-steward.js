const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    phone: '400-000-0000',
    hotline: '400-000-0000',
    stewardName: '',
    communityName: '',
    loading: true
  },

  onShow() {
    this.loadStewardInfo();
  },

  async loadStewardInfo() {
    this.setData({ loading: true });
    try {
      const user = (app.globalData && app.globalData.user) || {};
      const communityId = user.communityId != null ? user.communityId : user.community_id;
      const q = {};
      if (communityId != null && communityId !== '') q.community_id = communityId;
      const res = await util.get('steward/public/info', q);
      const data = (res && res.data) || res || {};
      const hotline = data.hotline || data.phone || '400-000-0000';
      this.setData({
        phone: hotline,
        hotline,
        stewardName: data.name || '',
        communityName: data.community_name || '',
        loading: false
      });
    } catch (e) {
      console.log('[community-steward] load info', e);
      this.setData({ loading: false });
    }
  },

  copyPhone() {
    wx.setClipboardData({
      data: this.data.hotline || this.data.phone,
      success: () => wx.showToast({ title: '已复制', icon: 'none' })
    });
  },

  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  }
});
