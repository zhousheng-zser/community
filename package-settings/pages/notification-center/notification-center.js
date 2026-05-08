const notifications = require('../../utils/notifications.js');
const util = require('../../utils/util.js');

Page({
  data: {
    notificationList: [],
    loading: false,
    page: 1,
    hasMore: true,
    unreadCount: 0,
    activeTab: 'all'
  },

  onLoad() {
    this.loadNotifications();
    this.loadUnreadCount();
  },

  onShow() {
    this.loadNotifications();
    this.loadUnreadCount();
  },

  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadNotifications().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadNotifications(true);
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab, page: 1, notificationList: [] });
    this.loadNotifications();
  },

  async loadNotifications(append) {
    this.setData({ loading: true });
    try {
      const params = {
        page: this.data.page,
        page_size: 20
      };
      if (this.data.activeTab === 'unread') {
        params.is_read = false;
      }
      const res = await notifications.getMyNotifications(params.page, params.page_size);
      const data = res && res.data !== undefined ? res.data : res;
      const list = (data.list || data || []).map(n => ({
        id: n.id,
        type: n.type,
        title: n.title || notifications.getNotificationText(n.type, n.data || {}),
        content: n.content || '',
        data: n.data || {},
        isRead: n.is_read || n.isRead || false,
        createdAt: n.created_at || n.createdAt || '',
        timeDisplay: this.formatTime(n.created_at || n.createdAt)
      }));
      this.setData({
        notificationList: append ? [...this.data.notificationList, ...list] : list,
        hasMore: list.length >= 20,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false, notificationList: [] });
      wx.showToast({ title: '加载通知失败', icon: 'none' });
    }
  },

  async loadUnreadCount() {
    try {
      const res = await util.get('notifications/unread-count');
      const data = res && res.data !== undefined ? res.data : res;
      this.setData({ unreadCount: data.count || data.unreadCount || 0 });
    } catch (err) {
      this.setData({ unreadCount: 0 });
    }
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    const now = new Date();
    const time = new Date(timeStr.replace(/-/g, '/'));
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return timeStr.slice(5, 16);
  },

  async markAsRead(e) {
    const notificationId = e.currentTarget.dataset.id;
    try {
      await notifications.markAsRead(notificationId);
      const list = this.data.notificationList.map(n => {
        if (n.id === notificationId) {
          return { ...n, isRead: true };
        }
        return n;
      });
      this.setData({ notificationList: list });
      this.loadUnreadCount();
    } catch (err) {
      wx.showToast({ title: '标记已读失败', icon: 'none' });
    }
  },

  async markAllAsRead() {
    wx.showModal({
      title: '确认操作',
      content: '确定将所有通知标记为已读吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await util.post('notifications/read-all', {});
            const list = this.data.notificationList.map(n => ({ ...n, isRead: true }));
            this.setData({ notificationList: list, unreadCount: 0 });
            wx.showToast({ title: '已全部标记为已读', icon: 'success' });
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  handleNotificationTap(e) {
    const notification = e.currentTarget.dataset.item;
    if (!notification.isRead) {
      this.markAsRead({ currentTarget: { dataset: { id: notification.id } } });
    }
    const { type, data } = notification;
    if (type === 'order_created' || type === 'order_accepted' || type === 'order_shipped') {
      if (data.orderNo) {
        wx.navigateTo({ url: `/pages/market-order-detail/market-order-detail?orderNo=${data.orderNo}` });
      }
    } else if (type === 'refund_applied' || type === 'refund_approved' || type === 'refund_rejected') {
      if (data.orderNo) {
        wx.navigateTo({ url: `/pages/market-order-detail/market-order-detail?orderNo=${data.orderNo}` });
      }
    } else if (type === 'dispatch_created' || type === 'dispatch_accepted') {
      if (data.orderId) {
        wx.navigateTo({ url: `/package-worker/pages/worker-order-detail/worker-order-detail?id=${data.orderId}` });
      }
    } else if (type === 'complaint_created' || type === 'arbitration_result') {
      if (data.orderNo) {
        wx.navigateTo({ url: `/pages/market-order-detail/market-order-detail?orderNo=${data.orderNo}` });
      }
    }
  },

  clearNotifications() {
    wx.showModal({
      title: '确认操作',
      content: '确定清空所有通知吗？此操作不可恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            await util.post('notifications/clear', {});
            this.setData({ notificationList: [], unreadCount: 0 });
            wx.showToast({ title: '已清空通知', icon: 'success' });
          } catch (err) {
            wx.showToast({ title: '清空失败', icon: 'none' });
          }
        }
      }
    });
  }
});
