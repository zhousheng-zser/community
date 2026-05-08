const app = getApp();
const util = require('../../utils/util.js');
const api = require('../../api/index.js');
const config = require('../../utils/config.js');

const MARKET_STATUS_MAP = {
  pending_payment: { text: '待付款', class: 'primary' },
  pending_accept: { text: '待接单', class: 'primary' },
  pending_service: { text: '备货中', class: 'primary' },
  pending_receipt: { text: '待收货', class: 'primary' },
  completed: { text: '已完成', class: 'done' },
  cancelled: { text: '已取消', class: 'cancel' },
  refunded: { text: '已退款', class: 'cancel' }
};

const SERVICE_STATUS_MAP = {
  pending_pay: { text: '待付款', class: 'primary' },
  paid_pending_dispatch: { text: '待平台派单', class: 'primary' },
  pending_accept: { text: '待接单', class: 'primary' },
  dispatched: { text: '已派单', class: 'primary' },
  in_service: { text: '服务中', class: 'primary' },
  pending_user_confirm: { text: '待确认', class: 'primary' },
  completed: { text: '已完成', class: 'done' },
  cancelled: { text: '已取消', class: 'cancel' },
  refunded: { text: '已退款', class: 'cancel' }
};

const MARKET_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待付款' },
  { key: 'pending_accept', label: '待接单' },
  { key: 'pending_service', label: '待服务/备货中' },
  { key: 'pending_receipt', label: '待收货' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
  { key: 'refunded', label: '已退款' }
];

const SERVICE_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending_pay', label: '待付款' },
  { key: 'paid_pending_dispatch', label: '待派单' },
  { key: 'pending_accept', label: '待接单' },
  { key: 'dispatched', label: '已派单' },
  { key: 'in_service', label: '服务中' },
  { key: 'pending_user_confirm', label: '待确认' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
  { key: 'refunded', label: '已退款' }
];

Page({
  data: {
    orderType: 'market',
    tabs: MARKET_TABS,
    activeTab: 'all',
    list: [],
    loading: false,
    loadError: false
  },

  onLoad(options) {
    const type = options.type === 'service' ? 'service' : 'market';
    this.setData({
      orderType: type,
      tabs: type === 'service' ? SERVICE_TABS : MARKET_TABS
    });
    wx.setNavigationBarTitle({ title: type === 'service' ? '到家订单' : '购物订单' });
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  onPullDownRefresh() {
    this.loadOrders().finally(() => wx.stopPullDownRefresh());
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

    const activeTab = this.data.activeTab || 'all';
    let queryStatus = activeTab === 'all' ? '' : activeTab;
    try {
      const params = { page: 1, page_size: 50 };
      if (queryStatus) params.status = queryStatus;

      let res = await this.fetchOrdersByType(params);

      const rawList = res.list || (res.data && res.data.list) || res || [];
      const normalized = rawList.map(this.normalizeOrder.bind(this));
      // 后端在部分环境会忽略 status 参数，这里前端做一次严格分栏兜底，避免各列重复显示同一批订单
      const list = normalized.filter((it) => this.matchTabStatus(it, activeTab));
      this.setData({ list, loading: false, loadError: false });
    } catch (e) {
      // 110.50 调试环境里，携带过期 token 可能 401；接口本身允许匿名访问时做一次无鉴权重试兜底
      if (Number(e && e.errno) === 401) {
        try {
          const retryRes = await this.fetchOrdersWithoutAuth(activeTab);
          const retryRaw = retryRes.list || (retryRes.data && retryRes.data.list) || retryRes || [];
          const normalized = retryRaw.map(this.normalizeOrder.bind(this));
          const list = normalized.filter((it) => this.matchTabStatus(it, activeTab));
          this.setData({ list, loading: false, loadError: false });
          wx.showToast({ title: '登录态已过期，已自动重试', icon: 'none' });
          return;
        } catch (e2) {
          console.error('订单加载失败(401重试后):', e2);
        }
      } else {
        console.error('订单加载失败:', e);
      }
      this.setData({ loading: false, list: [], loadError: true });
      wx.showToast({ title: '订单加载失败，请下拉刷新重试', icon: 'none' });
    }
  },

  fetchOrdersByType(params) {
    if (this.data.orderType === 'service') {
      return api.serviceOrder.getMyList(params);
    }
    return api.market.getMyOrders(params);
  },

  fetchOrdersWithoutAuth(activeTab) {
    const params = { page: 1, page_size: 50 };
    if (activeTab && activeTab !== 'all') params.status = activeTab;
    const base = String(config.baseUrl || '').replace(/\/$/, '');
    const path = this.data.orderType === 'service' ? '/service-orders/my' : '/market/orders';
    return new Promise((resolve, reject) => {
      wx.request({
        url: base + path,
        method: 'GET',
        data: params,
        header: { 'content-type': 'application/x-www-form-urlencoded' },
        success: (res) => {
          const body = res.data || {};
          const hasCode = Object.prototype.hasOwnProperty.call(body, 'code');
          const hasErrno = Object.prototype.hasOwnProperty.call(body, 'errno');
          const codeNum = hasCode ? Number(body.code) : NaN;
          const errnoNum = hasErrno ? Number(body.errno) : NaN;
          if ((hasCode && codeNum !== 0) || (hasErrno && errnoNum !== 0)) {
            reject({ errno: hasCode ? body.code : body.errno, errmsg: body.msg || body.errmsg || '请求失败' });
            return;
          }
          resolve(body.data !== undefined ? body.data : body);
        },
        fail: reject
      });
    });
  },

  normalizeOrder(o) {
    return this.data.orderType === 'service'
      ? this.normalizeServiceOrder(o)
      : this.normalizeMarketOrder(o);
  },

  matchTabStatus(item, tabKey) {
    if (!tabKey || tabKey === 'all') return true;
    const status = String((item && item.status) || '').trim();
    if (!status) return false;
    return status === tabKey;
  },

  normalizeMarketOrder(o) {
    const detail = (o && typeof o === 'object') ? o : {};
    const order = detail.order && typeof detail.order === 'object' ? detail.order : detail;
    const shop = detail.shop && typeof detail.shop === 'object' ? detail.shop : {};
    const rawItems = Array.isArray(detail.items)
      ? detail.items
      : (Array.isArray(order.items) ? order.items : (Array.isArray(detail.goods) ? detail.goods : []));
    const status = order.status || order.order_status || detail.status || detail.order_status || '';
    const statusObj = MARKET_STATUS_MAP[status] || { text: status || '未知', class: '' };
    const goods = rawItems.map((g) => {
      const rawImage = g.image || g.main_image || g.goods_image_snapshot || '';
      return {
        id: g.id || g.goods_id,
        name: g.name || g.goods_name || g.goods_name_snapshot,
        price: String(g.price || g.unit_price || g.unit_price_snapshot || '0.00'),
        quantity: g.quantity || 1,
        image: rawImage ? util.imgUrl(rawImage) : '/img/placeholders/home_cleaning.png'
      };
    });
    return {
      _type: 'market',
      orderNo: order.orderNo || order.order_no || detail.orderNo || detail.order_no,
      shopName: shop.name || order.shopName || order.shop_name || detail.shopName || detail.shop_name,
      shopId: shop.id || order.shopId || order.shop_id || detail.shopId || detail.shop_id,
      status,
      statusText: statusObj.text,
      statusClass: statusObj.class,
      amount: String(order.amount || order.payable_amount || detail.amount || detail.payable_amount || '0.00'),
      totalQuantity: goods.reduce((acc, g) => acc + Number(g.quantity || 1), 0),
      goods
    };
  },

  normalizeServiceOrder(o) {
    const detail = (o && typeof o === 'object') ? o : {};
    const order = detail.order && typeof detail.order === 'object' ? detail.order : detail;
    const service = detail.service && typeof detail.service === 'object' ? detail.service : (order.service || {});
    const worker = detail.worker && typeof detail.worker === 'object' ? detail.worker : (order.worker || {});
    const provider = detail.provider && typeof detail.provider === 'object' ? detail.provider : (order.provider || {});
    const merchant = detail.merchant && typeof detail.merchant === 'object' ? detail.merchant : (order.merchant || {});

    const status = order.status || detail.status || '';
    const statusObj = SERVICE_STATUS_MAP[status] || { text: status || '未知', class: '' };

    const providerName = provider.name || merchant.name || worker.name || worker.worker_name || '到家服务';
    const workerUserId = order.worker_user_id || detail.worker_user_id || worker.user_id || null;
    const merchantUserId = order.merchant_user_id || detail.merchant_user_id || order.provider_user_id || detail.provider_user_id || provider.id || merchant.id || null;

    const rawImage = service.image || service.main_image || service.cover_image || service.cover || '';
    const image = rawImage ? util.imgUrl(rawImage) : '/img/placeholders/home_cleaning.png';

    const title = order.service_title || order.title || service.title || '到家服务';
    const amount = order.amount || order.pay_amount || detail.amount || detail.pay_amount || '0.00';

    const createTime = order.create_time || order.created_at || order.createdAt || detail.create_time || detail.created_at || detail.createdAt || '';
    const time = createTime ? this.formatTime(createTime) : '';

    return {
      _type: 'service',
      id: order.id || detail.id,
      orderNo: order.order_no || order.orderNo || detail.order_no || detail.orderNo || '',
      status,
      statusText: statusObj.text,
      statusClass: statusObj.class,
      providerName,
      workerUserId,
      merchantUserId,
      title,
      image,
      amount: typeof amount === 'number' ? amount.toFixed(2) : String(amount),
      time
    };
  },

  formatTime(timeStamp) {
    if (!timeStamp) return '';
    const date = new Date(timeStamp);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    const orderNo = e.currentTarget.dataset.orderno || '';
    if (this.data.orderType === 'service') {
      if (!id) return;
      let url = `/pages/service-order-detail/service-order-detail?id=${id}`;
      if (orderNo) url += `&orderNo=${encodeURIComponent(orderNo)}`;
      wx.navigateTo({ url });
    } else {
      wx.navigateTo({ url: `../market-order-detail/market-order-detail?orderNo=${orderNo}` });
    }
  },

  // ===== 公共操作入口 =====
  async cancelOrder(e) {
    if (this.data.orderType === 'service') {
      await this._cancelServiceOrder(e);
    } else {
      await this._cancelMarketOrder(e);
    }
  },

  async payOrder(e) {
    if (this.data.orderType === 'service') {
      await this._payServiceOrder(e);
    } else {
      await this._payMarketOrder(e);
    }
  },

  async contactMerchant(e) {
    if (this.data.orderType === 'service') {
      await this._contactProvider(e);
    } else {
      await this._contactShop(e);
    }
  },

  async deleteOrder(e) {
    if (this.data.orderType === 'service') {
      await this._deleteServiceOrder(e);
    } else {
      await this._deleteMarketOrder(e);
    }
  },

  // ===== 集市订单操作 =====
  async _cancelMarketOrder(e) {
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
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  async _payMarketOrder(e) {
    const orderNo = e.currentTarget.dataset.id;
    try {
      const payRes = await api.market.createPayment({ order_no: orderNo, pay_type: 'wechat' });
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
        fail: () => {
          wx.showToast({ title: '支付取消', icon: 'none' });
        }
      });
    } catch (err) {
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

  async _contactShop(e) {
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

  applyRefund(e) {
    const orderNo = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/after-sale-apply/after-sale-apply?orderNo=${orderNo}` });
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
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  async _deleteMarketOrder(e) {
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
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ===== 服务订单操作 =====
  async _cancelServiceOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await util.post(`service-orders/${id}/cancel`);
            wx.showToast({ title: '订单已取消', icon: 'success' });
            this.loadOrders();
          } catch (err) {
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  async _payServiceOrder(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await api.serviceOrder.mockPay(id);
      wx.showToast({ title: '支付成功', icon: 'success' });
      this.loadOrders();
    } catch (err) {
      wx.showModal({
        title: '提示',
        content: '支付功能暂未接入，是否模拟支付成功？',
        success: async (modalRes) => {
          if (modalRes.confirm) {
            try {
              await api.serviceOrder.mockPay(id);
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

  async _contactProvider(e) {
    const orderNo = e.currentTarget.dataset.orderno;
    const workerUidStr = e.currentTarget.dataset.workeruid;
    const merchantUidStr = e.currentTarget.dataset.merchantuid;
    const workerUid = workerUidStr ? Number(workerUidStr) : 0;
    const merchantUid = merchantUidStr ? Number(merchantUidStr) : 0;
    const me = app.globalData.user && app.globalData.user.id ? Number(app.globalData.user.id) : 0;

    if (!orderNo) {
      wx.showToast({ title: '缺少订单号', icon: 'none' });
      return;
    }
    if (!me) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if ((!workerUid || workerUid <= 0) && (!merchantUid || merchantUid <= 0)) {
      wx.showToast({ title: '暂无接单方，请稍后再试', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '打开会话', mask: true });
    try {
      const base = {
        order_no: orderNo,
        customer_user_id: me,
        buyer_name: (app.globalData.user && app.globalData.user.userName) || ''
      };
      const res = merchantUid
        ? await util.post('messages/order-conversation/ensure', Object.assign({}, base, {
            channel: 'merchant_customer',
            merchant_user_id: merchantUid
          }))
        : await util.post('messages/order-conversation/ensure', Object.assign({}, base, {
            channel: 'worker_customer',
            worker_user_id: workerUid
          }));
      const data = res && res.data !== undefined ? res.data : res;
      const cid = data && (data.conversation_id || data.conversationId);
      wx.hideLoading();
      if (!cid) {
        wx.showToast({ title: '无法建立会话', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: `/pages/chat/chat?conversationId=${cid}&name=${encodeURIComponent('服务沟通')}&orderNo=${encodeURIComponent(orderNo)}&orderScene=service_home`
      });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: (err && err.errmsg) || '消息服务暂不可用', icon: 'none' });
    }
  },

  async confirmComplete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确认该服务已完成？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.serviceOrder.confirmOrder(id);
            wx.showToast({ title: '已确认完成', icon: 'success' });
            this.loadOrders();
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  async _deleteServiceOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除该订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await util.del(`service-orders/${id}`);
            wx.showToast({ title: '订单已删除', icon: 'success' });
            this.loadOrders();
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
