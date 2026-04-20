const lp = require('../../utils/localPrefs.js');
const util = require('../../utils/util.js');
const { unwrapList, imgUrl } = util;

Page({
  data: {
    keyword: '',
    history: [],
    guess: [],
    results: [],
    searched: false,
    shopId: 0
  },
  onLoad(options) {
    const shopId = Number(options.shopId || 0);
    this.setData({ shopId });
  },
  onShow() {
    this.setData({
      history: lp.getSearchHistory(),
      guess: lp.getRecentGoods()
    });
  },
  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },
  clearHistory() {
    lp.clearSearchHistory();
    this.setData({ history: [] });
  },
  useKw(e) {
    const keyword = e.currentTarget.dataset.kw;
    this.setData({ keyword }, () => this.doSearch());
  },
  goGoods(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/goods-detail/goods-detail?id=${id}` });
  },
  async doSearch() {
    const keyword = (this.data.keyword || '').trim();
    if (!keyword) {
      wx.showToast({ title: '请输入关键词', icon: 'none' });
      return;
    }
    lp.addSearchHistory(keyword);
    this.setData({ history: lp.getSearchHistory(), searched: true });
    const sid = this.data.shopId;
    try {
      let res;
      if (sid) {
        try {
          res = await util.get(`market/shop/${sid}/goods`, { keyword, page: 1, limit: 50 });
        } catch (e1) {
          res = await util.get('market/merchant/goods', { shop_id: sid, keyword, page: 1, limit: 50 });
        }
      } else {
        try {
          res = await util.get('market/merchant/goods', { keyword, page: 1, limit: 50 });
        } catch (e2) {
          res = await util.get('market/shop/goods', { keyword, page: 1, limit: 50 });
        }
      }
      const raw = unwrapList(res);
      const results = (raw || []).map((g) => ({
        id: g.id,
        name: g.name || g.title || g.goods_title || '商品',
        price: g.price != null ? g.price : g.sale_price,
        image: g.image || g.cover || g.main_image ? imgUrl(g.image || g.cover || g.main_image) : ''
      }));
      this.setData({ results });
    } catch (e) {
      this.setData({ results: [] });
      wx.showToast({ title: '未搜索到商品', icon: 'none' });
    }
  }
});
