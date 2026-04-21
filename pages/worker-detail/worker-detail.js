const util = require('../../utils/util.js');
const { unwrapList, imgUrl } = util;
const images = require('../../utils/images.js');
const { listImageFromHome3 } = require('../../utils/serviceHome3.js');
const { workerAvatarUrl } = require('../../utils/workerAvatars.js');
const { pickWorkerAvatar } = require('../../utils/workerApiMap.js');

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
    goods: [],
    reviews: [],
    reviewCount: 0
  },
  async onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
    const id = Number((options && options.id) || 1) || 1;
    await this.loadData(id);
  },
  async loadData(id) {
    const worker = await this.loadWorker(id);
    let goods = mockGoods.map((g) => Object.assign({}, g));
    let reviews = [];
    try {
      const svcRes = await util.get(`core/workers/${id}/services`, { page: 1, limit: 30 });
      const arr = unwrapList(svcRes);
      if (Array.isArray(arr) && arr.length > 0) {
        goods = arr.map((s) => {
          const title = (s.title || s.name || '').replace(/【.*?】/g, '').trim();
          const priceRaw = s.price != null ? s.price : '';
          const price =
            typeof priceRaw === 'number'
              ? `${priceRaw}/次`
              : String(priceRaw || '');
          return {
            id: s.id || s.service_id,
            name: title || '服务项目',
            price,
            image: listImageFromHome3(
              title,
              s.cover_image ? imgUrl(s.cover_image) : images.svcTidyCloset
            )
          };
        });
      }
    } catch (e) {
      console.log('core/workers/:id/services 未就绪', e);
    }

    try {
      const revRes = await util.get(`core/workers/${id}/reviews`, { page: 1, limit: 20 });
      const rarr = unwrapList(revRes);
      reviews = (Array.isArray(rarr) ? rarr : []).map((r) => ({
        id: r.id,
        score: r.score != null ? r.score : r.rating || 5,
        content: r.content || r.text || '',
        author: (r.user && (r.user.nickname || r.user.name)) || r.nickname || '用户',
        time: r.created_at || r.createdAt || ''
      }));
    } catch (e2) {
      console.log('core/workers/:id/reviews 未就绪', e2);
    }

    this.setData({
      worker,
      goods,
      reviews,
      reviewCount: reviews.length
    });
  },
  async loadWorker(id) {
    try {
      const w = await util.get(`core/workers/${id}`);
      const normalized = this.normalizeWorker(w);
      if (normalized) return normalized;
    } catch (e) {}

    try {
      const list = await util.get('core/workers', { page: 1, limit: 50 });
      const arr = unwrapList(list);
      const found = arr.find((x) => Number(x.id) === Number(id));
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
    const mainDir =
      w.main_direction ||
      w.specialty ||
      (Array.isArray(w.tags) && w.tags.length ? w.tags[0] : '') ||
      '';
    return {
      id: w.id,
      name: w.name || w.real_name || w.nickname || "技工",
      gender: w.gender || "",
      region: w.region || w.city || w.hometown || "",
      serviceCount: Number(w.serviceCount || w.service_count || w.orders || 0) || 0,
      exp: Number(w.exp || w.work_years || w.workExp || 0) || 0,
      desc: w.desc || w.resume || w.introduction || "",
      mainDirection: mainDir,
      avatar: pickWorkerAvatar(w),
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
    const sid = Number(e.currentTarget.dataset.id || 0);
    const wid = this.data.worker && this.data.worker.id;
    if (!sid) return wx.showToast({ title: '服务无效', icon: 'none' });
    let url = `../service/service?id=${sid}`;
    if (wid) url += `&worker_id=${wid}`;
    wx.navigateTo({ url });
  }
});
