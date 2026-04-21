const app = getApp();
const util = require('../../utils/util.js');

const GROUP_LABELS = {
  tidy: '整理收纳',
  urgent_fix: '家修急事',
  appliance_clean: '家电清洗',
  pioneer_clean: '开荒保洁',
  mite_remove: '除螨服务',
  furniture_care: '家具养护',
  baby_home: '宝宝家事',
  house_repair: '房屋修缮',
  beauty_home: '上门美业'
};

function parseOrder(raw) {
  const r = raw && raw.order ? raw.order : raw;
  if (!r) return null;
  const amt = r.amount != null ? r.amount : r.pay_amount != null ? r.pay_amount : r.goods_price;
  const amountText =
    amt != null && amt !== ''
      ? typeof amt === 'number'
        ? amt.toFixed(2)
        : String(amt)
      : '—';
  const gk = r.group_key || r.service_group_key || r.biz_line || '';
  const merchantUid =
    r.merchant_user_id != null
      ? Number(r.merchant_user_id)
      : r.provider_user_id != null
        ? Number(r.provider_user_id)
        : null;
  const stHay = `${String(r.status || '')} ${String(r.status_text || r.status_label || '')}`.toLowerCase();
  const needUserConfirm =
    /pending_user_confirm|pending_confirm_user|wait_user_confirm|await_customer/.test(stHay) ||
    /待用户确认|待您确认/.test(String(r.status_text || r.status_label || ''));
  return {
    id: r.id,
    orderNo: r.order_no || r.orderNo || String(r.id || ''),
    statusText: r.status_text || r.status_label || r.status || '处理中',
    title: r.service_title || r.title || (r.service && r.service.title) || '到家服务',
    amountText,
    address: r.address || r.service_address || '',
    workerUserId:
      r.worker_user_id != null
        ? Number(r.worker_user_id)
        : r.worker && r.worker.user_id != null
          ? Number(r.worker.user_id)
          : null,
    merchantUserId: merchantUid && merchantUid > 0 ? merchantUid : null,
    needUserConfirm,
    groupLabel: GROUP_LABELS[gk] || gk || '',
    raw: r
  };
}

Page({
  data: {
    loading: true,
    order: {},
    complaintShow: false,
    complaintText: ''
  },

  onLoad(options) {
    const id = options.id != null ? options.id : options.orderId;
    const orderNo = options.orderNo ? decodeURIComponent(options.orderNo) : '';
    if (!id && !orderNo) {
      wx.showToast({ title: '缺少订单参数', icon: 'none' });
      return;
    }
    this._id = id ? String(id) : '';
    this._orderNo = orderNo;
    this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    this.setData({ loading: true });
    try {
      let raw;
      if (this._id) {
        try {
          raw = await util.get(`service-orders/${this._id}`);
        } catch (e) {
          if (this._orderNo) {
            raw = await util.get('service-orders/detail', { order_no: this._orderNo });
          } else {
            throw e;
          }
        }
      } else if (this._orderNo) {
        raw = await util.get('service-orders/detail', { order_no: this._orderNo });
      }
      const order = parseOrder(raw || {});
      if (!order || !order.id) {
        wx.showToast({ title: '订单不存在或未上线', icon: 'none' });
        this.setData({ loading: false });
        return;
      }
      this._id = String(order.id);
      this.setData({ order, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
    }
  },

  async openChat() {
    const { order } = this.data;
    const orderNo = order.orderNo;
    const workerUid = order.workerUserId;
    const merchantUid = order.merchantUserId;
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

  openComplaint() {
    this.setData({ complaintShow: true, complaintText: '' });
  },

  closeComplaint() {
    this.setData({ complaintShow: false });
  },

  onComplaintInput(e) {
    this.setData({ complaintText: e.detail.value });
  },

  async confirmOrderComplete() {
    const id = this._id;
    if (!id) return;
    wx.showLoading({ title: '提交中', mask: true });
    try {
      await util.post(`service-orders/${id}/confirm-complete`, {});
      wx.hideLoading();
      wx.showToast({ title: '已确认完成', icon: 'success' });
      this.load();
    } catch (e1) {
      try {
        await util.post(`service-orders/${id}/confirm`, {});
        wx.hideLoading();
        wx.showToast({ title: '已确认完成', icon: 'success' });
        this.load();
      } catch (e2) {
        wx.hideLoading();
        wx.showToast({ title: (e1 && e1.errmsg) || (e2 && e2.errmsg) || '确认失败', icon: 'none' });
      }
    }
  },

  async submitComplaint() {
    const t = (this.data.complaintText || '').trim();
    if (!t) return wx.showToast({ title: '请填写投诉内容', icon: 'none' });
    const id = this._id;
    if (!id) return;
    this.setData({ complaintShow: false });
    try {
      await util.post(`service-orders/${id}/complaint`, { content: t });
      wx.showToast({ title: '已提交', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: (e && e.errmsg) || '提交失败', icon: 'none' });
    }
  }
});
