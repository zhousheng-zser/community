/**
 * 骑手配送任务模块
 * 用于骑手接收配送任务、上报位置、确认送达等
 */

const util = require('../../utils/util.js');
const notifications = require('../../utils/notifications.js');

Page({
  data: {
    tasks: [],
    activeTab: 'pending',
    loading: false,
    page: 1,
    hasMore: true,
    currentTask: null,
    showTaskDetail: false
  },

  onLoad(options) {
    this.loadTasks();
  },

  onShow() {
    this.loadTasks();
  },

  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadTasks().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadTasks(true);
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab, page: 1, tasks: [] });
    this.loadTasks();
  },

  async loadTasks(append) {
    this.setData({ loading: true });
    try {
      const params = {
        page: this.data.page,
        limit: 20,
        status: this.data.activeTab
      };
      const res = await util.get('rider/tasks', params);
      const data = res && res.data !== undefined ? res.data : res;
      const list = (data.list || data || []).map(t => ({
        id: t.id,
        orderNo: t.order_no || t.orderNo,
        shopName: t.shop_name || t.shopName || '未知商家',
        customerName: t.customer_name || t.receiver_name || '未知客户',
        customerPhone: t.customer_phone || t.receiver_phone || '',
        customerAddress: t.customer_address || t.receiver_address || '',
        amount: t.amount || t.pay_amount || '0.00',
        status: t.status || 'pending',
        statusText: this.getStatusText(t.status),
        createdAt: t.created_at || '',
        expectedDelivery: t.expected_delivery || '',
        shopAddress: t.shop_address || '',
        shopPhone: t.shop_phone || ''
      }));
      this.setData({
        tasks: append ? [...this.data.tasks, ...list] : list,
        hasMore: list.length >= 20,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false, tasks: [] });
      wx.showToast({ title: '加载任务失败', icon: 'none' });
    }
  },

  getStatusText(status) {
    const map = {
      pending: '待取货',
      picked: '已取货',
      delivering: '配送中',
      delivered: '已送达',
      cancelled: '已取消'
    };
    return map[status] || status;
  },

  viewTaskDetail(e) {
    const taskId = e.currentTarget.dataset.id;
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      this.setData({ currentTask: task, showTaskDetail: true });
    }
  },

  closeTaskDetail() {
    this.setData({ showTaskDetail: false });
  },

  async acceptTask(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认接单',
      content: '确认接受此配送任务吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中', mask: true });
            await util.post(`rider/tasks/${taskId}/accept`, {});
            wx.hideLoading();
            wx.showToast({ title: '接单成功', icon: 'success' });
            this.loadTasks();
            this.closeTaskDetail();
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: '接单失败', icon: 'none' });
          }
        }
      }
    });
  },

  async confirmPickup(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认取货',
      content: '确认已从商家取货吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中', mask: true });
            await util.post(`rider/tasks/${taskId}/pickup`, {});
            wx.hideLoading();
            wx.showToast({ title: '取货确认成功', icon: 'success' });
            this.loadTasks();
            this.closeTaskDetail();
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: '确认失败', icon: 'none' });
          }
        }
      }
    });
  },

  async confirmDelivery(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认送达',
      content: '确认已将商品送达客户手中吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中', mask: true });
            await util.post(`rider/tasks/${taskId}/deliver`, {});
            wx.hideLoading();
            wx.showToast({ title: '送达确认成功', icon: 'success' });
            this.loadTasks();
            this.closeTaskDetail();
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: '确认失败', icon: 'none' });
          }
        }
      }
    });
  },

  contactShop(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone });
    } else {
      wx.showToast({ title: '暂无商家电话', icon: 'none' });
    }
  },

  contactCustomer(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone });
    } else {
      wx.showToast({ title: '暂无客户电话', icon: 'none' });
    }
  },

  navigateToAddress(e) {
    const address = e.currentTarget.dataset.address;
    if (address) {
      wx.openLocation({
        latitude: 39.90872,
        longitude: 116.39748,
        name: '配送地址',
        address: address,
        scale: 15
      });
    }
  },

  reportLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: async (res) => {
        const { latitude, longitude } = res;
        try {
          await util.post('rider/location/report', {
            latitude,
            longitude,
            task_id: this.data.currentTask?.id
          });
          wx.showToast({ title: '位置上报成功', icon: 'success' });
        } catch (err) {
          wx.showToast({ title: '位置上报失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '获取位置失败', icon: 'none' });
      }
    });
  }
});
