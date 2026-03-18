const util = require('../../utils/util.js');
const { imgUrl } = util;

const SHOP_MAP = {
  1: {
    id: 1,
    cover: imgUrl('/img/placeholders/home_cleaning.png'),
    logo: imgUrl('/img/placeholders/home_cleaning.png'),
    name: "龙泉驿区艺源农副产品经营部",
    scoreText: "4.8",
    soldCount: "1231",
    deliveryType: "邻工配送",
    businessHours: "09:00~22:00",
    notice: "欢迎光临，新店开业，全场满50减10！",
    categories: [
      { key: "vegetables", name: "有机蔬菜" },
      { key: "meat", name: "鲜猪牛肉" },
      { key: "fruits", name: "新鲜水果" },
      { key: "poultry", name: "农家土鸡土鸭" },
      { key: "grain", name: "粮油米面" },
      { key: "eggs", name: "农土鲜蛋" },
      { key: "mushroom", name: "菌菇类" },
      { key: "special", name: "土特产" },
      { key: "seafood", name: "海鲜" },
      { key: "soy", name: "豆制品类" }
    ],
    goodsByCategory: {
      vegetables: [
        { id: 101, name: "现挖黄心土豆500g", desc: "软糯香甜", sold: "已售12", price: "1.68", oldPrice: "2", image: imgUrl('/img/placeholders/home_cleaning.png') },
        { id: 102, name: "韩国萝卜500g", desc: "清脆爽口", sold: "已售3", price: "0.99", oldPrice: "1.5", image: imgUrl('/img/placeholders/home_cleaning.png') },
        { id: 103, name: "甜白菜500克", desc: "新鲜采摘", sold: "已售3", price: "1.28", oldPrice: "1.5", image: imgUrl('/img/placeholders/home_cleaning.png') },
        { id: 104, name: "青皮冬瓜", desc: "清热解暑", sold: "已售2", price: "2.5", oldPrice: "3.8", image: imgUrl('/img/placeholders/home_cleaning.png') },
        { id: 105, name: "红心红薯500g", desc: "农家自种", sold: "已售2", price: "2.98", oldPrice: "3.5", image: imgUrl('/img/placeholders/home_cleaning.png') }
      ],
      meat: [{ id: 111, name: "甘孜现杀牦牛肉", desc: "高山草甸放养", sold: "已售20", price: "42.99", oldPrice: "46.8", image: imgUrl('/img/placeholders/home_cleaning.png') }],
      fruits: [{ id: 121, name: "应季水果拼盘", desc: "每日新鲜切配", sold: "已售50", price: "19.9", oldPrice: "25.9", image: imgUrl('/img/placeholders/home_cleaning.png') }],
      poultry: [{ id: 131, name: "农家土鸡1只", desc: "散养走地鸡", sold: "已售18", price: "68", oldPrice: "79", image: imgUrl('/img/placeholders/home_cleaning.png') }],
      grain: [{ id: 141, name: "高原蜂蜜", desc: "纯天然无添加", sold: "已售6", price: "39.8", oldPrice: "68", image: imgUrl('/img/placeholders/home_cleaning.png') }],
      eggs: [{ id: 151, name: "农家土鸡蛋30枚", desc: "原生态土鸡蛋", sold: "已售42", price: "29.9", oldPrice: "36", image: imgUrl('/img/placeholders/home_cleaning.png') }],
      mushroom: [{ id: 161, name: "鲜香菌菇组合", desc: "煲汤佳品", sold: "已售10", price: "16.8", oldPrice: "21.8", image: imgUrl('/img/placeholders/home_cleaning.png') }],
      special: [{ id: 171, name: "本地风干肉", desc: "传统工艺制作", sold: "已售15", price: "58", oldPrice: "69", image: imgUrl('/img/placeholders/home_cleaning.png') }],
      seafood: [{ id: 181, name: "冷鲜虾仁500g", desc: "深海捕捞", sold: "已售22", price: "35.9", oldPrice: "42.9", image: imgUrl('/img/placeholders/home_cleaning.png') }],
      soy: [{ id: 191, name: "手工豆腐", desc: "纯手工点卤", sold: "已售38", price: "6.8", oldPrice: "8.8", image: imgUrl('/img/placeholders/home_cleaning.png') }]
    },
    phone: "199****6695",
    contact: "曹老板",
    categoryName: "生鲜超市",
    shopAddress: "四川省成都市龙泉驿区桃都大道",
    facadeImage: imgUrl('/img/placeholders/home_cleaning.png'),
    interiorImage: imgUrl('/img/placeholders/home_cleaning.png'),
    licenseImage: imgUrl('/img/placeholders/home_cleaning.png')
  }
};

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
    currentShopId: 1,
    useRemoteCart: false,  // 是否已成功启用服务端购物车
    cartCount: 0,
    totalAmount: "0.00",
    showCartPopup: false
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    // 默认加载 1 号店铺，也可以根据 options.id
    const id = Number(options.id || 1);
    // 这里做一下兜底，如果没有对应的就用 1
    const shop = SHOP_MAP[id] || SHOP_MAP[1];
    
    // 格式化商品数据，构建分组列表
    const categories = shop.categories;
    const goodsGroupList = categories.map((cat, index) => {
      const items = shop.goodsByCategory[cat.key] || [];
      return {
        ...cat,
        id: `cat_${index}`, // 绑定的滚动 id
        items: items
      };
    }).filter(cat => cat.items.length > 0);

    const firstCategoryKey = goodsGroupList[0] ? goodsGroupList[0].key : "";

    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 8,
      shop,
      categories: goodsGroupList,
      goodsGroupList,
      activeCategoryKey: firstCategoryKey,
      currentShopId: shop.id
    });

    // 延迟计算右侧滚动区域每个分类的高度
    setTimeout(() => {
      this.calculateGroupTops();
    }, 500);
    // 后端接口可用时，覆盖本地 mock 数据
    this.loadShopFromApi(id);
    // 尝试同步服务端购物车
    this.syncCartFromApi(id);
  },
  extractList(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.list)) return payload.list;
    if (payload && payload.data && Array.isArray(payload.data.list)) return payload.data.list;
    if (payload && payload.data && Array.isArray(payload.data)) return payload.data;
    return [];
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
      const shopData = shopRes && shopRes.data ? shopRes.data : shopRes;
      if (!shopData || !shopData.id) return;

      const [categoriesRes, goodsRes] = await Promise.all([
        util.get(`market/shops/${id}/categories`),
        util.get(`market/shops/${id}/goods`, { page: 1, page_size: 200 })
      ]);

      const categories = this.extractList(categoriesRes);
      const goodsList = this.extractList(goodsRes);
      const goodsGroupList = this.buildGoodsGroups(categories, goodsList);
      if (goodsGroupList.length === 0) return;

      const firstCategoryKey = goodsGroupList[0].key;
      const shop = {
        id: shopData.id,
        cover: imgUrl(shopData.cover_url || shopData.cover || '/img/placeholders/home_cleaning.png'),
        logo: imgUrl(shopData.logo_url || shopData.logo || '/img/placeholders/home_cleaning.png'),
        name: shopData.name || shopData.shop_name || '社区店铺',
        scoreText: String(shopData.rating || '4.8'),
        soldCount: String(shopData.sold_count || 0),
        deliveryType: shopData.delivery_type_text || shopData.delivery_type || '邻工配送',
        businessHours: shopData.business_hours || '09:00~22:00',
        notice: shopData.notice || '欢迎光临',
        phone: shopData.contact_phone || '',
        contact: shopData.contact_name || '',
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
        currentShopId: shop.id
      });

      setTimeout(() => this.calculateGroupTops(), 200);
      // 店铺数据覆盖后，再同步一次购物车（防止 shop.id 不一致）
      this.syncCartFromApi(shop.id);
    } catch (e) {
      console.log('店铺详情接口不可用，继续使用本地数据', e);
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
        const itemId = Number(it.id || it.item_id);
        if (itemId) cartItemIdByGoodsId[goodsId] = itemId;
        cart[goodsId] = {
          id: goodsId,
          name: it.goods_name || it.name || '精选商品',
          desc: it.goods_desc || it.desc || '',
          sold: it.sold || '',
          price: String(it.price || it.goods_price || 0),
          oldPrice: String(it.origin_price || it.old_price || it.price || 0),
          image: imgUrl(it.main_image || it.image || '/img/placeholders/home_cleaning.png'),
          quantity: Number(it.quantity || 0)
        };
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
    const item = e.currentTarget.dataset.item;
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
    const item = e.currentTarget.dataset.item;
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
    
    // 跳转到结算页
    wx.navigateTo({ url: '../goods-confrim/goods-confrim?from=local' });
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
