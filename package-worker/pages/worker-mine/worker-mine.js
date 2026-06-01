const app = getApp();
const rp = require('../../../utils/rolePortals.js');
const workerCtx = require('../../utils/workerContext.js');
const api = require('../../../api/index.js');
const STORAGE_ACCEPT = 'worker_accept_orders';
const DEF_AVATAR =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    user: {},
    acceptOn: true,
    displayName: '师傅',
    workerName: '',
    workerIndustry: '',
    workerSubtitle: '',
    userPhoto: DEF_AVATAR
  },

  onShow() {
    this.loadWorkerIdentity();
  },

  async loadWorkerIdentity() {
    const user = app.globalData.user || {};
    let acceptOn = true;
    try {
      const v = wx.getStorageSync(STORAGE_ACCEPT);
      if (v === '0' || v === false) acceptOn = false;
    } catch (e) {}

    let workerName = '';
    let workerIndustry = '';

    try {
      const profileRes = await api.user.getUserProfile();
      if (app.globalData.user) {
        app.globalData.user = rp.mergePortalFlags(app.globalData.user, profileRes);
      }
      if (profileRes.worker_profile_id) {
        workerCtx.syncBoundProfile(app, { id: profileRes.worker_profile_id });
      }
    } catch (e) {}

    try {
      const appRes = await api.worker.getWorkerApplication();
      const appData = workerCtx.normalizeApplicationPayload(appRes);
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
        workerCtx.syncBoundProfile(app, {
          id: detail.profile_id || detail.worker_profile_id || (app.globalData.user || {}).worker_profile_id,
          real_name: detail.real_name || detail.name,
          industry: detail.industry || detail.skill
        });
      } catch (e) {}
    }

    const bound = workerCtx.getBoundProfile(app);
    workerName = bound.realName || '';
    workerIndustry = bound.industry || '';
    const communityName = wx.getStorageSync('community_name') || '';
    const subtitleParts = [workerName, workerIndustry, communityName].filter(Boolean);

    this.setData({
      user,
      acceptOn,
      displayName: workerName || user.userName || '师傅',
      workerName,
      workerIndustry,
      workerSubtitle: subtitleParts.length ? subtitleParts.join(' · ') : '技工端 · 与用户端同一账号',
      userPhoto: user.userPhoto || DEF_AVATAR
    });
  },

  onAcceptChange(e) {
    const v = !!e.detail.value;
    try {
      wx.setStorageSync(STORAGE_ACCEPT, v ? '1' : '0');
    } catch (err) {}
    this.setData({ acceptOn: v });
    wx.showToast({ title: v ? '已开启接单' : '已暂停接单', icon: 'none' });
  },

  goHome() {
    wx.redirectTo({ url: rp.workerTabUrl('worker-home') });
  },

  goOrders() {
    wx.redirectTo({ url: rp.workerTabUrl('worker-orders') });
  },

  backUser() {
    rp.backToUserTab();
  }
});
