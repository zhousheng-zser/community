const app = getApp();
const util = require('../../utils/util.js');
const marketPay = require('../../utils/marketPay.js');
const merchantOrderMock = require('../../utils/merchantOrderMock.js');

Page({
  data: {
    orderNo: '',
    order: null,
    items: [],
    autoRefreshTimer: null,
    autoRefreshTimes: 0,
    isMock: false,
    shopIdForChat: null,
    shopNameForChat: '',
    fromMerchant: false,
    isMerchantOrder: false
  },

  onLoad(options) {
    const orderNo = options.orderNo || options.order_no || '';
    const isMock =
      (options && options.mock === '1') || merchantOrderMock.isDemoOrderNo(orderNo);
    const fromMerchant = options && options.from === 'merchant';
    this.setData({ orderNo, isMock, fromMerchant });
    this.loadOrder(orderNo, isMock);
    if (!isMock) {
      this.startAutoRefresh(orderNo);
    }
    this.refreshMerchantFlag();
  },

  onShow() {
    this.refreshMerchantFlag();
  },

  refreshMerchantFlag() {
    const u = app.globalData.user || {};
    const isMerchantOrder =
      !!this.data.fromMerchant || !!(u.shop_id || u.shopId);
    this.setData({ isMerchantOrder });
  },

  onUnload() {
    const timer = this.data.autoRefreshTimer;
    if (timer) {
      clearTimeout(timer);
    }
  },

  async loadOrder(orderNo, isMockFlag) {
    if (!orderNo) return;
    const isMock = isMockFlag !== undefined ? isMockFlag : this.data.isMock;
    if (isMock) {
      const data = merchantOrderMock.getMockDetailData(orderNo);
      const order = data.order;
      const items = data.items || [];
      const normalizedOrder = {
        order_status: order.order_status || order.orderStatus || '',
        pay_status: order.pay_status || order.payStatus || '',
        goods_amount: order.goods_amount,
        delivery_fee: order.delivery_fee,
        discount_amount: order.discount_amount,
        payable_amount: order.payable_amount,
        receiver_name: order.receiver_name,
        receiver_phone: order.receiver_phone,
        receiver_address: order.receiver_address
      };
      this.setData({
        order,
        items,
        shopIdForChat: order.shop_id != null ? order.shop_id : order.shopId,
        shopNameForChat: order.shop_name || order.shopName || '',
        ...normalizedOrder
      });
      return normalizedOrder;
    }
    try {
      const res = await util.get(`market/orders/${orderNo}`);
      const data = res && res.data ? res.data : res;
      const order = (data && data.order) ? data.order : data;
      const items = (data && Array.isArray(data.items)) ? data.items : [];

      // 统一字段名，避免前端模板里写过多兜底
      const normalizedOrder = {
        order_status: order.order_status || order.orderStatus || '',
        pay_status: order.pay_status || order.payStatus || '',
        goods_amount: order.goods_amount,
        delivery_fee: order.delivery_fee,
        discount_amount: order.discount_amount,
        payable_amount: order.payable_amount,
        receiver_name: order.receiver_name,
        receiver_phone: order.receiver_phone,
        receiver_address: order.receiver_address
      };

      this.setData({
        order,
        items,
        shopIdForChat: order.shop_id != null ? order.shop_id : order.shopId,
        shopNameForChat: order.shop_name || order.shopName || '',
        ...normalizedOrder
      });

      return normalizedOrder;
    } catch (e) {
      wx.showToast({ title: '订单加载失败', icon: 'none' });
      return null;
    }
  },

  async startAutoRefresh(orderNo) {
    // 避免用户触发回调稍晚导致“已支付但页面还显示 unpaid”
    const maxTimes = 20;
    const intervalMs = 2000;
    let count = 0;

    const tick = async () => {
      count += 1;
      const normalized = await this.loadOrder(orderNo);
      const orderStatus = normalized && normalized.order_status;
      const payStatus = normalized && normalized.pay_status;

      if (orderStatus === 'paid' && payStatus === 'paid') {
        return;
      }

      if (count >= maxTimes) {
        return;
      }
      const timer = setTimeout(tick, intervalMs);
      this.setData({ autoRefreshTimer: timer, autoRefreshTimes: count });
    };

    tick();
  },

  itemImage(item) {
    return item.goods_image_snapshot || item.goodsImageSnapshot || item.image || '';
  },

  /** 待支付订单：再次调起微信支付（与确认页共用 marketPay，避免无入口） */
  async payNow() {
    if (this.data.isMock) {
      wx.showToast({ title: '演示模式：不发起真实支付', icon: 'none' });
      return;
    }
    const { orderNo } = this.data;
    if (!orderNo) return;
    await marketPay.startMarketPaymentFlow(orderNo, {
      redirectToDetail: false,
      onPaid: () => this.loadOrder(orderNo)
    });
  },

  /** 买家联系商家；商家端请用 openChatBuyer */
  async openOrderChat() {
    const { orderNo, order, isMock, shopIdForChat, shopNameForChat, isMerchantOrder } = this.data;
    if (!orderNo) return;
    const shopId = shopIdForChat != null ? shopIdForChat : (order && (order.shop_id || order.shopId)) || 1;
    const shopName = shopNameForChat || (order && (order.shop_name || order.shopName)) || '';
    wx.showLoading({ title: '打开会话', mask: true });
    try {
      const payload = {
        order_no: orderNo,
        shop_id: shopId,
        shop_name: shopName,
        buyer_name: (order && order.receiver_name) || '',
        channel: 'shop_buyer'
      };
      if (isMerchantOrder && order) {
        const bid = order.buyer_user_id || order.buyer_id;
        if (bid != null) payload.buyer_user_id = bid;
      }
      const res = await util.post('messages/order-conversation/ensure', payload);
      wx.hideLoading();
      const data = res && res.data !== undefined ? res.data : res;
      const cid = data && data.conversation_id;
      if (!cid) {
        wx.showToast({ title: '无法建立会话', icon: 'none' });
        return;
      }
      const title = shopName || '商家';
      wx.navigateTo({
        url: `/pages/chat/chat?conversationId=${cid}&name=${encodeURIComponent(title)}&orderNo=${encodeURIComponent(orderNo)}`
      });
    } catch (e) {
      wx.hideLoading();
      if (isMock) {
        wx.showToast({ title: '演示环境需连接消息服务', icon: 'none' });
      } else {
        wx.showToast({ title: '暂无法打开会话', icon: 'none' });
      }
    }
  },

  async openChatBuyer() {
    const { orderNo, order, isMock, shopIdForChat, shopNameForChat } = this.data;
    if (!orderNo) return;
    const shopId = shopIdForChat != null ? shopIdForChat : (order && (order.shop_id || order.shopId));
    if (!shopId) {
      wx.showToast({ title: '缺少店铺信息', icon: 'none' });
      return;
    }
    const shopName = shopNameForChat || (order && (order.shop_name || order.shopName)) || '';
    const bid = order && (order.buyer_user_id || order.buyer_id);
    if (!bid) {
      wx.showToast({ title: '缺少买家信息', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '打开会话', mask: true });
    try {
      const res = await util.post('messages/order-conversation/ensure', {
        order_no: orderNo,
        shop_id: shopId,
        shop_name: shopName,
        channel: 'shop_buyer',
        buyer_user_id: bid,
        buyer_name: (order && order.receiver_name) || ''
      });
      wx.hideLoading();
      const data = res && res.data !== undefined ? res.data : res;
      const cid = data && data.conversation_id;
      if (!cid) {
        wx.showToast({ title: '无法建立会话', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/pages/chat/chat?conversationId=${cid}&name=${encodeURIComponent('买家')}&orderNo=${encodeURIComponent(orderNo)}`
      });
    } catch (e) {
      wx.hideLoading();
      if (isMock) wx.showToast({ title: '演示环境需连接消息服务', icon: 'none' });
      else wx.showToast({ title: '暂无法打开会话', icon: 'none' });
    }
  },

  async openChatRider() {
    const { orderNo, order, isMock, shopIdForChat, shopNameForChat } = this.data;
    if (!orderNo) return;
    const shopId = shopIdForChat != null ? shopIdForChat : (order && (order.shop_id || order.shopId));
    const rid = order && (order.rider_user_id || order.delivery_user_id);
    const rname = (order && order.rider_name) || '骑手';
    if (!shopId || !rid) {
      wx.showToast({ title: '暂无骑手信息', icon: 'none' });
      return;
    }
    const shopName = shopNameForChat || (order && (order.shop_name || order.shopName)) || '';
    wx.showLoading({ title: '打开会话', mask: true });
    try {
      const res = await util.post('messages/order-conversation/ensure', {
        order_no: orderNo,
        shop_id: shopId,
        shop_name: shopName,
        channel: 'shop_rider',
        rider_user_id: rid,
        rider_name: rname
      });
      wx.hideLoading();
      const data = res && res.data !== undefined ? res.data : res;
      const cid = data && data.conversation_id;
      if (!cid) {
        wx.showToast({ title: '无法建立会话', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/pages/chat/chat?conversationId=${cid}&name=${encodeURIComponent(rname)}&orderNo=${encodeURIComponent(orderNo)}`
      });
    } catch (e) {
      wx.hideLoading();
      if (isMock) wx.showToast({ title: '演示环境需连接消息服务', icon: 'none' });
      else wx.showToast({ title: '暂无法打开会话', icon: 'none' });
    }
  },

  openRiderMapPage() {
    const { orderNo, order, shopIdForChat } = this.data;
    const shopId = shopIdForChat != null ? shopIdForChat : (order && (order.shop_id || order.shopId));
    if (!orderNo) return;
    wx.navigateTo({
      url: `/pages/rider-location/rider-location?orderNo=${encodeURIComponent(orderNo)}&shopId=${shopId != null ? encodeURIComponent(shopId) : ''}`
    });
  },

  async cancelOrder() {
    if (this.data.isMock) {
      wx.showToast({ title: '演示模式：未请求接口', icon: 'none' });
      return;
    }
    const { orderNo } = this.data;
    if (!orderNo) return;
    wx.showLoading({ title: '取消中...', mask: true });
    try {
      await util.post(`market/orders/${orderNo}/cancel`, {});
      wx.hideLoading();
      wx.showToast({ title: '取消成功', icon: 'none' });
      await this.loadOrder(orderNo);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '取消失败', icon: 'none' });
    }
  }
});

