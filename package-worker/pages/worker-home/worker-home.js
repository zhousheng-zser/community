const app = getApp();
const util = require('../../../utils/util.js');
const { unwrapList } = util;
const rp = require('../../../utils/rolePortals.js');
const workerOrderUi = require('../../utils/workerOrderUi.js');
const workerCtx = require('../../utils/workerContext.js');
const api = require('../../../api/index.js');
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
    workerOk: false,
    bannerText: '',
    stats: null,
    statsLoading: false,
    greeting: '你好',
    displayName: '师傅',
    workerName: '',
    workerIndustry: '',
    workerSubtitle: '',
    userPhoto: DEF_AVATAR,
    balanceText: '',
    loggedIn: false
  },

  onShow() {
    this.loadWorkerIdentity();
    this.loadStats();
    this.loadBalance();
  },

  onPullDownRefresh() {
    this.loadWorkerIdentity();
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
      const b = await balance.fetchBalanceFromServer(balance.BALANCE_TYPES.WORKER);
      this.setData({
        balanceText: balance.formatBalance(b)
      });
    } catch (e) {
      const localBalance = balance.getDisplayBalance(balance.BALANCE_TYPES.WORKER);
      this.setData({ balanceText: localBalance });
    }
  },

  async loadWorkerIdentity() {
    const token = wx.getStorageSync('token');
    const user = app.globalData.user || {};
    if (!token) {
      this.setData({
        workerOk: false,
        loggedIn: false,
        displayName: '师傅',
        workerName: '',
        workerIndustry: '',
        workerSubtitle: '完成入驻即可接单赚钱',
        userPhoto: DEF_AVATAR,
        bannerText: ''
      });
      return;
    }

    let workerOk = rp.canUseWorkerPortal(user);
    let workerName = '';
    let workerIndustry = '';
    let userPhoto = user.userPhoto || DEF_AVATAR;

    try {
      const profileRes = await api.user.getUserProfile();
      if (app.globalData.user) {
        app.globalData.user = rp.mergePortalFlags(app.globalData.user, profileRes);
      }
      if (profileRes.worker_status === 'approved') workerOk = true;
      if (profileRes.worker_profile_id) {
        workerCtx.syncBoundProfile(app, { id: profileRes.worker_profile_id });
      }
    } catch (e) {}

    try {
      const appRes = await api.worker.getWorkerApplication();
      const appData = workerCtx.normalizeApplicationPayload(appRes);
      if (appData && appData.status === 'approved') workerOk = true;
      workerCtx.syncBoundProfile(app, {
        id: (app.globalData.user || {}).worker_profile_id,
        name: appData.name,
        industry: appData.industry
      });
    } catch (e) {}

    const uid = (app.globalData.user && app.globalData.user.id) || user.id;
    if (uid) {
      try {
        const cid = user.communityId || user.community_id || wx.getStorageSync('community_id');
        const detailRes = await api.core.getWorkerDetail(uid, cid ? { community_id: cid } : undefined);
        const detail = workerCtx.normalizeWorkerDetailPayload(detailRes);
        if (detail && (detail.real_name || detail.name)) {
          workerCtx.syncBoundProfile(app, {
            id: detail.profile_id || detail.worker_profile_id || (app.globalData.user || {}).worker_profile_id,
            real_name: detail.real_name || detail.name,
            industry: detail.industry || detail.skill
          });
          if (detail.avatar_url || detail.avatar) {
            userPhoto = detail.avatar_url || detail.avatar || userPhoto;
          }
        }
      } catch (e) {}
    }

    const bound = workerCtx.getBoundProfile(app);
    workerName = bound.realName || '';
    workerIndustry = bound.industry || '';
    const communityName = wx.getStorageSync('community_name') || '';
    const subtitleParts = [workerName, workerIndustry, communityName].filter(Boolean);
    const workerSubtitle = subtitleParts.length
      ? subtitleParts.join(' · ')
      : (workerOk ? '今日也要好好服务邻居' : '完成入驻即可接单赚钱');

    this.setData({
      workerOk,
      loggedIn: true,
      displayName: workerName || user.userName || '师傅',
      workerName,
      workerIndustry,
      workerSubtitle,
      userPhoto,
      greeting: getGreeting(),
      bannerText: workerOk
        ? (workerName ? `当前技工身份：${workerName}` : '欢迎使用技工工作台，可在「订单」中处理派单')
        : '完成技工入驻审核后可接单'
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

  goServices() {
    wx.navigateTo({ url: rp.workerTabUrl('worker-services') });
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
