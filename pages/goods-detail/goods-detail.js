const util = require('../../utils/util.js');
const config = require('../../utils/config.js');
const browseFootprint = require('../../utils/browseFootprint.js');
const favoritesStore = require('../../utils/favoritesStore.js');

Page({
  data: {
    goodsId: '',
    goods: null,

    // ====== SKU 相关 ======
    skuPopup: {
      show: false,
      type: 'cart', // 'cart' 或 'buy'
      qty: 1
    },
    selectedSpecs: [], // 记录用户选中的各个规格 [ '大份', '偏甜' ]
    selectedSku: null, // 匹配到的小sku对象

    // ====== 门店专属购物车 ======
    cartPopup: {
      show: false
    },
    cartItems: [],
    cartTotalNum: 0,
    cartTotalPrice: '0.00',
    favorited: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ goodsId: options.id });
      this.loadGoodsDetail();
    } else {
      // 演示用兜底加载
      this.setData({ goodsId: '1001' });
      this.mockDetail();
    }
  },

  onShow() {
    if (this.data.goods) {
      this.syncCartFromStorage();
      const g = this.data.goods;
      const gid = g && (g.id != null ? g.id : this.data.goodsId);
      if (gid != null && gid !== '') {
        this.setData({ favorited: favoritesStore.has(`market_goods:${gid}`) });
      }
    }
  },

  // 获取商品配置
  async loadGoodsDetail() {
    wx.showLoading({ title: '加载中' });
    try {
      const res = await util.get('market/goods/detail', { id: this.data.goodsId });
      wx.hideLoading();
      this.processGoodsData(res.data || res);
    } catch (err) {
      wx.hideLoading();
      this.mockDetail();
    }
  },

  // 处理富文本与规格初始化
  processGoodsData(data) {
    // 1. 处理主图列表
    const rawImages = data.main_images || data.images || [];
    data.main_images = rawImages.map(url => util.imgUrl(url));

    // 2. 处理 SKU 列表中的图片
    if (data.sku_list && Array.isArray(data.sku_list)) {
      data.sku_list.forEach(sku => {
        if (sku.image) sku.image = util.imgUrl(sku.image);
      });
    }

    // 3. 处理详情富文本中的图片路径
    if (data.desc_html) {
      // 替换样式
      data.desc_html = data.desc_html.replace(/\<img/gi, '<img style="max-width:100%;height:auto;display:block;"');
      // 修复相对路径 /uploads/ -> https://.../uploads/
      const baseUrl = config.imageBaseUrl.replace(/\/$/, '');
      data.desc_html = data.desc_html.replace(/src=["']\/uploads\//gi, `src="${baseUrl}/uploads/`);
    }

    this.setData({ goods: data });

    try {
      const gid = data.id != null ? data.id : this.data.goodsId;
      if (gid != null && gid !== '') {
        const imgs = data.main_images || data.images || [];
        const raw = Array.isArray(imgs) && imgs[0] ? imgs[0] : '';
        const cover = raw ? util.imgUrl(raw) : '';
        const name = data.name || data.title || data.goods_name || '商品';
        browseFootprint.record({
          kind: 'market_goods',
          dedupeKey: `market_goods:${gid}`,
          title: name,
          cover,
          url: `/pages/goods-detail/goods-detail?id=${encodeURIComponent(String(gid))}`
        });
        this.setData({ favorited: favoritesStore.has(`market_goods:${gid}`) });
      }
    } catch (e) {}

    // 初始化默认全选首个规格
    if (data.sku_tree && data.sku_tree.length > 0) {
      let initialSpecs = data.sku_tree.map(g => g.items[0]);
      this.setData({ selectedSpecs: initialSpecs });
      this.matchSelectedSku();
    }

    // 后续拉取购物车
    this.syncCartFromStorage();
  },

  toggleFavorite() {
    const g = this.data.goods;
    if (!g) return;
    const gid = g.id != null ? g.id : this.data.goodsId;
    if (gid == null || gid === '') return;
    const imgs = g.main_images || g.images || [];
    const raw = Array.isArray(imgs) && imgs[0] ? imgs[0] : '';
    const cover = raw ? util.imgUrl(raw) : '';
    const name = g.name || g.title || g.goods_name || '商品';
    const key = `market_goods:${gid}`;
    const favorited = favoritesStore.toggle({
      kind: 'market_goods',
      dedupeKey: key,
      title: name,
      cover,
      url: `/pages/goods-detail/goods-detail?id=${encodeURIComponent(String(gid))}`
    });
    this.setData({ favorited });
    wx.showToast({ title: favorited ? '已加入收藏' : '已取消收藏', icon: 'none' });
  },

  // ==================== SKU 模块逻辑 ====================

  openSkuPopup(e) {
    const type = e.currentTarget.dataset.type || 'cart';
    this.setData({
      'skuPopup.show': true,
      'skuPopup.type': type,
      'skuPopup.qty': 1
    });
  },
  
  closeSkuPopup() {
    this.setData({ 'skuPopup.show': false });
  },

  selectSpec(e) {
    const { gidx, val } = e.currentTarget.dataset;
    let specs = [...this.data.selectedSpecs];
    specs[gidx] = val;
    this.setData({ selectedSpecs: specs });
    this.matchSelectedSku();
  },

  matchSelectedSku() {
    const { goods, selectedSpecs } = this.data;
    if (!goods.sku_list) return;
    const match = goods.sku_list.find(s => {
      // 对比数组里的每一项是否匹配
      return s.specs.length === selectedSpecs.length && s.specs.every((val, index) => val === selectedSpecs[index]);
    });
    this.setData({ selectedSku: match || null });
  },

  // 步进器
  stepMinus() {
    let qty = this.data.skuPopup.qty;
    if (qty > 1) {
      this.setData({ 'skuPopup.qty': qty - 1 });
    }
  },
  stepPlus() {
    let qty = this.data.skuPopup.qty;
    let max = this.data.selectedSku ? this.data.selectedSku.stock : 999;
    if (qty < max) {
      this.setData({ 'skuPopup.qty': qty + 1 });
    } else {
      wx.showToast({ title: '没有更多库存了', icon: 'none' });
    }
  },
  onQtyInput(e) {
    let val = parseInt(e.detail.value, 10);
    if (!val || val < 1) val = 1;
    let max = this.data.selectedSku ? this.data.selectedSku.stock : 999;
    if (val > max) val = max;
    this.setData({ 'skuPopup.qty': val });
  },

  confirmSku() {
    if (this.data.goods.sku_tree && this.data.goods.sku_tree.length > 0 && !this.data.selectedSku) {
      wx.showToast({ title: '请完整选择规格', icon: 'none' });
      return;
    }
    
    // 如果是无规格商品，造一个虚拟sku代表默认单品
    let skuToSave = this.data.selectedSku || {
      id: 'default_sku_' + this.data.goods.id,
      specs: ['默认款'],
      price: parseFloat(this.data.goods.price_range) || 0,
      stock: 999,
      image: this.data.goods.main_images[0]
    };

    let cartItem = {
      goodsId: this.data.goods.id,
      name: this.data.goods.name,
      skuId: skuToSave.id,
      specsText: skuToSave.specs.join(' / '),
      price: skuToSave.price,
      image: skuToSave.image || this.data.goods.main_images[0],
      quantity: this.data.skuPopup.qty
    };

    if (this.data.skuPopup.type === 'buy') {
      // 立即购买，直接把这一单传给确认页（跳过本地购物车缓存）
      this.closeSkuPopup();
      wx.setStorageSync('temp_checkout_items', [cartItem]);
      wx.navigateTo({ url: `/pages/goods-confrim/goods-confrim?shopId=${this.data.goods.shopId}&from=buyNow` });
    } else {
      // 加入购物车
      this.addCartLocal(cartItem);
      this.closeSkuPopup();
      wx.showToast({ title: '已加入购物袋', icon: 'success' });
    }
  },

  // ==================== 私有购物车模块逻辑 ====================

  toggleCartDrawer() {
    this.setData({ 'cartPopup.show': !this.data.cartPopup.show });
  },

  getCartStorageKey() {
    return `cart_${this.data.goods.shopId}`;
  },

  syncCartFromStorage() {
    if (!this.data.goods) return;
    const key = this.getCartStorageKey();
    const cart = wx.getStorageSync(key) || [];
    let num = 0;
    let price = 0;
    cart.forEach(item => {
      num += item.quantity;
      price += item.quantity * parseFloat(item.price);
    });
    this.setData({
      cartItems: cart,
      cartTotalNum: num,
      cartTotalPrice: price.toFixed(2)
    });
    if (cart.length === 0) {
      this.setData({ 'cartPopup.show': false });
    }
  },

  addCartLocal(cItem) {
    const key = this.getCartStorageKey();
    let cart = wx.getStorageSync(key) || [];
    let exist = cart.find(x => x.skuId === cItem.skuId && x.goodsId === cItem.goodsId);
    if (exist) {
      exist.quantity += cItem.quantity;
    } else {
      cart.push(cItem);
    }
    wx.setStorageSync(key, cart);
    this.syncCartFromStorage();
  },

  cartMinus(e) {
    const idx = e.currentTarget.dataset.idx;
    let cart = [...this.data.cartItems];
    if (cart[idx].quantity > 1) {
      cart[idx].quantity -= 1;
    } else {
      cart.splice(idx, 1);
    }
    wx.setStorageSync(this.getCartStorageKey(), cart);
    this.syncCartFromStorage();
  },

  cartPlus(e) {
    const idx = e.currentTarget.dataset.idx;
    let cart = [...this.data.cartItems];
    cart[idx].quantity += 1;
    wx.setStorageSync(this.getCartStorageKey(), cart);
    this.syncCartFromStorage();
  },

  clearCart() {
    wx.showModal({
      title: '清空购物车',
      content: '确定要清空这家店的购物车吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync(this.getCartStorageKey());
          this.syncCartFromStorage();
          this.setData({ 'cartPopup.show': false });
        }
      }
    });
  },

  checkoutCart() {
    if (this.data.cartItems.length === 0) return;
    wx.setStorageSync('temp_checkout_items', this.data.cartItems);
    this.setData({ 'cartPopup.show': false });
    wx.navigateTo({ url: `/pages/goods-confrim/goods-confrim?shopId=${this.data.goods.shopId}&from=cart` });
  },

  // ==================== 其他路由/跳转动作 ====================
  goShop() {
    wx.navigateTo({ url: `/pages/market-shop/market-shop?id=${this.data.goods.shopId}` });
  },
  callMerchant() {
    wx.showToast({ title: '联系商家工作台客服模块...', icon: 'none' });
  }
});