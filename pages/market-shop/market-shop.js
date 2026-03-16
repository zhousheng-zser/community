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
      activeCategoryKey: firstCategoryKey
    });

    // 延迟计算右侧滚动区域每个分类的高度
    setTimeout(() => {
      this.calculateGroupTops();
    }, 500);
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
  addCart(e) {
    const item = e.currentTarget.dataset.item;
    let { cart, cartCount, totalAmount } = this.data;
    
    if (!cart[item.id]) {
      cart[item.id] = { ...item, quantity: 0 };
    }
    cart[item.id].quantity += 1;
    cartCount += 1;
    totalAmount = (Number(totalAmount) + Number(item.price)).toFixed(2);

    this.setData({ cart, cartCount, totalAmount });
  },

  // 减少数量
  minusCart(e) {
    const item = e.currentTarget.dataset.item;
    let { cart, cartCount, totalAmount } = this.data;

    if (cart[item.id] && cart[item.id].quantity > 0) {
      cart[item.id].quantity -= 1;
      cartCount -= 1;
      totalAmount = (Number(totalAmount) - Number(item.price)).toFixed(2);
      
      if (cart[item.id].quantity === 0) {
        delete cart[item.id]; // 数量为0时移除
      }
      
      this.setData({ cart, cartCount, totalAmount });

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
        if (res.confirm) {
          this.setData({
            cart: {},
            cartCount: 0,
            totalAmount: "0.00",
            showCartPopup: false
          });
        }
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
