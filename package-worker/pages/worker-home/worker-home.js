const app = getApp();
const util = require('../../../utils/util.js');
const { unwrapList } = util;
const rp = require('../../../utils/rolePortals.js');
const workerOrderUi = require('../../../utils/workerOrderUi.js');
const api = require('../../../api/index.js');

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
    workerOk: false,
    bannerText: '',
    stats: null,
    statsLoading: false,
    greeting: '你好',
    displayName: '师傅',
    userPhoto: DEF_AVATAR,
    balanceText: '',
    loggedIn: false
  },

  onShow() {
    this.refresh();
    this.loadStats();
    this.loadBalance();
  },

  onPullDownRefresh() {
    this.refresh();
    this.loadStats();
    this.loadBalance();
    wx.stopPullDownRefresh();
  },

  async loadBalance() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ balanceText: '' });
      return;
    }
    try {
      const data = await api.user.getUserProfile();
      const b = data.balance != null ? parseFloat(data.balance) : NaN;
      this.setData({
        balanceText: Number.isFinite(b) ? b.toFixed(2) : '0.00'
      });
    } catch (e) {
      this.setData({ balanceText: '—' });
    }
  },

  refresh() {
    const user = app.globalData.user || {};
    const workerOk = rp.canUseWorkerPortal(user);
    let bannerText = '';
    if (!workerOk) {
      const st = user.worker_status || user.workerStatus;
      if (st === 'pending') bannerText = '入驻审核中，通过后可接单';
      else if (st === 'rejected') bannerText = '入驻未通过，可重新提交资料';
      else bannerText = '请先完成技工入驻，审核通过后可使用订单功能';
    } else {
      bannerText = '您已具备技工身份，可在「订单」中处理派单';
    }
    this.setData({
      workerOk,
      bannerText,
      greeting: getGreeting(),
      displayName: user.userName || '师傅',
      userPhoto: user.userPhoto || DEF_AVATAR,
      loggedIn: !!wx.getStorageSync('token')
    });
  },

  async loadStats() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ stats: null });
      return;
    }
    this.setData({ statsLoading: true });
    try {
      let res;
      try {
        res = await api.worker.getServiceOrderList({ page: 1, limit: 100 });
      } catch (e1) {
        if (e1 && (Number(e1.errno) === 404 || Number(e1.errno) === 501)) {
          res = await api.worker.getOrderList({ page: 1, limit: 100 });
        } else {
          throw e1;
        }
      }
      const raw = unwrapList(res);
      const fullList = raw.map((o) => workerOrderUi.enrichOrderItem(o));
      const c = workerOrderUi.countBuckets(fullList);
      this.setData({
        stats: {
          pending_accept: c.pending_accept,
          pending_visit: c.pending_visit,
          in_service: c.in_service,
          done: c.done
        },
        statsLoading: false
      });
    } catch (e) {
      this.setData({
        stats: { pending_accept: 0, pending_visit: 0, in_service: 0, done: 0 },
        statsLoading: false
      });
    }
  },

  goOrders(e) {
    let url = '/package-worker/pages/worker-orders/worker-orders';
    const ds = e && e.currentTarget && e.currentTarget.dataset;
    const tab = ds && ds.tab;
    if (tab) url += '?tab=' + encodeURIComponent(tab);
    wx.redirectTo({ url });
  },

  goMine() {
    wx.redirectTo({ url: rp.workerTabUrl('worker-mine') });
  },

  goJoin() {
    wx.navigateTo({ url: '/pages/join-worker/join-worker' });
  },

  goAccount() {
    wx.navigateTo({ url: '/pages/account/account' });
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
  },

  /** 虚构演示单，便于预览打卡/导航等 UI（不请求后端） */
  goMockDetail() {
    wx.navigateTo({
      url: '/package-worker/pages/worker-order-detail/worker-order-detail?mock=1'
    });
  }
});
