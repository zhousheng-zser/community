const util = require('../../utils/util.js');
const { unwrapList, imgUrl } = util;
const images = require('../../utils/images.js');
const { listImageFromHome3 } = require('../../utils/serviceHome3.js');
const browseFootprint = require('../../utils/browseFootprint.js');
const { workerAvatarUrl } = require('../../utils/workerAvatars.js');
const { pickWorkerAvatar, genderToLabel, FALLBACK_WORKER_ROWS, FALLBACK_WORKER_GOODS } = require('../../utils/workerApiMap.js');
const { getActiveCommunityId, fetchWorkerRows, workerCommunityQuery } = require('../../utils/communityPortal.js');

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
    const raw = options && options.id != null && options.id !== '' ? String(options.id) : '';
    const id = raw || '1';
    await this.loadData(id);
  },
  async loadData(id) {
    const workerId = String(id);
    const communityId = getActiveCommunityId(getApp());
    const commQ = workerCommunityQuery(communityId);
    const worker = await this.loadWorker(workerId);
    const isRealWorker = worker && String(worker.id || '').length > 10;
    let goods = [];
    let reviews = [];
    let hasRealServices = false;
    if (!isRealWorker) {
      goods = getMockGoods(id);
    }
    if (!communityId && isRealWorker) {
      wx.showToast({ title: '请先绑定小区', icon: 'none' });
    }
    try {
      const svcRes = await util.get(`core/workers/${workerId}/services`, { page: 1, limit: 30, ...commQ });
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
    // 若后端无数据，尝试从本地存储读取该技工自行上架的服务（仅真实账号）
    if (!hasRealServices && isRealWorker) {
      try {
        const localKey = 'worker_services_' + workerId;
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
      const revRes = await util.get(`core/workers/${workerId}/reviews`, { page: 1, limit: 20, ...commQ });
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
    try {
      if (worker && worker.id != null) {
        browseFootprint.record({
          kind: 'worker',
          dedupeKey: `worker:${worker.id}`,
          title: worker.name || '技工',
          cover: worker.avatar || '',
          url: `/pages/worker-detail/worker-detail?id=${encodeURIComponent(String(worker.id))}`
        });
      }
    } catch (e) {}
  },
  async loadWorker(id) {
    const workerId = String(id);
    const communityId = getActiveCommunityId(getApp());
    const commQ = workerCommunityQuery(communityId);
    const isSnowflakeId = workerId.length > 10;

    if (communityId != null) {
      try {
        const w = await util.get(`core/workers/${workerId}`, commQ);
        const normalized = this.normalizeWorker(w);
        if (normalized) return normalized;
      } catch (e) {}

      try {
        const rows = await fetchWorkerRows(communityId, { page: 1, limit: 50 });
        const found = rows.find((x) => String(x.id) === workerId);
        const normalized = this.normalizeWorker(found);
        if (normalized) return normalized;
      } catch (e) {}
    }

    if (isSnowflakeId) {
      return {
        id: workerId,
        name: '技工',
        gender: '',
        region: '',
        serviceCount: 0,
        exp: 0,
        desc: communityId == null ? '请先绑定小区后查看' : '该技工不在当前小区',
        avatar: workerAvatarUrl(workerId),
        tags: []
      };
    }

    return mockWorkers.find((w) => String(w.id) === workerId) || mockWorkers[0] || {
      id: workerId,
      name: "技工",
      gender: "",
      region: "",
      serviceCount: 0,
      exp: 0,
      desc: "",
      avatar: workerAvatarUrl(workerId),
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
      id: w.id != null ? String(w.id) : '',
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
    const sid = e.currentTarget.dataset.id;
    const wid = this.data.worker && this.data.worker.id;
    if (sid == null || sid === '') return wx.showToast({ title: '服务无效', icon: 'none' });
    let url = `../service/service?id=${encodeURIComponent(String(sid))}`;
    if (wid) url += `&worker_id=${encodeURIComponent(String(wid))}`;
    wx.navigateTo({ url });
  }
});
