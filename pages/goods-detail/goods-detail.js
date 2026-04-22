const util = require('../../utils/util.js');

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
    cartTotalPrice: '0.00'
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
    // 每次显示时重新计算该店购物车
    if (this.data.goods) {
      this.syncCartFromStorage();
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
    if (data.desc_html) {
      data.desc_html = data.desc_html.replace(/\<img/gi, '<img style="max-width:100%;height:auto;display:block;"');
    }
    this.setData({ goods: data });

    // 初始化默认全选首个规格
    if (data.sku_tree && data.sku_tree.length > 0) {
      let initialSpecs = data.sku_tree.map(g => g.items[0]);
      this.setData({ selectedSpecs: initialSpecs });
      this.matchSelectedSku();
    }

    // 后续拉取购物车
    this.syncCartFromStorage();
  },

  mockDetail() {
    this.processGoodsData({
      id: 1001,
      shopId: 88,
      shopName: "多宝严选超市 (高新店)",
      name: "[演示商品] 进口巨无霸多规格生鲜大礼包",
      main_images: ["/img/placeholders/home_cleaning.png", "/img/placeholders/home_cleaning.png"],
      price_range: "20.00 - 45.00",
      sales: 1205,
      desc_html: "<p>这里是从服务端下发的超长<strong>富文本介绍</strong>。</p><p>支持显示非常复杂的商品视频和排版结构。</p>",
      sku_tree: [ 
        { group: "规格大小", items: ["大份装", "迷你装"] },
        { group: "新鲜度档位", items: ["即食", "绿果需催熟"] }
      ],
      sku_list: [
        { id: "sku_1", specs: ["大份装", "即食"], price: "45.00", stock: 100, image: "/img/placeholders/home_cleaning.png" },
        { id: "sku_2", specs: ["大份装", "绿果需催熟"], price: "42.00", stock: 50, image: "/img/placeholders/home_cleaning.png" },
        { id: "sku_3", specs: ["迷你装", "即食"], price: "22.00", stock: 80, image: "/img/placeholders/home_cleaning.png" },
        { id: "sku_4", specs: ["迷你装", "绿果需催熟"], price: "20.00", stock: 10, image: "/img/placeholders/home_cleaning.png" }
      ]
    });
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