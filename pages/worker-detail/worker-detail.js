const util = require('../../utils/util.js');
const { imgUrl } = util;
const images = require('../../utils/images.js');
const { listImageFromHome3 } = require('../../utils/serviceHome3.js');
const { workerAvatarUrl } = require('../../utils/workerAvatars.js');

const mockWorkers = [
  {
    id: 1,
    name: "何志",
    region: "四川巴中",
    gender: "♂",
    serviceCount: 0,
    exp: 4,
    desc: "主要从事建筑回收，全品类建材可回收",
    tags: ["组长", "上门回收"],
    avatar: workerAvatarUrl(1)
  },
  {
    id: 2,
    name: "余静",
    region: "四川",
    gender: "♀",
    serviceCount: 1,
    exp: 20,
    desc: "我为人热情大方，乐于助人，喜欢家里整洁，给人舒适的感觉。",
    tags: ["擅长", "衣柜收纳", "宠物喂养", "陪护作业"],
    avatar: workerAvatarUrl(2)
  },
  {
    id: 3,
    name: "邓长超",
    region: "四川",
    gender: "♂",
    serviceCount: 0,
    exp: 0,
    desc: "可接送小孩、家政保洁、简单维修等上门服务。",
    tags: ["组长", "宠物喂养", "宠物搭遛", "衣柜干洗"],
    avatar: workerAvatarUrl(3)
  }
];

const mockGoods = [
  { id: 1,  name: "衣橱整理收纳（2小时）",  price: "196/份", image: listImageFromHome3("衣橱整理收纳（2小时）", images.svcTidyCloset) },
  { id: 57, name: "地毯深度清洗（1小时）",  price: "159/次", image: listImageFromHome3("地毯深度清洗（1小时）", images.svcCarpet) },
  { id: 14, name: "马桶疏通",               price: "158/次", image: listImageFromHome3("马桶疏通", images.svcRepairWater) }
];

Page({
  data: {
    navTopPadding: 20,
    worker: {},
    goods: []
  },
  async onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
    const id = Number((options && options.id) || 1) || 1;
    await this.loadData(id);
  },
  async loadData(id) {
    const worker = await this.loadWorker(id);
    this.setData({
      worker,
      goods: mockGoods
    });
  },
  async loadWorker(id) {
    try {
      const w = await util.get(`core/workers/${id}`);
      const normalized = this.normalizeWorker(w);
      if (normalized) return normalized;
    } catch (e) {}

    try {
      const list = await util.get('core/workers');
      const arr = Array.isArray(list) ? list : (list && list.data) || [];
      const found = arr.find(x => Number(x.id) === Number(id));
      const normalized = this.normalizeWorker(found);
      if (normalized) return normalized;
    } catch (e) {}

    return mockWorkers.find((w) => w.id === id) || mockWorkers[0] || {
      id,
      name: "技工",
      gender: "",
      region: "",
      serviceCount: 0,
      exp: 0,
      desc: "",
      avatar: workerAvatarUrl(id),
      tags: []
    };
  },
  normalizeWorker(w) {
    if (!w || typeof w !== 'object') return null;
    return {
      id: w.id,
      name: w.name || w.real_name || w.nickname || "技工",
      gender: w.gender || "",
      region: w.region || w.city || w.hometown || "",
      serviceCount: Number(w.serviceCount || w.service_count || w.orders || 0) || 0,
      exp: Number(w.exp || w.work_years || w.workExp || 0) || 0,
      desc: w.desc || w.resume || "",
      avatar: workerAvatarUrl(w.id),
      tags: Array.isArray(w.tags) ? w.tags : []
    };
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  },
  goBuy(e) {
    const id = Number(e.currentTarget.dataset.id || 0);
    wx.navigateTo({ url: `../service/service?id=${id || 1003}` });
  }
});
