const util = require('../../utils/util.js');
const { unwrapList, imgUrl } = util;
const images = require('../../utils/images.js');
const { listImageFromHome3 } = require('../../utils/serviceHome3.js');
const { workerAvatarUrl } = require('../../utils/workerAvatars.js');
const { pickWorkerAvatar, genderToLabel, FALLBACK_WORKER_ROWS, FALLBACK_WORKER_GOODS } = require('../../utils/workerApiMap.js');

const mockWorkers = FALLBACK_WORKER_ROWS.map(w => ({
  id: w.id,
  name: w.name,
  region: w.region || '',
  gender: w.gender || '',
  serviceCount: w.service_count || 0,
  exp: w.exp || 0,
  desc: w.desc || '',
  tags: Array.isArray(w.tags) ? w.tags : [],
  avatar: workerAvatarUrl(w.id)
}));

function getMockGoods(workerId) {
  const arr = FALLBACK_WORKER_GOODS[workerId] || FALLBACK_WORKER_GOODS[1] || [];
  return arr.map(g => ({
    id: g.id,
    name: g.name.replace(/【.*?】/g, '').trim() || g.name,
    price: String(g.price || '').replace('元', ''),
    image: listImageFromHome3(g.name, images.svcTidyCloset)
  }));
}

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
    let goods = getMockGoods(id);
    let reviews = [];
    let hasRealServices = false;
    try {
      const svcRes = await util.get(`core/workers/${id}/services`, { page: 1, limit: 30 });
      const arr = unwrapList(svcRes);
      if (Array.isArray(arr) && arr.length > 0) {
        hasRealServices = true;
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
    // 若后端无数据，尝试从本地存储读取该技工自行上架的服务
    if (!hasRealServices) {
      try {
        const localKey = 'worker_services_' + id;
        const localList = wx.getStorageSync(localKey) || [];
        if (Array.isArray(localList) && localList.length > 0) {
          goods = localList.map((s) => {
            const title = (s.name || '').replace(/【.*?】/g, '').trim();
            return {
              id: s.id,
              name: title || '服务项目',
              price: s.price || '',
              image: listImageFromHome3(title, images.svcTidyCloset)
            };
          });
        }
      } catch (e2) {
        console.log('读取本地服务失败', e2);
      }
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
      const app = getApp();
      const communityId = (app.globalData.user || {}).communityId;
      const params = { page: 1, limit: 50 };
      if (communityId != null && communityId !== '') {
        params.community_id = communityId;
      }
      let list = await util.get('core/workers', params);
      let arr = unwrapList(list);
      // 若带 community_id 过滤后未找到，尝试不带过滤拉取全部技工
      if (!arr.find((x) => Number(x.id) === Number(id)) && params.community_id != null) {
        console.log('[worker-detail] 带 community_id 未找到，尝试全量拉取');
        list = await util.get('core/workers', { page: 1, limit: 50 });
        arr = unwrapList(list);
      }
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
      w.main_skill ||
      (Array.isArray(w.tags) && w.tags.length ? w.tags[0] : '') ||
      '到家服务';
    const rawDesc = w.desc || w.resume || w.introduction || w.bio || w.intro || '';
    return {
      id: w.id,
      name: w.name || w.real_name || w.nickname || '技工',
      gender: genderToLabel(w.gender),
      region: w.region || w.city || w.hometown || '',
      serviceCount: Number(w.serviceCount || w.service_count || w.orders || 0) || 0,
      exp: Number(w.exp || w.work_years || w.workExp || 0) || 0,
      desc: rawDesc,
      mainDirection: String(mainDir).slice(0, 12),
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
