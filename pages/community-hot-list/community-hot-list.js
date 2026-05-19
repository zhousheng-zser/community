const util = require('../../utils/util.js');
const config = require('../../utils/config.js');
const images = require('../../utils/images.js');
const { resolveServiceListImage } = require('../../utils/serviceHome3.js');
const { unwrapList, imgUrl } = util;

const HOT_RANK_FALLBACK = ['NO.1', 'NO.2', 'NO.3', 'NO.4', 'NO.5', 'NO.6', 'NO.7', 'NO.8', 'NO.9', 'NO.10'];
const HOT_IMAGE_FALLBACK_POOL = [
  images.hotClean,
  images.hotWasher,
  images.hotHeater,
  images.hotHood,
  '/img/home_categories/tidy.png',
  '/img/home_categories/urgent_fix.png',
  '/img/home_categories/appliance_clean.png'
];

function mapHotRows(rows, limit) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const slice = limit > 0 ? rows.slice(0, limit) : rows;
  return slice.map((s, i) => {
    const rawTitle = s.title || s.name || '';
    const title = rawTitle.replace(/【.*?】/g, '').trim();
    const it = String(s.item_type || 'service').toLowerCase();
    const resolved = resolveServiceListImage(rawTitle, s.cover_image, null);
    const fallbackImage = imgUrl(HOT_IMAGE_FALLBACK_POOL[i % HOT_IMAGE_FALLBACK_POOL.length] || images.hotClean);
    return {
      id: s.id,
      itemType: it === 'shop' ? 'shop' : 'service',
      name: title || '热门项',
      price: String(s.price != null ? s.price : ''),
      image: resolved || fallbackImage,
      rank: s.rank != null && s.rank !== '' ? String(s.rank) : (HOT_RANK_FALLBACK[i] || '热门')
    };
  });
}

Page({
  data: {
    list: [],
    loading: true
  },

  onLoad() {
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    this.setData({ loading: true });
    const app = getApp();
    const communityId = (app.globalData && app.globalData.user && app.globalData.user.communityId) || wx.getStorageSync('community_id');
    let rows = [];

    if (!config.useCuratedHomeHotList) {
      try {
        const q = { limit: 20 };
        if (communityId != null && communityId !== '') q.community_id = communityId;
        const commRes = await util.get('core/community/hot', q);
        const services = commRes && (commRes.services || commRes.service_list);
        if (Array.isArray(services) && services.length > 0) {
          rows = services;
        } else {
          const flat = unwrapList(commRes);
          if (flat.length > 0) rows = flat;
        }
      } catch (e) {
        console.log('core/community/hot 不可用', e);
      }
      if (rows.length === 0) {
        try {
          const hotQ = { limit: 20 };
          if (communityId != null && communityId !== '') hotQ.community_id = communityId;
          const hotRes = await util.get('core/services/hot', hotQ);
          rows = unwrapList(hotRes);
        } catch (e2) {
          console.log('core/services/hot 不可用', e2);
        }
      }
    }

    const list = mapHotRows(rows, 20);
    this.setData({ list, loading: false });
  },

  goDetail(e) {
    const { id, type } = e.currentTarget.dataset;
    if (!id) return;
    const url = type === 'shop'
      ? `../market-shop/market-shop?id=${id}`
      : `../service/service?id=${id}`;
    wx.navigateTo({ url });
  }
});
