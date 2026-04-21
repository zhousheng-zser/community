const util = require('../../utils/util.js');

const STATUS_MAP = {
  pending_payment: { text: '待付款', class: 'primary' },
  pending_shipment: { text: '待发货', class: 'primary' },
  pending_receipt: { text: '待收货', class: 'primary' },
  pending_review: { text: '待评价', class: 'primary' },
  after_sales: { text: '售后中', class: 'done' },
  refund_pending: { text: '待退款', class: 'primary' },
  refund_rejected: { text: '拒绝退款', class: 'cancel' },
  refund_success: { text: '退款成功', class: 'done' }
};

Page({
  data: {
    orderNo: '',
    status: '',
    statusText: '',
    shopName: '',
    items: [],
    
    // 金额信息
    goodsAmount: '0.00',
    deliveryFee: '0.00',
    discountAmount: '0.00',
    payableAmount: '0.00',

    // 订单时序信息
    createdAt: '',
    payTime: '',
    deliveryTime: '',

    // 物流/收货信息
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',

    // 其他
    refundStatus: ''
  },

  onLoad(options) {
    if (options.orderNo) {
      this.setData({ orderNo: options.orderNo });
      this.loadOrderDetail();
    }
  },

  async loadOrderDetail() {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await util.get('api/market/order/detail', { order_no: this.data.orderNo });
      wx.hideLoading();
      this.normalizeDetail(res.data || res);
    } catch (e) {
      wx.hideLoading();
      this.mockLoad();
    }
  },

  normalizeDetail(o) {
    const statusObj = STATUS_MAP[o.status] || { text: o.status || '未知订单状态' };
    this.setData({
      status: o.status,
      statusText: o.refundStatus ? STATUS_MAP[o.refundStatus].text : statusObj.text,
      shopName: o.shopName || o.shop_name || '社区精选商家',
      
      goodsAmount: String(o.goods_amount || '0.00'),
      deliveryFee: String(o.delivery_fee || '0.00'),
      discountAmount: String(o.discount_amount || '0.00'),
      payableAmount: String(o.payable_amount || o.amount || '0.00'),

      createdAt: o.created_at || '2026-01-01 12:00:00',
      payTime: o.pay_time || '',
      deliveryTime: o.delivery_time || '',

      receiver_name: o.receiver_name || '张三',
      receiver_phone: o.receiver_phone || '13888888888',
      receiver_address: o.receiver_address || '浙江省杭州市西湖区某某小区 1幢1单元101',

      refundStatus: o.refundStatus || o.refund_status,

      items: (o.goods || []).map(g => ({
        id: g.id,
        name: g.name || g.goods_name,
        price: String(g.price || '0.00'),
        quantity: g.quantity || 1,
        image: g.image || g.main_image || '/img/placeholders/home_cleaning.png'
      }))
    });
  },

  mockLoad() {
    this.normalizeDetail({
      orderNo: this.data.orderNo,
      status: 'pending_receipt',
      shopName: '测试演示店铺',
      goods_amount: '129.00',
      delivery_fee: '10.00',
      discount_amount: '5.00',
      payable_amount: '134.00',
      created_at: '2026-11-10 10:00:00',
      pay_time: '2026-11-10 10:05:00',
      delivery_time: '2026-11-11 08:00:00',
      goods: [
        { id: 101, name: '演示测试商品(洗发水)', price: '129.00', quantity: 1 }
      ]
    });
  },

  copyOrderNo() {
    wx.setClipboardData({
      data: this.data.orderNo,
      success: () => wx.showToast({ title: '单号已复制', icon: 'none' })
    });
  },

  // ---- 动作区 ----
  cancelOrder() {
    wx.showModal({
      title: '取消订单', content: '确定取消吗？',
      success: (res) => { if(res.confirm) wx.showToast({ title: '已取消', icon: 'none' }); }
    });
  },
  payNow() {
    wx.showToast({ title: '调起微信支付', icon: 'none' });
  },

  applyRefund(e) {
    // 可能是局部退款也可能是整单退款
    const goodsId = e.currentTarget.dataset.goodsid;
    wx.navigateTo({ url: `/pages/after-sale-apply/after-sale-apply?orderNo=${this.data.orderNo}&goodsId=${goodsId || ''}` });
  },
  contactMerchant() {
    wx.showToast({ title: '拨打商家电话: 13800000000', icon: 'none' });
  },
  
  viewLogistics() {
    wx.navigateTo({ url: `/pages/order-logistics/order-logistics?orderNo=${this.data.orderNo}` });
  },
  confirmReceipt() {
    wx.showModal({
      title: '确认收货', content: '确认收到所有商品了吗？',
      success: (res) => { if(res.confirm) wx.showToast({ title: '已确认收货' }); }
    });
  },

  deleteOrder() {
    wx.showModal({
      title: '删除订单', content: '不可恢复，确定删除？',
      success: (res) => { if(res.confirm) wx.navigateBack(); }
    });
  },
  goRate() {
    wx.showToast({ title: '打分评价页在建中', icon: 'none' });
  },

  contactCustomerService() {
    wx.showToast({ title: '唤起官方在线客服', icon: 'none' });
  },
  cancelRefund() {
    wx.showModal({
      title: '取消售后', content: '确定放弃售后申请吗？',
      success: (res) => { if(res.confirm) wx.showToast({ title: '已撤销', icon:'none' }); }
    });
  }
});
