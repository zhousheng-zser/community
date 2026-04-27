const util = require('../../utils/util.js');
const api = require('../../api/index.js');

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
    loading: false,
    loadError: false
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
      const params = { page: 1, page_size: 50 };
      if (queryStatus) params.status = queryStatus;
      const res = await api.market.getMyOrders(params);
      const rawList = res.list || (res.data && res.data.list) || res || [];
      const list = rawList.map(this.normalizeOrder);
      this.setData({ list, loading: false });
    } catch (e) {
      console.error('订单加载失败:', e);
      this.setData({
        loading: false,
        list: [],
        loadError: true
      });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  normalizeOrder(o) {
    const statusObj = STATUS_MAP[o.status] || { text: o.status || '未知', class: '' };
    return {
      orderNo: o.orderNo || o.order_no,
      shopName: o.shopName || o.shop_name,
      shopId: o.shopId || o.shop_id,
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


  goDetail(e) {
    const orderNo = e.currentTarget.dataset.orderno;
    wx.navigateTo({ url: `../market-order-detail/market-order-detail?orderNo=${orderNo}` });
  },

  async cancelOrder(e) {
    const orderNo = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.market.cancelOrder(orderNo);
            wx.showToast({ title: '订单已取消', icon: 'success' });
            this.loadOrders();
          } catch (err) {
            console.log('取消订单失败', err);
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  async payOrder(e) {
    const orderNo = e.currentTarget.dataset.id;
    try {
      const payRes = await api.market.createPayment({ order_no: orderNo, pay_type: 'wechat' });
      const paymentId = payRes.payment_id || payRes.paymentId;
      
      wx.requestPayment({
        timeStamp: payRes.timeStamp,
        nonceStr: payRes.nonceStr,
        package: payRes.package,
        signType: payRes.signType || 'MD5',
        paySign: payRes.paySign,
        success: () => {
          wx.showToast({ title: '支付成功', icon: 'success' });
          this.loadOrders();
        },
        fail: (err) => {
          console.log('支付失败', err);
          wx.showToast({ title: '支付取消', icon: 'none' });
        }
      });
    } catch (err) {
      console.log('创建支付订单失败', err);
      wx.showModal({
        title: '提示',
        content: '支付功能暂未接入，是否模拟支付成功？',
        success: async (modalRes) => {
          if (modalRes.confirm) {
            try {
              await api.market.mockPaymentSuccess({ order_no: orderNo });
              wx.showToast({ title: '支付成功', icon: 'success' });
              this.loadOrders();
            } catch (e) {
              wx.showToast({ title: '模拟支付失败', icon: 'none' });
            }
          }
        }
      });
    }
  },

  applyRefund(e) {
    const orderNo = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/after-sale-apply/after-sale-apply?orderNo=${orderNo}` });
  },

  async contactMerchant(e) {
    const orderNo = e.currentTarget.dataset.id;
    const order = this.data.list.find(o => o.orderNo === orderNo);
    if (!order) return;

    try {
      const contactRes = await api.market.getShopContact(order.shopId);
      const phone = contactRes.phone || contactRes.contact_phone;
      if (phone) {
        wx.makePhoneCall({ phoneNumber: phone });
      } else {
        wx.showToast({ title: '暂无商家电话', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '获取商家信息失败', icon: 'none' });
    }
  },

  async viewLogistics(e) {
    const orderNo = e.currentTarget.dataset.id;
    try {
      const logisticsRes = await api.market.getOrderLogistics(orderNo);
      const trackingNo = logisticsRes.tracking_no || logisticsRes.trackingNo;
      const company = logisticsRes.company || logisticsRes.express_company;
      
      wx.navigateTo({
        url: `/pages/order-logistics/order-logistics?orderNo=${orderNo}&trackingNo=${trackingNo}&company=${company}`
      });
    } catch (err) {
      wx.showToast({ title: '暂无物流信息', icon: 'none' });
    }
  },

  async confirmReceipt(e) {
    const orderNo = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确认已收到商品？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.market.confirmReceipt(orderNo);
            wx.showToast({ title: '确认收货成功', icon: 'success' });
            this.loadOrders();
          } catch (err) {
            console.log('确认收货失败', err);
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  async buyAgain(e) {
    const orderNo = e.currentTarget.dataset.id;
    try {
      await api.market.buyAgain(orderNo);
      wx.showToast({ title: '已加入购物车', icon: 'success' });
      setTimeout(() => {
        wx.navigateTo({ url: '../goods-cart/goods-cart' });
      }, 1000);
    } catch (err) {
      console.log('再次购买失败', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  async deleteOrder(e) {
    const orderNo = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除该订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.market.deleteOrder(orderNo);
            wx.showToast({ title: '订单已删除', icon: 'success' });
            this.loadOrders();
          } catch (err) {
            console.log('删除订单失败', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
