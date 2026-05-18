const app = getApp();
const util = require('../../../utils/util.js');
const rp = require('../../../utils/rolePortals.js');

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
    greeting: '你好',
    displayName: '管家',
    userPhoto: DEF_AVATAR,
    bannerText: '',
    communityName: '',
    hotline: '400-000-0000'
  },

  onShow() {
    this.refresh();
    this.loadProfile();
  },

  onPullDownRefresh() {
    this.refresh();
    this.loadProfile();
    wx.stopPullDownRefresh();
  },

  refresh() {
    const user = app.globalData.user || {};
    this.setData({
      greeting: getGreeting(),
      displayName: user.userName || user.name || '管家',
      userPhoto: user.userPhoto || user.avatar_url || DEF_AVATAR,
      bannerText: '欢迎使用小区管家工作台'
    });
  },

  async loadProfile() {
    try {
      const res = await util.get('steward/profile/me');
      const data = (res && res.data) || res || {};
      const profile = data.profile || {};
      const appRow = data.application || {};
      this.setData({
        communityName: profile.community_name || appRow.community_name || '',
        hotline: profile.hotline || '400-000-0000'
      });
    } catch (e) {
      console.log('[steward-home] profile', e);
    }
  },

  copyHotline() {
    wx.setClipboardData({
      data: this.data.hotline,
      success: () => wx.showToast({ title: '已复制热线', icon: 'none' })
    });
  },

  goResidentPage() {
    wx.navigateTo({ url: '/pages/community-steward/community-steward' });
  },

  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  },

  goMessage() {
    wx.navigateTo({ url: '/pages/message/message' });
  },

  goAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  backUser() {
    rp.backToUserTab();
  }
});
