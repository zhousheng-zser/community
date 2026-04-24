const app = getApp();
const api = require('../../api/index.js');

Page({
  data: {
    groupId: null,
    groupName: '',
    members: [],
    loading: false,
    showMemberPicker: false
  },

  onLoad(options) {
    const groupId = options.groupId;
    const groupName = decodeURIComponent(options.name || '群聊');
    this.setData({ groupId, groupName });
    this.loadMembers();
  },

  async loadMembers() {
    this.setData({ loading: true });
    try {
      const res = await api.chat.getGroupMembers(this.data.groupId);
      const members = res.list || (res.data && res.data.list) || res.data || res || [];
      this.setData({ members, loading: false });
    } catch (e) {
      console.log('群成员加载失败', e);
      this.setData({ loading: false });
      this.mockLoadMembers();
    }
  },

  mockLoadMembers() {
    this.setData({
      members: [
        { id: 1, name: '张三', avatar: '/img/placeholders/home_cleaning.png', role: 'owner' },
        { id: 2, name: '李四', avatar: '/img/placeholders/home_cleaning.png', role: 'admin' },
        { id: 3, name: '王五', avatar: '/img/placeholders/home_cleaning.png', role: 'member' },
        { id: 4, name: '赵六', avatar: '/img/placeholders/home_cleaning.png', role: 'member' },
        { id: 5, name: '钱七', avatar: '/img/placeholders/home_cleaning.png', role: 'member' }
      ]
    });
  },

  goBack() {
    wx.navigateBack();
  },

  showAddMember() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  removeMember(e) {
    const userId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要移除该成员吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.chat.removeGroupMember(this.data.groupId, userId);
            wx.showToast({ title: '移除成功', icon: 'success' });
            this.loadMembers();
          } catch (e) {
            console.log('移除失败', e);
            wx.showToast({ title: '移除失败', icon: 'none' });
          }
        }
      }
    });
  },

  quitGroup() {
    wx.showModal({
      title: '提示',
      content: '确定要退出该群吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.chat.quitGroup(this.data.groupId);
            wx.showToast({ title: '已退出群聊', icon: 'success' });
            wx.navigateBack();
          } catch (e) {
            console.log('退出失败', e);
            wx.showToast({ title: '退出失败', icon: 'none' });
          }
        }
      }
    });
  },

  dismissGroup() {
    wx.showModal({
      title: '提示',
      content: '确定要解散该群吗？此操作不可恢复',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.chat.dismissGroup(this.data.groupId);
            wx.showToast({ title: '已解散群聊', icon: 'success' });
            wx.navigateBack();
          } catch (e) {
            console.log('解散失败', e);
            wx.showToast({ title: '解散失败', icon: 'none' });
          }
        }
      }
    });
  }
});
