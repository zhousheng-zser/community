const app = getApp();
const util = require('../../../utils/util.js');
const rp = require('../../../utils/rolePortals.js');
const balance = require('../../../utils/balance.js');

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
    displayName: '服务商',
    userPhoto: DEF_AVATAR,
    balanceText: '0.00',
    stats: {
      pendingOrders: 0,
      dispatching: 0,
      inProgress: 0,
      completed: 0
    },
    loading: false
  },

  onShow() {
    this.refresh();
    this.loadBalance();
    this.loadStats();
  },

  onPullDownRefresh() {
    this.refresh();
    this.loadBalance();
    this.loadStats();
    wx.stopPullDownRefresh();
  },

  refresh() {
    const user = app.globalData.user || {};
    this.setData({
      greeting: getGreeting(),
      displayName: user.userName || '服务商',
      userPhoto: user.userPhoto || DEF_AVATAR
    });
  },

  async loadBalance() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ balanceText: '' });
      return;
    }
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
    if (!token) {
      this.setData({ stats: { pendingOrders: 0, dispatching: 0, inProgress: 0, completed: 0 } });
      return;
    }
    this.setData({ loading: true });
    try {
      const res = await util.get('service-provider/orders/stats');
      const data = res && res.data !== undefined ? res.data : res;
      this.setData({
        stats: {
          pendingOrders: data.pending_orders || data.pendingOrders || 0,
          dispatching: data.dispatching || 0,
          inProgress: data.in_progress || data.inProgress || 0,
          completed: data.completed || 0
        },
        loading: false
      });
    } catch (e) {
      this.setData({
        stats: { pendingOrders: 0, dispatching: 0, inProgress: 0, completed: 0 },
        loading: false
      });
    }
  },

  goOrders() {
    wx.navigateTo({
      url: '/package-service-provider/pages/sp-orders/sp-orders'
    });
  },

  goDispatch() {
    wx.navigateTo({
      url: '/package-service-provider/pages/sp-dispatch/sp-dispatch'
    });
  },

  goServices() {
    wx.navigateTo({
      url: '/package-service-provider/pages/sp-services/sp-services'
    });
  },

  goMine() {
    wx.navigateTo({
      url: '/package-service-provider/pages/sp-mine/sp-mine'
    });
  },

  backUser() {
    rp.backToUserTab();
  }
});
