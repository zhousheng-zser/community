const util = require('../../utils/util.js');
const favoritesStore = require('../../utils/favoritesStore.js');

Page({
  data: {
    list: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    total: 0,
    loggedIn: false,
    isLocal: false   // true = API 未就绪，使用本地 Storage 临时存储
  },

  onShow() {
    const loggedIn = favoritesStore.isLoggedIn();
    this.setData({ loggedIn });
    if (loggedIn) {
      // 每次进入页面都从第一页刷新
      this.setData({ page: 1, list: [], hasMore: true });
      this.loadList(true);
    } else {
      this.setData({ loading: false, list: [] });
    }
  },

  async loadList(reset = false) {
    if (this.data.loading && !reset) return;
    if (!this.data.hasMore && !reset) return;

    this.setData({ loading: reset, loadingMore: !reset });

    const page = reset ? 1 : this.data.page;
    const { list, total, isLocal } = await favoritesStore.fetchList({
      page,
      page_size: this.data.pageSize
    });
    this.setData({ isLocal });

    // 将商品图片路径转换为完整 CDN 路径
    const normalizedList = list.map(item => {
      const good = item.good || {};
      const shop = item.shop || {};
      // 获取商品封面：主图数组第一张或 cover_url
      let cover = '';
      const mainImages = good.main_images || good.images || [];
      if (Array.isArray(mainImages) && mainImages[0]) {
        cover = util.imgUrl(mainImages[0]);
      } else if (good.cover_url) {
        cover = util.imgUrl(good.cover_url);
      }
      return {
        goodsId: item.goods_id,
        shopId: item.shop_id,
        recordId: item.id,
        goodsName: good.name || good.title || good.goods_name || '商品',
        cover,
        price: good.price || good.goods_price || '',
        status: good.status,        // 0=下架 1=上架，用于展示「已下架」提示
        shopName: shop.name || shop.shop_name || '',
        shopLogo: shop.logo_url ? util.imgUrl(shop.logo_url) : '',
        createdAt: item.created_at || ''
      };
    });

    const newList = reset ? normalizedList : [...this.data.list, ...normalizedList];
    const hasMore = newList.length < total;

    this.setData({
      list: newList,
      total,
      page: page + 1,
      hasMore,
      loading: false,
      loadingMore: false
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadList(false);
    }
  },

  goGoods(e) {
    const { goodsId, shopId, cover, goodsName, price } = e.currentTarget.dataset;
    if (!goodsId) return;
    wx.navigateTo({
      url: `/pages/push-product-detail/push-product-detail` +
        `?id=${goodsId}` +
        `&shopId=${shopId || ''}` +
        `&image=${encodeURIComponent(cover || '')}` +
        `&name=${encodeURIComponent(goodsName || '')}` +
        `&price=${encodeURIComponent(price || '')}`
    });
  },

  async onRemove(e) {
    const { goodsId } = e.currentTarget.dataset;
    if (!goodsId) return;
    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏该商品吗？',
      success: async (res) => {
        if (!res.confirm) return;
        const ok = await favoritesStore.remove(goodsId);
        if (ok) {
          // 从列表中移除，不需要重新请求
          const list = this.data.list.filter(item => String(item.goodsId) !== String(goodsId));
          this.setData({ list, total: this.data.total - 1 });
          wx.showToast({ title: '已取消收藏', icon: 'success' });
        }
      }
    });
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  }
});
