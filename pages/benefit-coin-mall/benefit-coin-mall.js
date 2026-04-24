const app = getApp();
const api = require('../../api/index.js');

Page({
  data: {
    balance: 0,
    goodsList: [],
    loading: false,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadBalance();
    this.loadGoods();
  },

  onPullDownRefresh() {
    this.loadBalance();
    this.loadGoods(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadGoods();
    }
  },

  async loadBalance() {
    try {
      const res = await api.benefitCoin.getBalance();
      const balance = res.balance || (res.data && res.data.balance) || 0;
      this.setData({ balance });
    } catch (e) {
      console.log('获取家事币余额失败', e);
      this.setData({ balance: 0 });
    }
  },

  async loadGoods(refresh = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    const page = refresh ? 1 : this.data.page;
    
    try {
      const res = await api.benefitCoin.getExchangeGoods({ page, page_size: 20 });
      const list = res.list || (res.data && res.data.list) || res.data || res || [];
      const hasMore = list.length >= 20;
      
      const goodsList = refresh ? list : [...this.data.goodsList, ...list];
      this.setData({
        goodsList,
        page: page + 1,
        hasMore,
        loading: false
      });
      wx.stopPullDownRefresh();
    } catch (e) {
      console.log('获取兑换商品失败', e);
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
      this.mockLoadGoods(refresh);
    }
  },

  mockLoadGoods(refresh) {
    const mockGoods = [
      { id: 1, name: '家事币定制保温杯', coins: 500, image: '/img/placeholders/home_cleaning.png', stock: 100 },
      { id: 2, name: '环保购物袋套装', coins: 200, image: '/img/placeholders/home_cleaning.png', stock: 50 },
      { id: 3, name: '社区服务体验券', coins: 1000, image: '/img/placeholders/home_cleaning.png', stock: 20 },
      { id: 4, name: '家政清洁工具包', coins: 800, image: '/img/placeholders/home_cleaning.png', stock: 30 }
    ];
    
    this.setData({
      goodsList: refresh ? mockGoods : [...this.data.goodsList, ...mockGoods],
      page: refresh ? 2 : this.data.page + 1,
      hasMore: false,
      loading: false
    });
  },

  goDetail(e) {
    const goodsId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/benefit-coin-detail/benefit-coin-detail?goodsId=${goodsId}` });
  }
});
