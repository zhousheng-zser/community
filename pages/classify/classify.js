const util = require('../../utils/util.js');
const { unwrapList } = util;
const { mapWorkerForClassifyCard } = require('../../utils/workerApiMap.js');

const MOCK_WORKER_ROWS = [
  {
    id: 1,
    name: '何志',
    region: '四川巴中',
    gender: '♂',
    service_count: 0,
    exp: 4,
    resume: '主要从事建筑回收，全品类建材可回收',
    tags: ['组长', '上门回收']
  },
  {
    id: 2,
    name: '余静',
    region: '四川',
    gender: '♀',
    service_count: 1,
    exp: 20,
    resume: '我为人热情大方，乐于助人，喜欢家里整洁，给人舒适的感觉。',
    tags: ['组长', '宠物喂养', '衣柜收纳', '陪护作业']
  },
  {
    id: 3,
    name: '邓长超',
    region: '四川',
    gender: '♂',
    service_count: 0,
    exp: 0,
    resume: '可接送小孩、家政保洁、简单维修等上门服务。',
    tags: ['组长', '宠物喂养', '宠物搭遛', '衣柜干洗']
  }
];

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
    workers: MOCK_WORKER_ROWS.map(mapWorkerForClassifyCard)
  },
  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 6
    });
    this.loadWorkers();
  },
  async loadWorkers() {
    try {
      const res = await util.get('core/workers', { page: 1, limit: 50 });
      const rows = unwrapList(res);
      if (rows.length > 0) {
        this.setData({ workers: rows.map(mapWorkerForClassifyCard) });
      }
    } catch (e) {
      this.setData({ workers: MOCK_WORKER_ROWS.map(mapWorkerForClassifyCard) });
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
      url: "../worker-detail/worker-detail?id=" + e.currentTarget.dataset.id
    });
  }
});
