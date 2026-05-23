const util = require('../../utils/util.js');
const config = require('../../utils/config.js');
const browseFootprint = require('../../utils/browseFootprint.js');
const favoritesStore = require('../../utils/favoritesStore.js');
const userSession = require('../../utils/userSession.js');
const marketCart = require('../../utils/marketCartHelper.js');

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
    cartItemIdByGoodsId: {},
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
      this.syncCartFromRemote();
      const g = this.data.goods;
      const gid = g && (g.id != null ? g.id : this.data.goodsId);
      if (gid != null && gid !== '') {
        favoritesStore.has(Number(gid)).then(favorited => {
          this.setData({ favorited });
        });
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
        // 异步查询服务端收藏状态
        favoritesStore.has(Number(gid)).then(favorited => {
          this.setData({ favorited });
        });
      }
    } catch (e) {}

    // 初始化默认全选首个规格
    if (data.sku_tree && data.sku_tree.length > 0) {
      let initialSpecs = data.sku_tree.map(g => g.items[0]);
      this.setData({ selectedSpecs: initialSpecs });
      this.matchSelectedSku();
    }

    this.syncCartFromRemote();
  },

  async toggleFavorite() {
    const g = this.data.goods;
    if (!g) return;
    const gid = g.id != null ? g.id : this.data.goodsId;
    if (gid == null || gid === '') return;
    const shopId = g.shopId || g.shop_id;
    const favorited = await favoritesStore.toggle(Number(gid), shopId ? Number(shopId) : undefined);
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
      const shopId = this.data.goods && (this.data.goods.shopId || this.data.goods.shop_id);
      const goodsId = this.data.goods && (this.data.goods.id || this.data.goodsId);
      if (!wx.getStorageSync('token')) {
        if (!marketCart.ensureLogin()) return;
      }
      this.closeSkuPopup();
      wx.showLoading({ title: '加入中', mask: true });
      marketCart.addToCart({ shopId, goodsId, quantity: cartItem.quantity })
        .then(() => {
          wx.hideLoading();
          wx.showToast({ title: '已加入购物车', icon: 'success' });
          this.syncCartFromRemote();
        })
        .catch((e) => {
          wx.hideLoading();
          this.addCartLocal(cartItem);
          wx.showToast({ title: (e && (e.msg || e.errmsg)) || '已加入本地购物袋', icon: 'none' });
        });
    }
  },

  // ==================== 私有购物车模块逻辑 ====================

  toggleCartDrawer() {
    this.setData({ 'cartPopup.show': !this.data.cartPopup.show });
  },

  getCartStorageKey() {
    const shopId = this.data.goods && this.data.goods.shopId;
    return userSession.scopedStorageKey(`cart_${shopId || 'default'}`);
  },

  async syncCartFromRemote() {
    const g = this.data.goods;
    if (!g) return;
    const shopId = g.shopId || g.shop_id;
    if (!shopId || !wx.getStorageSync('token')) {
      this.syncCartFromStorage();
      return;
    }
    try {
      const { list } = await marketCart.fetchShopCart(shopId);
      const cart = [];
      const idMap = {};
      (list || []).forEach((it) => {
        const gid = Number(it.goods_id);
        if (!gid) return;
        idMap[gid] = it.id;
        const rawImg = (it.goods && (it.goods.image || it.goods.main_image)) || '';
        cart.push({
          goodsId: gid,
          name: (it.goods && (it.goods.name || it.goods.title)) || '',
          skuId: `default_${gid}`,
          specsText: '默认规格',
          price: Number((it.goods && it.goods.price) || 0),
          image: rawImg ? util.imgUrl(rawImg) : '',
          quantity: Number(it.quantity || 0),
          cartItemId: it.id
        });
      });
      wx.setStorageSync(this.getCartStorageKey(), cart);
      this.setData({ cartItemIdByGoodsId: idMap });
      this.syncCartFromStorage();
    } catch (e) {
      this.syncCartFromStorage();
    }
  },

  syncCartFromStorage() {
    if (!this.data.goods) return;
    const key = this.getCartStorageKey();
    const cart = wx.getStorageSync(key) || [];
    let num = 0;
    let price = 0;
    cart.forEach((item) => {
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

  async cartMinus(e) {
    const idx = e.currentTarget.dataset.idx;
    const cart = [...this.data.cartItems];
    const row = cart[idx];
    if (!row) return;
    const nextQty = row.quantity > 1 ? row.quantity - 1 : 0;
    if (row.cartItemId && wx.getStorageSync('token')) {
      try {
        await marketCart.updateItemQty(row.cartItemId, nextQty);
        await this.syncCartFromRemote();
        return;
      } catch (err) {
        wx.showToast({ title: (err && (err.msg || err.errmsg)) || '操作失败', icon: 'none' });
        return;
      }
    }
    if (row.quantity > 1) cart[idx].quantity -= 1;
    else cart.splice(idx, 1);
    wx.setStorageSync(this.getCartStorageKey(), cart);
    this.syncCartFromStorage();
  },

  async cartPlus(e) {
    const idx = e.currentTarget.dataset.idx;
    const cart = [...this.data.cartItems];
    const row = cart[idx];
    if (!row) return;
    if (row.cartItemId && wx.getStorageSync('token')) {
      try {
        await marketCart.updateItemQty(row.cartItemId, row.quantity + 1);
        await this.syncCartFromRemote();
        return;
      } catch (err) {
        wx.showToast({ title: (err && (err.msg || err.errmsg)) || '操作失败', icon: 'none' });
        return;
      }
    }
    cart[idx].quantity += 1;
    wx.setStorageSync(this.getCartStorageKey(), cart);
    this.syncCartFromStorage();
  },

  clearCart() {
    wx.showModal({
      title: '清空购物车',
      content: '确定要清空这家店的购物车吗？',
      success: async (res) => {
        if (!res.confirm) return;
        const shopId = this.data.goods && (this.data.goods.shopId || this.data.goods.shop_id);
        try {
          if (shopId && wx.getStorageSync('token')) {
            await marketCart.clearShopCart(shopId);
          }
        } catch (e) { /* ignore */ }
        wx.removeStorageSync(this.getCartStorageKey());
        this.syncCartFromStorage();
        this.setData({ 'cartPopup.show': false, cartItemIdByGoodsId: {} });
      }
    });
  },

  checkoutCart() {
    if (this.data.cartItems.length === 0) return;
    const shopId = this.data.goods.shopId || this.data.goods.shop_id;
    const shopName = this.data.goods.shopName || this.data.goods.shop_name || '';
    const checkoutStorage = require('../../utils/checkoutStorage.js');
    const goods = this.data.cartItems.map((it) => ({
      goodsId: it.goodsId,
      goodsPictureUrl: it.image,
      goodsName: it.name,
      goodsBrief: it.specsText || '默认规格',
      goodsRealPrice: Number(it.price) || 0,
      goodsNum: it.quantity
    }));
    const total = this.data.cartTotalPrice;
    checkoutStorage.saveCheckout({ goods, total, shopId, shopName });
    this.setData({ 'cartPopup.show': false });
    wx.navigateTo({ url: `/pages/goods-confrim/goods-confrim?from=local&shopId=${shopId}` });
  },

  // ==================== 其他路由/跳转动作 ====================
  goShop() {
    wx.navigateTo({ url: `/pages/market-shop/market-shop?id=${this.data.goods.shopId}` });
  },
  callMerchant() {
    wx.showToast({ title: '联系商家工作台客服模块...', icon: 'none' });
  }
});