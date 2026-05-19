const util = require('../../utils/util.js');
const {
  getActiveCommunityId,
  fetchServiceProviderRows,
  mapServiceProviderForHomeCard
} = require('../../utils/communityPortal.js');

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=70'
];

Page({
  data: {
    list: [],
    loading: true
  },

  onLoad() {
    this.load();
  },

  onShow() {
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    this.setData({ loading: true });
    const communityId = getActiveCommunityId(getApp());
    try {
      const rows = await fetchServiceProviderRows(communityId, { limit: 30 });
      const list = rows.map((p, i) => {
        const card = mapServiceProviderForHomeCard(p, util.imgUrl);
        if (!card.image) {
          card.image = util.imgUrl(FALLBACK_COVERS[i % FALLBACK_COVERS.length]);
        }
        card.desc = p.description || p.subtitle || `${p.contact_name || ''} · 直约到家`;
        card.phone = p.phone || '';
        return card;
      });
      this.setData({ list, loading: false });
    } catch (e) {
      this.setData({ loading: false, list: [] });
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
    }
  },

  goShop(e) {
    const url = e.currentTarget.dataset.url;
    if (url) wx.navigateTo({ url });
  }
});
