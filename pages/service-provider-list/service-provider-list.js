const util = require('../../utils/util.js');
const { unwrapList } = util;
const app = getApp();

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=70',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=70',
];

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
    try {
      const gd = app.globalData || {};
      const communityId = gd.communityId || gd.community_id || wx.getStorageSync('community_id');
      const params = { limit: 30 };
      if (communityId) params.community_id = communityId;

      const res = await util.get('core/service-providers', params);
      const rows = unwrapList(res);
      const list = rows.map((p, i) => {
        const pid = p.id != null ? p.id : p.profile_id;
        const cover = p.cover_image || p.shop_front_url || p.avatar_url || p.avatar || '';
        return {
          id: pid,
          name: p.name || p.shop_name || '服务商',
          desc: p.description || p.subtitle || `${p.contact_name || ''} · 直约到家`,
          image: cover ? util.imgUrl(cover) : util.imgUrl(FALLBACK_COVERS[i % FALLBACK_COVERS.length]),
          phone: p.phone || '',
          url: `/pages/service-provider-shop/service-provider-shop?provider_id=${encodeURIComponent(pid)}`
        };
      });
      this.setData({ list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  goShop(e) {
    const url = e.currentTarget.dataset.url;
    if (url) wx.navigateTo({ url });
  }
});
