const util = require('../../utils/util.js');

const STATUS_MAP = {
  pending_payment: { text: '待付款', class: 'primary' },
  pending_accept: { text: '待接单', class: 'primary' },
  pending_service: { text: '备货中', class: 'primary' },
  pending_receipt: { text: '待收货', class: 'primary' },
  completed: { text: '已完成', class: 'done' },
  cancelled: { text: '已取消', class: 'cancel' },
  refunded: { text: '已退款', class: 'cancel' }
};

Page({
  data: {
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'pending_payment', label: '待付款' },
      { key: 'pending_accept', label: '待接单' },
      { key: 'pending_service', label: '待服务/备货中' },
      { key: 'pending_receipt', label: '待收货' },
      { key: 'completed', label: '已完成' },
      { key: 'cancelled', label: '已取消' },
      { key: 'refunded', label: '已退款' }
    ],
    activeTab: 'all',
    list: [],
    loading: false
  },

  onLoad() {
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    if (this.data.activeTab === key) return;
    this.setData({ activeTab: key });
    this.loadOrders();
  },

  async loadOrders() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    
    let queryStatus = this.data.activeTab === 'all' ? '' : this.data.activeTab;
    try {
      const res = await util.get('api/market/orders', { status: queryStatus, page: 1, page_size: 50 });
      const rawList = res.list || (res.data && res.data.list) || [];
      const list = rawList.map(this.normalizeOrder);
      this.setData({ list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      // 无接口时回退至演示数据
      this.mockLoad(queryStatus);
    }
  },

  normalizeOrder(o) {
    const statusObj = STATUS_MAP[o.status] || { text: o.status || '未知', class: '' };
    return {
      orderNo: o.orderNo || o.order_no,
      shopName: o.shopName || o.shop_name,
      status: o.status,
      statusText: statusObj.text,
      statusClass: statusObj.class,
      amount: String(o.amount || o.payable_amount || '0.00'),
      totalQuantity: o.goods ? o.goods.reduce((acc, g) => acc + (g.quantity || 1), 0) : 0,
      goods: (o.goods || []).map(g => ({
        id: g.id,
        name: g.name || g.goods_name,
        price: String(g.price || '0.00'),
        quantity: g.quantity || 1,
        image: g.image || g.main_image || '/img/placeholders/home_cleaning.png'
      }))
    };
  },

  mockLoad(queryStatus) {
    const allMocks = [
      { orderNo: 'ODR20261111', shopName: '新鲜果蔬超市', status: 'pending_payment', amount: '29.90', goods: [{name: '新鲜苹果 1kg', price: '29.90', quantity: 1}] },
      { orderNo: 'ODR20262222', shopName: '美妆严选', status: 'pending_accept', amount: '129.00', goods: [{name: '保湿面霜', price: '129.00', quantity: 1}] },
      { orderNo: 'ODR20262223', shopName: '美妆严选', status: 'pending_service', amount: '229.00', goods: [{name: '控油洗发水', price: '229.00', quantity: 1}] },
      { orderNo: 'ODR20263333', shopName: '某某快餐', status: 'pending_receipt', amount: '59.00', goods: [{name: '外卖双人套餐', price: '59.00', quantity: 1}] },
      { orderNo: 'ODR20264444', shopName: '家政服务中心', status: 'completed', amount: '199.00', goods: [{name: '日常保洁3小时', price: '199.00', quantity: 1}] },
      { orderNo: 'ODR20265555', shopName: '数码小店', status: 'refunded', amount: '89.00', goods: [{name: '蓝牙耳机', price: '89.00', quantity: 1}] }
    ];
    let filtered = allMocks;
    if (queryStatus) {
      filtered = allMocks.filter(o => o.status === queryStatus);
    }
    this.setData({ list: filtered.map(this.normalizeOrder) });
  },

  goDetail(e) {
    const orderNo = e.currentTarget.dataset.orderno;
    wx.navigateTo({ url: `../market-order-detail/market-order-detail?orderNo=${orderNo}` });
  },

  cancelOrder(e) {
    wx.showToast({ title: '已取消', icon: 'none' });
  },
  payOrder(e) {
    wx.showToast({ title: '拉起微信支付', icon: 'none' });
  },
  applyRefund(e) {
    wx.navigateTo({ url: `/pages/after-sale-apply/after-sale-apply?orderNo=${e.currentTarget.dataset.id}` });
  },
  contactMerchant(e) {
    wx.showToast({ title: '拨打商家电话', icon: 'none' });
  },
  viewLogistics(e) {
    wx.navigateTo({ url: `/pages/order-logistics/order-logistics?orderNo=${e.currentTarget.dataset.id}` });
  },
  confirmReceipt(e) {
    wx.showToast({ title: '收货成功' });
  },
  buyAgain(e) {
    wx.showToast({ title: '已将商品重新加入该店购物车', icon: 'none' });
  }
});
