const util = require('../../utils/util.js');
const { imgUrl, pickMarketShopAvatarPath, flattenMarketShopPayload } = util;

Page({
  data: {
    navTopPadding: 20,
    shop: {},
    activeTab: "goods",
    categories: [],
    
    // 双向联动相关
    activeCategoryKey: "", // 当前左侧高亮的分类 key
    targetViewId: "",      // 点击左侧时右侧要跳转的元素的 id
    goodsGroupList: [],    // 转换后的商品列表数据（带分类头）
    groupTops: [],         // 每个分类模块的顶部高度（用于滚动监听）

    // 购物车相关
    cart: {},              // 购物车数据映射表 { goodsId: quantity }
    cartList: [],          // 购物车弹窗列表（数组）
    cartItemIdByGoodsId: {}, // 服务端购物车 itemId 映射 { goodsId: itemId }
    currentShopId: 0,
    shopLoadError: false,
    shopErrorMsg: '',
    useRemoteCart: false,  // 是否已成功启用服务端购物车
    cartCount: 0,
    totalAmount: "0.00",
    showCartPopup: false
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    const id = Number(options.id || 0);
    if (!id) {
      this.setData({
        navTopPadding: (sys.statusBarHeight || 20) + 8,
        shopLoadError: true,
        shopErrorMsg: '缺少店铺参数',
        currentShopId: 0
      });
      return;
    }
    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 8,
      shopLoadError: false,
      currentShopId: id,
      shop: {
        name: '加载中…',
        cover: imgUrl('/img/placeholders/home_cleaning.png'),
        logo: imgUrl('/img/placeholders/home_cleaning.png'),
        scoreText: '—',
        soldCount: '—',
        deliveryType: '—',
        businessHours: '',
        notice: ''
      },
      categories: [],
      goodsGroupList: [],
      activeCategoryKey: ''
    });
    this.loadShopFromApi(id);
  },
  extractList(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.list)) return payload.list;
    if (payload && payload.data && Array.isArray(payload.data.list)) return payload.data.list;
    if (payload && payload.data && Array.isArray(payload.data)) return payload.data;
    return [];
  },
  /** 从当前右侧商品列表按 id 取展示用单价等信息（购物车接口可能不返回 price） */
  findGoodsMetaById(goodsId) {
    const gid = Number(goodsId);
    if (!gid) return null;
    const groups = this.data.goodsGroupList || [];
    for (let i = 0; i < groups.length; i++) {
      const items = groups[i].items || [];
      for (let j = 0; j < items.length; j++) {
        if (Number(items[j].id) === gid) {
          return { ...items[j] };
        }
      }
    }
    return null;
  },

  /** 合并接口购物车行与本地商品价：避免 sync 覆盖后 totalAmount 变 0 */
  mergeCartLineFromApi(it, goodsId) {
    const meta = this.findGoodsMetaById(goodsId) || {};
    const fromApi =
      it.price != null && it.price !== ''
        ? it.price
        : it.goods_price != null && it.goods_price !== ''
          ? it.goods_price
          : it.pay_price != null && it.pay_price !== ''
            ? it.pay_price
            : it.unit_price != null && it.unit_price !== ''
              ? it.unit_price
              : null;
    const priceStr =
      fromApi != null && fromApi !== ''
        ? String(fromApi)
        : meta.price != null && meta.price !== ''
          ? String(meta.price)
          : '0';
    const oldPriceStr =
      it.origin_price != null && it.origin_price !== ''
        ? String(it.origin_price)
        : it.old_price != null && it.old_price !== ''
          ? String(it.old_price)
          : meta.oldPrice != null
            ? String(meta.oldPrice)
            : priceStr;
    return {
      id: goodsId,
      name: it.goods_name || it.name || meta.name || '精选商品',
      desc: it.goods_desc || it.desc || meta.desc || '',
      sold: it.sold || meta.sold || '',
      price: priceStr,
      oldPrice: oldPriceStr,
      image: imgUrl(it.main_image || it.image || meta.image || '/img/placeholders/home_cleaning.png'),
      quantity: Number(it.quantity || 0)
    };
  },

  buildGoodsGroups(categories, goodsList) {
    const grouped = {};
    goodsList.forEach((g) => {
      const key = g.category_key || g.categoryKey || 'default';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        id: g.id || g.goods_id,
        name: g.name || g.goods_name || '精选商品',
        desc: g.description || g.desc || '',
        sold: `已售${Number(g.sold_count || 0)}`,
        price: String(g.price || 0),
        oldPrice: String(g.origin_price || g.old_price || g.price || 0),
        image: imgUrl(g.main_image || g.image || '/img/placeholders/home_cleaning.png')
      });
    });

    let baseCats = categories.map((c) => ({
      key: c.category_key || c.key,
      name: c.category_name || c.name
    })).filter(c => c.key);

    if (baseCats.length === 0) {
      baseCats = Object.keys(grouped).map((key) => ({ key, name: key }));
    }

    return baseCats.map((cat, index) => ({
      ...cat,
      id: `cat_${index}`,
      items: grouped[cat.key] || []
    })).filter(cat => cat.items.length > 0);
  },
  async loadShopFromApi(id) {
    try {
      const shopRes = await util.get(`market/shops/${id}`);
      const shopRaw = shopRes && shopRes.data ? shopRes.data : shopRes;
      const shopData = flattenMarketShopPayload(shopRaw);
      if (!shopData || !shopData.id) {
        this.setData({ shopLoadError: true, shopErrorMsg: '店铺不存在或已下架' });
        return;
      }

      const [categoriesRes, goodsRes] = await Promise.all([
        util.get(`market/shops/${id}/categories`),
        util.get(`market/shops/${id}/goods`, { page: 1, page_size: 200 })
      ]);

      const categories = this.extractList(categoriesRes);
      const goodsList = this.extractList(goodsRes);
      const goodsGroupList = this.buildGoodsGroups(categories, goodsList);

      const firstCategoryKey = goodsGroupList[0] ? goodsGroupList[0].key : '';
      const shop = {
        id: shopData.id,
        cover: imgUrl(shopData.cover_url || shopData.cover || '/img/placeholders/home_cleaning.png'),
        logo: imgUrl(pickMarketShopAvatarPath(shopData) || '/img/placeholders/home_cleaning.png'),
        name: shopData.name || shopData.shop_name || '社区店铺',
        scoreText: String(shopData.rating || '4.8'),
        soldCount: String(shopData.sold_count || 0),
        deliveryType: shopData.delivery_type_text || shopData.delivery_type || '邻工配送',
        businessHours: shopData.business_hours || '09:00~22:00',
        notice: shopData.notice || '欢迎光临',
        phone: shopData.contact_phone || '',
        shopAddress: shopData.address || '',
        facadeImage: imgUrl(shopData.facade_image || '/img/placeholders/home_cleaning.png'),
        interiorImage: imgUrl(shopData.interior_image || '/img/placeholders/home_cleaning.png'),
        licenseImage: imgUrl(shopData.license_image || '/img/placeholders/home_cleaning.png')
      };

      this.setData({
        shop,
        categories: goodsGroupList,
        goodsGroupList,
        activeCategoryKey: firstCategoryKey,
        targetViewId: '',
        currentShopId: shop.id,
        shopLoadError: false
      }, () => {
        this.syncCartFromApi(shop.id);
      });

      setTimeout(() => this.calculateGroupTops(), 200);
    } catch (e) {
      console.log('店铺详情接口不可用', e);
      this.setData({ shopLoadError: true, shopErrorMsg: '暂时无法获取店铺信息' });
    }
  },
  rebuildCartDerived(cart) {
    const cartList = Object.values(cart || {});
    const cartCount = cartList.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    const totalAmount = cartList.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0).toFixed(2);
    this.setData({ cart, cartList, cartCount, totalAmount });
  },
  async syncCartFromApi(shopId) {
    const sid = Number(shopId || this.data.currentShopId);
    if (!sid) return;
    try {
      const res = await util.get('market/cart', { shop_id: sid });
      const list = this.extractList(res);
      if (!Array.isArray(list)) return;

      const cart = {};
      const cartItemIdByGoodsId = {};
      list.forEach((it) => {
        const goodsId = Number(it.goods_id || it.goodsId || it.id);
        if (!goodsId) return;
        const itemId = Number(it.cart_item_id || it.item_id || it.id);
        if (itemId) cartItemIdByGoodsId[goodsId] = itemId;
        cart[goodsId] = this.mergeCartLineFromApi(it, goodsId);
      });

      this.setData({ useRemoteCart: true, cartItemIdByGoodsId });
      this.rebuildCartDerived(cart);
    } catch (e) {
      // 接口不可用时维持本地购物车逻辑
      this.setData({ useRemoteCart: false });
    }
  },
  async ensureRemoteCartItem(goodsId, quantity, itemPayload) {
    const sid = Number(this.data.currentShopId);
    const gid = Number(goodsId);
    if (!sid || !gid) throw new Error('invalid shopId/goodsId');

    const itemId = this.data.cartItemIdByGoodsId[gid];
    if (itemId) {
      await util.put(`market/cart/items/${itemId}`, { quantity });
      return { itemId };
    }
    const created = await util.post('market/cart/items', { shop_id: sid, goods_id: gid, quantity });
    const newItemId = Number((created && created.id) || (created && created.item_id));
    if (newItemId) {
      this.setData({ cartItemIdByGoodsId: { ...this.data.cartItemIdByGoodsId, [gid]: newItemId } });
    }
    return { itemId: newItemId, created };
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  },

  switchMainTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  // ===== 双向联动：左侧点击 =====
  switchCategory(e) {
    const key = e.currentTarget.dataset.key;
    const index = e.currentTarget.dataset.index;
    this.setData({ 
      activeCategoryKey: key,
      targetViewId: `cat_${index}` // 触发右侧 scroll-into-view
    });
  },

  // ===== 双向联动：右侧滚动 =====
  onGoodsScroll(e) {
    const scrollTop = e.detail.scrollTop;
    const groupTops = this.data.groupTops;
    
    if (!groupTops || groupTops.length === 0) return;

    let activeIndex = 0;
    // 遍历查找当前所处的区间
    for (let i = 0; i < groupTops.length; i++) {
      // 加上一个小偏移量(如20)做容差
      if (scrollTop >= groupTops[i] - 20) {
        activeIndex = i;
      }
    }

    const currentKey = this.data.categories[activeIndex].key;
    if (currentKey !== this.data.activeCategoryKey) {
      this.setData({ activeCategoryKey: currentKey });
    }
  },

  // 计算每个分类标题在 scrollView 里的 top 值
  calculateGroupTops() {
    const query = wx.createSelectorQuery();
    query.selectAll('.goods-group').boundingClientRect((rects) => {
      if (rects && rects.length > 0) {
        // 由于是 relative/static 布局，我们基于第一个元素的位置计算偏移
        const baseTop = rects[0].top;
        const tops = rects.map(item => item.top - baseTop);
        this.setData({ groupTops: tops });
      }
    }).exec();
  },

  // ===== 购物车交互 =====
  // 增加数量
  async addCart(e) {
    let item = e.currentTarget.dataset.item;
    // data-item 序列化可能丢 price；从 goodsGroupList 补齐，避免 rebuildCartDerived 算出 0
    if (item && item.id != null) {
      const meta = this.findGoodsMetaById(item.id);
      if (meta) {
        const hasPrice = item.price != null && item.price !== '' && Number(item.price) > 0;
        item = {
          ...meta,
          ...item,
          price: hasPrice ? String(item.price) : String(meta.price || 0),
          oldPrice: item.oldPrice != null && item.oldPrice !== '' ? String(item.oldPrice) : String(meta.oldPrice || meta.price || 0)
        };
      }
    }
    let { cart, cartCount, totalAmount } = this.data;
    
    if (!cart[item.id]) {
      cart[item.id] = { ...item, quantity: 0 };
    }
    cart[item.id].quantity += 1;
    cartCount += 1;
    totalAmount = (Number(totalAmount) + Number(item.price)).toFixed(2);

    this.rebuildCartDerived(cart);
    if (this.data.useRemoteCart) {
      try {
        await this.ensureRemoteCartItem(item.id, cart[item.id].quantity, item);
      } catch (err) {
        // 服务端失败时降级本地，但不回滚用户交互
        this.setData({ useRemoteCart: false });
      }
    }
  },

  // 减少数量
  async minusCart(e) {
    let item = e.currentTarget.dataset.item;
    if (item && item.id != null) {
      const meta = this.findGoodsMetaById(item.id);
      if (meta && (item.price == null || item.price === '' || Number(item.price) === 0)) {
        item = { ...meta, ...item, price: String(meta.price || 0) };
      }
    }
    let { cart, cartCount, totalAmount } = this.data;

    if (cart[item.id] && cart[item.id].quantity > 0) {
      cart[item.id].quantity -= 1;
      cartCount -= 1;
      totalAmount = (Number(totalAmount) - Number(item.price)).toFixed(2);
      
      if (cart[item.id].quantity === 0) {
        delete cart[item.id]; // 数量为0时移除
      }
      
      this.rebuildCartDerived(cart);
      if (this.data.useRemoteCart) {
        try {
          const gid = Number(item.id);
          const itemId = this.data.cartItemIdByGoodsId[gid];
          if (itemId) {
            const nextQty = cart[gid] ? cart[gid].quantity : 0;
            if (nextQty <= 0) {
              await util.del(`market/cart/items/${itemId}`);
              const nextMap = { ...this.data.cartItemIdByGoodsId };
              delete nextMap[gid];
              this.setData({ cartItemIdByGoodsId: nextMap });
            } else {
              await util.put(`market/cart/items/${itemId}`, { quantity: nextQty });
            }
          } else {
            // 没有 itemId 映射时，直接重新同步一次
            await this.syncCartFromApi(this.data.currentShopId);
          }
        } catch (err) {
          this.setData({ useRemoteCart: false });
        }
      }

      // 如果购物车空了，关闭弹窗
      if (cartCount === 0) {
        this.setData({ showCartPopup: false });
      }
    }
  },

  // 清空购物车
  clearCart() {
    wx.showModal({
      title: '提示',
      content: '确认清空购物车？',
      success: (res) => {
        if (!res.confirm) return;
        const afterClear = () => {
          this.setData({
            cart: {},
            cartList: [],
            cartItemIdByGoodsId: {},
            cartCount: 0,
            totalAmount: "0.00",
            showCartPopup: false
          });
        };
        if (this.data.useRemoteCart) {
          util.del('market/cart', { shop_id: this.data.currentShopId })
            .then(() => afterClear())
            .catch(() => {
              this.setData({ useRemoteCart: false });
              afterClear();
            });
          return;
        }
        afterClear();
      }
    });
  },

  // 切换购物车弹窗
  toggleCartPopup() {
    if (this.data.cartCount === 0) return;
    this.setData({ showCartPopup: !this.data.showCartPopup });
  },

  closeCartPopup() {
    this.setData({ showCartPopup: false });
  },

  // 去结算
  goSettle() {
    if (this.data.cartCount === 0) {
      wx.showToast({ title: '请先选择商品', icon: 'none' });
      return;
    }
    
    // 整理购物车数据为订单确认页需要的格式
    const cartItems = Object.values(this.data.cart).map(item => {
      return {
        goodsId: item.id,
        goodsPictureUrl: item.image,
        goodsName: item.name,
        goodsBrief: item.desc || '精选商品',
        goodsRealPrice: item.price,
        goodsNum: item.quantity
      };
    });

    // 存入本地缓存，供确认订单页面读取
    wx.setStorageSync('local_checkout_goods', cartItems);
    wx.setStorageSync('local_checkout_totle', this.data.totalAmount);
    wx.setStorageSync('local_checkout_shop_id', this.data.currentShopId || (this.data.shop && this.data.shop.id));
    wx.setStorageSync('local_checkout_shop_name', (this.data.shop && this.data.shop.name) || '');
    
    // 跳转到结算页
    wx.navigateTo({ url: '../goods-confrim/goods-confrim?from=local' });
  },

  goSearch() {
    const sid = this.data.currentShopId || 0;
    wx.navigateTo({
      url: `/pages/shopping-search/shopping-search?shopId=${sid}`
    });
  },

  // 商品详情
  goProductDetail(e) {
    const id = e.currentTarget.dataset.id;
    const shopId = this.data.shop.id;
    wx.navigateTo({
      url: "../push-product-detail/push-product-detail?id=" + id + "&shopId=" + shopId
    });
  }
});
