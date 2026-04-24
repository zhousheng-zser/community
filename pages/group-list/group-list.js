const app = getApp();
const api = require('../../api/index.js');

Page({
  data: {
    groups: [],
    loading: false
  },

  onLoad() {
    this.loadGroups();
  },

  onShow() {
    this.loadGroups();
  },

  onPullDownRefresh() {
    this.loadGroups();
  },

  async loadGroups() {
    this.setData({ loading: true });
    try {
      const res = await api.chat.getGroups({ page: 1, page_size: 50 });
      const groups = res.list || (res.data && res.data.list) || res.data || res || [];
      this.setData({ groups, loading: false });
      wx.stopPullDownRefresh();
    } catch (e) {
      console.log('群列表加载失败', e);
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
      this.mockLoadGroups();
    }
  },

  mockLoadGroups() {
    this.setData({
      groups: [
        { id: 1, name: '小区业主群', avatar: '/img/placeholders/home_cleaning.png', memberCount: 128, lastMessage: '欢迎新邻居', lastMessageTime: '10:30' },
        { id: 2, name: '二手交易群', avatar: '/img/placeholders/home_cleaning.png', memberCount: 86, lastMessage: '有人出闲置吗', lastMessageTime: '09:15' },
        { id: 3, name: '拼团购物群', avatar: '/img/placeholders/home_cleaning.png', memberCount: 256, lastMessage: '今天拼什么', lastMessageTime: '昨天' }
      ]
    });
  },

  goGroupChat(e) {
    const groupId = e.currentTarget.dataset.id;
    const group = this.data.groups.find(g => g.id === groupId);
    wx.navigateTo({
      url: `/pages/group-chat/group-chat?groupId=${groupId}&name=${encodeURIComponent((group && group.name) || '群聊')}`
    });
  },

  goGroupDetail(e) {
    const groupId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/group-detail/group-detail?groupId=${groupId}`
    });
  },

  createGroup() {
    wx.showModal({
      title: '创建群聊',
      content: '选择要邀请的好友',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '功能开发中', icon: 'none' });
        }
      }
    });
  }
});
