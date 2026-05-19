const util = require('../../utils/util.js');
const { mapWorkerForClassifyCard } = require('../../utils/workerApiMap.js');
const { workerAvatarUrl } = require('../../utils/workerAvatars.js');
const { getActiveCommunityId, fetchWorkerRows } = require('../../utils/communityPortal.js');

Page({
  data: {
    navTopPadding: 20,
    categoryExpanded: false,
    categories: [
      "积分兑换", "爱心公益", "上门私厨", "人力综合服务", "养生按摩",
      "衣物干洗", "专业辅导", "爱宠照护", "工匠艺人", "家庭陪护",
      "宝宝家事", "家庭保洁", "助老家事", "家电维修", "上门维修",
      "家修急事", "家电清洗", "甲醛治理", "康养护理", "上门美业",
      "衣物洗护", "上门服务", "上门安装", "保姆月嫂", "养车养护",
      "除螨服务", "开荒保洁", "深度保洁", "家居养护", "整理收纳",
      "助老护老", "闲置二手", "上门回收", "便民服务", "房屋装修"
    ],
    workers: [],
    loading: true
  },
  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 6
    });
    this.loadWorkers();
  },
  onShow() {
    this.loadWorkers();
  },
  async loadWorkers() {
    this.setData({ loading: true });
    const communityId = getActiveCommunityId(getApp());
    try {
      const rows = await fetchWorkerRows(communityId, { page: 1, limit: 50 });
      this.setData({
        workers: rows.map(mapWorkerForClassifyCard),
        loading: false
      });
    } catch (e) {
      console.log('[classify] core/workers 请求失败', e);
      this.setData({ workers: [], loading: false });
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
    }
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  },
  toggleCategory() {
    this.setData({ categoryExpanded: !this.data.categoryExpanded });
  },
  goWorkerDetail(e) {
    wx.navigateTo({
      url: '../worker-detail/worker-detail?id=' + encodeURIComponent(String(e.currentTarget.dataset.id || ''))
    });
  },

  onWorkerAvatarError(e) {
    const idx = e.currentTarget.dataset.idx;
    const workers = this.data.workers || [];
    if (idx == null || !workers[idx]) return;
    const fallback = workerAvatarUrl(workers[idx].id);
    if (workers[idx].avatar === fallback) return;
    this.setData({ [`workers[${idx}].avatar`]: fallback });
  }
});
