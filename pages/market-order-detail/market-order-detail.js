const app = getApp();
const util = require('../../utils/util.js');
const api = require('../../api/index.js');
const orderTimeout = require('../../utils/orderTimeout.js');
const env = require('../../utils/env.js');
const marketPay = require('../../utils/marketPay.js');

const STATUS_MAP = {
  pending_payment: { text: '待付款', class: 'primary' },
  pending_accept: { text: '待接单', class: 'primary' },
  pending_service: { text: '备货中', class: 'primary' },
  pending_receipt: { text: '待确认收货', class: 'primary' },
  paid: { text: '待接单', class: 'primary' },
  delivering: { text: '待收货', class: 'primary' },
  closed: { text: '已取消', class: 'cancel' },
  completed: { text: '已完成', class: 'done' },
  cancelled: { text: '已取消', class: 'cancel' },
  refunded: { text: '已退款', class: 'cancel' },
  after_sales: { text: '售后中', class: 'done' },
  refund_pending: { text: '待退款', class: 'primary' },
  refund_rejected: { text: '拒绝退款', class: 'cancel' },
  refund_success: { text: '退款成功', class: 'done' }
};

Page({
  data: {
    fromMerchant: false,
    contactRoleText: '联系商家',
    orderNo: '',
    status: '',
    statusText: '',
    shopName: '',
    shopId: '',
    buyerUserId: null,
    buyerName: '',
    fulfillmentEvents: [],
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
    refundStatus: '',

    // 超时倒计时
    autoConfirmCountdown: null,
    autoConfirmDeadline: null,
    countdownTimerId: null,

    delivery: null,
    deliveryPollTimer: null
  },

  onUnload() {
    orderTimeout.clearCountdownTimer(this.data.countdownTimerId);
    if (this.data.deliveryPollTimer) {
      clearInterval(this.data.deliveryPollTimer);
    }
  },

  onShow() {
    const lastPayOrderNo = wx.getStorageSync('last_market_order_no');
    if (lastPayOrderNo && lastPayOrderNo === this.data.orderNo && this.data.status === 'pending_payment') {
      this.loadOrderDetail();
    }
    if (this.data.orderNo && this.data.delivery && this.data.delivery.has_delivery) {
      this.refreshDeliveryTrack();
      this._startDeliveryPoll();
    }
  },

  onLoad(options) {
    const fromMerchant = options.from === 'merchant';
    this.setData({
      fromMerchant,
      contactRoleText: fromMerchant ? '联系买家' : '联系商家'
    });
    if (options.orderNo) {
      this.setData({ orderNo: options.orderNo });
      this.loadOrderDetail();
    }
  },

  async loadOrderDetail() {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await api.market.getOrderDetail(this.data.orderNo);
      wx.hideLoading();
      this.normalizeDetail(res.data || res);
    } catch (e) {
      wx.hideLoading();
      console.log('订单详情加载失败', e);
      if (env.shouldUseMockData()) {
        console.log('开发环境：使用模拟数据');
        this.mockLoad();
      } else {
        wx.showToast({ title: '订单加载失败', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    }
  },

  normalizeDetail(o) {
    const detail = (o && typeof o === 'object') ? o : {};
    const order = detail.order && typeof detail.order === 'object' ? detail.order : detail;
    const shop = detail.shop && typeof detail.shop === 'object' ? detail.shop : {};
    const rawItems = Array.isArray(detail.items) ? detail.items : (Array.isArray(order.items) ? order.items : (Array.isArray(detail.goods) ? detail.goods : []));

    const status = order.status || order.order_status || detail.status || detail.order_status || '';
    const refundStatus = order.refundStatus || order.refund_status || detail.refundStatus || detail.refund_status || '';
    const statusObj = STATUS_MAP[status] || { text: status || '未知订单状态' };
    const refundObj = refundStatus ? (STATUS_MAP[refundStatus] || { text: refundStatus }) : null;
    const rawEvents = Array.isArray(detail.fulfillment_events) ? detail.fulfillment_events : [];

    this.setData({
      orderNo: order.orderNo || order.order_no || detail.orderNo || detail.order_no,
      status,
      statusText: refundObj ? refundObj.text : statusObj.text,
      shopName: shop.name || order.shopName || order.shop_name || detail.shopName || detail.shop_name || '社区精选商家',
      shopId: shop.id || order.shopId || order.shop_id || detail.shopId || detail.shop_id,
      buyerUserId: order.buyer_user_id || detail.buyer_user_id || order.user_id || detail.user_id || null,
      buyerName: order.buyer_name || detail.buyer_name || order.receiver_name || detail.receiver_name || '',
      fulfillmentEvents: rawEvents.map((ev) => ({
        id: ev.id || `${ev.action || 'node'}_${ev.created_at || ''}`,
        title: ev.title || ev.action || '订单节点',
        note: ev.note || '',
        createdAt: ev.created_at || '',
        proofImages: Array.isArray(ev.proof_images) ? ev.proof_images : []
      })),

      goodsAmount: String(order.goods_amount || detail.goods_amount || '0.00'),
      deliveryFee: String(order.delivery_fee || detail.delivery_fee || '0.00'),
      discountAmount: String(order.discount_amount || detail.discount_amount || '0.00'),
      payableAmount: String(order.payable_amount || detail.payable_amount || order.amount || detail.amount || '0.00'),

      createdAt: order.created_at || detail.created_at || '2026-01-01 12:00:00',
      payTime: order.pay_time || order.paid_at || detail.pay_time || detail.paid_at || '',
      deliveryTime: order.delivery_time || detail.delivery_time || '',

      receiver_name: order.receiver_name || detail.receiver_name || '张三',
      receiver_phone: order.receiver_phone || detail.receiver_phone || '13888888888',
      receiver_address: order.receiver_address || detail.receiver_address || '浙江省杭州市西湖区某某小区 1幢1单元101',

      refundStatus,

      items: rawItems.map(g => ({
        id: g.id || g.goods_id,
        name: g.name || g.goods_name || g.goods_name_snapshot,
        price: String(g.price || g.unit_price || g.unit_price_snapshot || '0.00'),
        quantity: g.quantity || 1,
        image: (g.image || g.main_image || g.goods_image_snapshot) ? util.imgUrl(g.image || g.main_image || g.goods_image_snapshot) : 'https://jshsp1.eds-tech.cn/uploads/file-1773395942165-45947155.png'
      }))
    });
    this.initCountdown(order);

    const delivery = detail.delivery || null;
    this.setData({ delivery });
    if (delivery && delivery.has_delivery) {
      this.refreshDeliveryTrack();
      this._startDeliveryPoll();
    }
  },

  _startDeliveryPoll() {
    if (this.data.deliveryPollTimer) clearInterval(this.data.deliveryPollTimer);
    const d = this.data.delivery;
    if (!d || !d.has_delivery) return;
    if (d.provider === 'self' && d.job_status === 'delivered') return;
    if (d.job_status === 'delivered') return;
    const timer = setInterval(() => this.refreshDeliveryTrack(), 15000);
    this.setData({ deliveryPollTimer: timer });
  },

  async refreshDeliveryTrack() {
    const { orderNo, fromMerchant } = this.data;
    if (!orderNo) return;
    try {
      const res = fromMerchant
        ? await api.merchant.getDeliveryTrack(orderNo)
        : await api.market.getDeliveryTrack(orderNo);
      const view = res.data || res;
      if (view && view.has_delivery) {
        this.setData({ delivery: view });
        if (view.job_status === 'delivered') {
          if (this.data.deliveryPollTimer) {
            clearInterval(this.data.deliveryPollTimer);
            this.setData({ deliveryPollTimer: null });
          }
        }
      }
    } catch (e) {
      /* ignore */
    }
  },

  initCountdown(o) {
    orderTimeout.clearCountdownTimer(this.data.countdownTimerId);
    const { status, delivery_time, created_at } = o;
    if (status === 'pending_receipt' && delivery_time) {
      const deadline = orderTimeout.calcAutoConfirmDeadline(delivery_time);
      if (deadline) {
        const timerId = orderTimeout.startCountdownTimer(this, 'autoConfirmDeadline', 'autoConfirmCountdown', 1000);
        this.setData({ autoConfirmDeadline: deadline, countdownTimerId: timerId });
      }
    } else if (status === 'pending_payment' && created_at) {
      const deadline = orderTimeout.calcAutoCancelUnpaidDeadline(created_at);
      if (deadline) {
        const timerId = orderTimeout.startCountdownTimer(this, 'autoConfirmDeadline', 'autoConfirmCountdown', 1000);
        this.setData({ autoConfirmDeadline: deadline, countdownTimerId: timerId });
      }
    } else {
      this.setData({ autoConfirmCountdown: null, autoConfirmDeadline: null });
    }
  },

  onCountdownExpired(key) {
    const { status } = this.data;
    if (key === 'autoConfirmDeadline') {
      if (status === 'pending_receipt') {
        wx.showModal({
          title: '自动确认收货',
          content: '您已超过10天未确认收货，系统将自动确认收货。如未收到货，请联系客服。',
          showCancel: false,
          success: () => {
            this.confirmReceipt();
          }
        });
      } else if (status === 'pending_payment') {
        wx.showModal({
          title: '订单自动取消',
          content: '您已超过30分钟未支付，订单将自动取消。',
          showCancel: false,
          success: () => {
            this.cancelOrder();
          }
        });
      }
    }
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
  async cancelOrder() {
    wx.showModal({
      title: '取消订单',
      content: '确定取消吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.market.cancelOrder(this.data.orderNo);
            wx.showToast({ title: '已取消', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
          } catch (err) {
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  async payNow() {
    const orderNo = this.data.orderNo;
    if (!orderNo) return;
    await marketPay.startMarketPaymentFlow(orderNo, {
      redirectToDetail: false,
      onPaid: () => this.loadOrderDetail()
    });
  },

  applyRefund(e) {
    const goodsId = e.currentTarget.dataset.goodsid;
    wx.navigateTo({ url: `/pages/after-sale-apply/after-sale-apply?orderNo=${this.data.orderNo}&goodsId=${goodsId || ''}` });
  },

  async contactMerchant() {
    if (this.data.fromMerchant) {
      this.contactBuyer();
      return;
    }
    const shopId = this.data.shopId;
    if (!shopId) {
      wx.showToast({ title: '暂无商家信息', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '打开会话', mask: true });
    try {
      const res = await util.post('messages/order-conversation/ensure', {
        order_no: this.data.orderNo,
        shop_id: shopId,
        channel: 'shop_buyer'
      });
      wx.hideLoading();
      const data = res && res.data !== undefined ? res.data : res;
      const cid = data && data.conversation_id;
      if (!cid) throw new Error('NO_CONVERSATION_ID');
      wx.navigateTo({
        url: `/pages/chat/chat?conversationId=${cid}&name=${encodeURIComponent(this.data.shopName || '商家')}&orderNo=${encodeURIComponent(this.data.orderNo)}`
      });
    } catch (err) {
      wx.hideLoading();
      // 回退电话，保证可联系
      try {
        const contactRes = await api.market.getShopContact(shopId);
        const phone = contactRes.phone || contactRes.contact_phone;
        if (phone) {
          wx.makePhoneCall({ phoneNumber: phone });
          return;
        }
      } catch (e) { }
      wx.showToast({ title: '获取商家信息失败', icon: 'none' });
    }
  },

  async contactBuyer() {
    const shopId = app.globalData.user && (app.globalData.user.shop_id || app.globalData.user.shopId);
    if (!shopId) {
      wx.showToast({ title: '请先绑定店铺', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '打开会话', mask: true });
    try {
      const res = await util.post('messages/order-conversation/ensure', {
        order_no: this.data.orderNo,
        shop_id: shopId,
        channel: 'shop_buyer',
        buyer_user_id: this.data.buyerUserId,
        buyer_name: this.data.buyerName || ''
      });
      wx.hideLoading();
      const data = res && res.data !== undefined ? res.data : res;
      const cid = data && data.conversation_id;
      if (!cid) {
        wx.showToast({ title: '无法建立会话', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/pages/chat/chat?conversationId=${cid}&name=${encodeURIComponent(this.data.buyerName || '买家')}&orderNo=${encodeURIComponent(this.data.orderNo)}`
      });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '暂无法打开会话', icon: 'none' });
    }
  },

  async contactMerchantByPhone() {
    if (!this.data.shopId) {
      wx.showToast({ title: '暂无商家信息', icon: 'none' });
      return;
    }

    try {
      const contactRes = await api.market.getShopContact(this.data.shopId);
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

  async viewLogistics() {
    await this.refreshDeliveryTrack();
    if (this.data.delivery && this.data.delivery.has_delivery) {
      wx.pageScrollTo({ selector: '#delivery-track-card', duration: 300 });
      return;
    }
    try {
      const logisticsRes = await api.market.getOrderLogistics(this.data.orderNo);
      const trackingNo = logisticsRes.tracking_no || logisticsRes.trackingNo;
      const company = logisticsRes.company || logisticsRes.express_company;
      wx.navigateTo({
        url: `/pages/order-logistics/order-logistics?orderNo=${this.data.orderNo}&trackingNo=${trackingNo}&company=${company}`
      });
    } catch (err) {
      wx.showToast({ title: '暂无物流信息', icon: 'none' });
    }
  },

  async confirmReceipt() {
    wx.showModal({
      title: '确认收货',
      content: '确认收到所有商品了吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.market.confirmReceipt(this.data.orderNo);
            wx.showToast({ title: '已确认收货', icon: 'success' });
            this.loadOrderDetail();
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  async deleteOrder() {
    wx.showModal({
      title: '删除订单',
      content: '不可恢复，确定删除？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.market.deleteOrder(this.data.orderNo);
            wx.showToast({ title: '订单已删除', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  goRate() {
    wx.navigateTo({ url: `/pages/goods-rate/goods-rate?orderNo=${this.data.orderNo}` });
  },

  contactCustomerService() {
    wx.showToast({ title: '唤起官方在线客服', icon: 'none' });
  },

  async cancelRefund() {
    wx.showModal({
      title: '取消售后',
      content: '确定放弃售后申请吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.market.cancelRefund(this.data.orderNo);
            wx.showToast({ title: '已撤销', icon: 'success' });
            this.loadOrderDetail();
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  }
});
