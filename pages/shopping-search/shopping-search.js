const util = require('../../utils/util.js');

Page({
  data: {
    keyword: '',
    searchMode: 'goods', // 'goods' | 'shop'
    activeSort: 'smart', // 'smart' | 'rating' | 'price_asc' | 'sales'
    searched: false,
    history: [],
    guess: [],
    results: []
  },

  onLoad(options) {
    const history = wx.getStorageSync('mall_search_history') || [];
    this.setData({ history });

    if (options.kw) {
      this.setData({ keyword: decodeURIComponent(options.kw) });
      this.doSearch();
    }

    // 初始化时加载最近浏览或猜你喜欢
    this.loadGuess();
  },

  toggleSearchMode() {
    const nextMode = this.data.searchMode === 'goods' ? 'shop' : 'goods';
    this.setData({ searchMode: nextMode });
    if (this.data.searched) {
      this.doSearch();
    }
  },

  switchSort(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.activeSort) return;
    this.setData({ activeSort: key });
    this.doSearch();
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value, searched: false });
  },

  useKw(e) {
    this.setData({ keyword: e.currentTarget.dataset.kw });
    this.doSearch();
  },

  clearHistory() {
    wx.removeStorageSync('mall_search_history');
    this.setData({ history: [] });
  },

  loadGuess() {
    // 模拟或调用最近浏览的拉取逻辑
    const guess = [
      { id: 1001, name: "居家常备好物", image: "https://120.27.239.244:3001/uploads/file-1773395942165-45947155.png" },
      { id: 1002, name: "智能保温杯", image: "https://120.27.239.244:3001/uploads/file-1773395942165-45947155.png" }
    ];
    this.setData({ guess });
  },

  doSearch() {
    const kw = this.data.keyword.trim();
    if (!kw) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' });
      return;
    }

    // 更新历史
    let history = this.data.history;
    history = history.filter(h => h !== kw);
    history.unshift(kw);
    if (history.length > 10) history = history.slice(0, 10);
    wx.setStorageSync('mall_search_history', history);
    this.setData({ history, searched: true });

    wx.showLoading({ title: '搜索中...' });

    // 假数据拼凑请求结构 (后对接：api/market/search)
    let payload = {
      keyword: kw,
      type: this.data.searchMode,
      sort: this.data.activeSort,
      page: 1,
      page_size: 20
    };

    util.get('api/market/search', payload).then(data => {
      wx.hideLoading();
      this.setData({ results: data.list || [] });
    }).catch(err => {
      wx.hideLoading();
      // 在无接口时展示假数据预览
      this.mockResults();
    });
  },

  mockResults() {
    // 用于演示目的的桩数据展示
    if (this.data.searchMode === 'goods') {
      this.setData({
        results: [
          { id: 200, name: `[商品] 搜索到的 ${this.data.keyword}`, price: "59.90", origPrice: "99.00", sales: 456, image: "https://120.27.239.244:3001/uploads/file-1773395942165-45947155.png" },
          { id: 201, name: "本地土鸡蛋30枚", price: "29.90", sales: 2011, image: "https://120.27.239.244:3001/uploads/file-1773395942165-45947155.png" }
        ]
      });
    } else {
      this.setData({
        results: [
          {
            id: 88,
            name: `${this.data.keyword} 专营店`,
            type: "官方旗舰店",
            followers: 12500,
            image: "https://120.27.239.244:3001/uploads/file-1773395942165-45947155.png",
            goods: [{ image: "https://120.27.239.244:3001/uploads/file-1773395942165-45947155.png" }, { image: "https://120.27.239.244:3001/uploads/file-1773395942165-45947155.png" }]
          }
        ]
      });
    }
  },

  goGoods(e) {
    wx.navigateTo({ url: `/pages/goods-detail/goods-detail?id=${e.currentTarget.dataset.id}` });
  },

  goShop(e) {
    wx.navigateTo({ url: `/pages/market-shop/market-shop?id=${e.currentTarget.dataset.id}` });
  }
});
