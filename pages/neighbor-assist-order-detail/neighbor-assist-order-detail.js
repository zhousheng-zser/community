const util = require('../../utils/util.js');
const naUi = require('../../utils/neighborAssistUi.js');

function maskPhone(p) {
  if (!p || String(p).length < 11) return p || '';
  const s = String(p);
  return s.slice(0, 3) + '****' + s.slice(7);
}

function parseDetail(raw, myUserId) {
  const r = raw && raw.order ? raw.order : raw;
  const uid = myUserId ? Number(myUserId) : 0;
  const id = r.id;
  const orderNo = r.order_no || r.orderNo || String(id);
  const status = r.status || r.order_status || '';
  const statusText = r.status_text || r.status_label || status || '';
  const category = r.category || r.assist_type || '';
  const desc = r.content || r.description || r.title || '';
  const title = desc ? String(desc).slice(0, 28) + (String(desc).length > 28 ? '…' : '') : '邻里帮帮';
  const address = r.address || r.service_address || '';
  const serviceTime = r.service_time || r.expect_time || r.time || '';
  const reward = r.reward_amount != null ? r.reward_amount : r.amount;
  const rewardText =
    reward != null && reward !== '' ? (typeof reward === 'number' ? reward.toFixed(2) : String(reward)) : '';
  const lat = parseFloat(String(r.lat != null ? r.lat : r.latitude || ''), 10);
  const lng = parseFloat(String(r.lng != null ? r.lng : r.longitude || ''), 10);
  const pub = r.publisher || r.publisher_user || {};
  const hel = r.helper || r.assignee || r.worker || {};
  let myRole =
    r.my_role ||
    (r.publisher_id != null && uid && Number(r.publisher_id) === uid
      ? 'publisher'
      : r.helper_id != null && uid && Number(r.helper_id) === uid
        ? 'helper'
        : '');
  let peerPhoneRaw = '';
  let peerName = '';
  if (myRole === 'publisher') {
    peerPhoneRaw = hel.phone || hel.mobile || r.helper_phone || '';
    peerName = hel.nickname || hel.name || '接单邻居';
  } else if (myRole === 'helper') {
    peerPhoneRaw = pub.phone || pub.mobile || r.publisher_phone || '';
    peerName = pub.nickname || pub.name || '发布人';
  }
  return {
    id,
    orderNo,
    statusText,
    title,
    desc,
    category,
    address,
    serviceTime,
    rewardText,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    myRole,
    peerName,
    peerPhoneRaw,
    peerPhoneDisplay: maskPhone(peerPhoneRaw),
    conversationId: r.conversation_id || r.conversationId || null,
    check_in_at: r.check_in_at || r.check_in_time,
    reviewed: !!(r.reviewed || r.has_review)
  };
}

Page({
  data: {
    id: null,
    isMock: false,
    myRole: '',
    peerLabel: '对方',
    bucket: '',
    order: {},
    showServeBlock: false,
    checking: false,
    checkInDisplay: '',
    canCompleteService: false,
    canAcceptOrder: false,
    reviewed: false,
    complaintShow: false,
    complaintText: '',
    reviewShow: false,
    reviewScore: 5,
    reviewText: ''
  },

  onLoad(options) {
    if (options.mock === '1') {
      this.setData({ isMock: true });
    }
    const id = options.id != null ? options.id : options.orderId;
    if (!id) {
      wx.showToast({ title: '缺少订单', icon: 'none' });
      return;
    }
    this.setData({ id: String(id) });
  },

  onShow() {
    if (this.data.id) this.load();
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  applyFromRaw(raw) {
    const app = getApp();
    const uid = app.globalData.user && app.globalData.user.id ? parseInt(String(app.globalData.user.id), 10) : 0;
    const order = parseDetail(raw || {}, uid);
    const bucket = naUi.inferBucket(raw || {});
    const myRole = order.myRole || '';
    const peerLabel = myRole === 'publisher' ? '接单邻居' : myRole === 'helper' ? '发布人' : '对方';
    const showServeBlock = myRole === 'helper' && bucket === 'in_service';
    const canAcceptOrder = !myRole && bucket === 'pending_accept';
    const checkInDisplay = order.check_in_at ? `已打卡 ${order.check_in_at}` : '';
    const canCompleteService = myRole === 'helper' && bucket === 'in_service' && !!checkInDisplay;
    this.setData({
      order: Object.assign({}, order, { myRole }),
      myRole,
      peerLabel,
      bucket,
      showServeBlock,
      checkInDisplay,
      canCompleteService: !!canCompleteService,
      reviewed: !!order.reviewed,
      canAcceptOrder: !!canAcceptOrder
    });
  },

  async load() {
    if (this.data.isMock) {
      this.applyFromRaw(naUi.mockDetail(this.data.id));
      return;
    }
    wx.showNavigationBarLoading();
    try {
      let raw;
      try {
        raw = await util.get(`neighbor-assist/orders/${this.data.id}`);
      } catch (e) {
        if (e && (Number(e.errno) === 404 || Number(e.errno) === 501)) {
          wx.showToast({ title: '使用本地演示数据', icon: 'none' });
          this.applyFromRaw(naUi.mockDetail(this.data.id));
          return;
        }
        throw e;
      }
      this.applyFromRaw(raw || {});
    } catch (e) {
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
    } finally {
      wx.hideNavigationBarLoading();
    }
  },

  copyOrderNo() {
    const no = this.data.order.orderNo;
    if (!no) return;
    wx.setClipboardData({
      data: String(no),
      success: () => wx.showToast({ title: '已复制', icon: 'none' })
    });
  },

  copyAddress() {
    const a = this.data.order.address;
    if (!a) return wx.showToast({ title: '无地址', icon: 'none' });
    wx.setClipboardData({ data: a, success: () => wx.showToast({ title: '已复制', icon: 'none' }) });
  },

  openNav() {
    const { lat, lng, address } = this.data.order;
    if (lat != null && lng != null) {
      wx.openLocation({
        latitude: lat,
        longitude: lng,
        name: '服务地址',
        address: address || '',
        scale: 16
      });
      return;
    }
    if (!address) return wx.showToast({ title: '暂无地址', icon: 'none' });
    wx.chooseLocation({
      success: (loc) => {
        wx.openLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          name: loc.name || '目的地',
          address: loc.address || address,
          scale: 16
        });
      },
      fail: () => wx.showToast({ title: '可改用复制地址到地图', icon: 'none' })
    });
  },

  callPeer() {
    const p = this.data.order.peerPhoneRaw;
    if (!p) return wx.showToast({ title: '无号码', icon: 'none' });
    wx.makePhoneCall({ phoneNumber: String(p) });
  },

  async postAction(path, body) {
    if (this.data.isMock) {
      wx.showToast({ title: '演示模式', icon: 'none' });
      return;
    }
    try {
      await util.post(path, body || {});
      wx.showToast({ title: '已提交', icon: 'success' });
      await this.load();
    } catch (e) {
      wx.showToast({ title: (e && e.errmsg) || '失败', icon: 'none' });
    }
  },

  checkIn() {
    this.setData({ checking: true });
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (loc) => {
        if (this.data.isMock) {
          this.setData({
            checkInDisplay: `已打卡 ${new Date().toLocaleString()}`,
            canCompleteService: true
          });
          wx.showToast({ title: '演示打卡成功', icon: 'success' });
          return;
        }
        this.postAction(`neighbor-assist/orders/${this.data.id}/check-in`, {
          latitude: loc.latitude,
          longitude: loc.longitude
        });
      },
      fail: () => wx.showModal({ title: '需要定位权限', content: '请在设置中开启定位以打卡', showCancel: false }),
      complete: () => this.setData({ checking: false })
    });
  },

  acceptOrder() {
    this.postAction(`neighbor-assist/orders/${this.data.id}/accept`, {});
  },

  completeService() {
    wx.showModal({
      title: '确认完成服务',
      content: '提交后等待发布人确认结单。',
      success: (r) => {
        if (r.confirm) this.postAction(`neighbor-assist/orders/${this.data.id}/complete-service`, {});
      }
    });
  },

  confirmDone() {
    this.postAction(`neighbor-assist/orders/${this.data.id}/confirm`, {});
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

  submitComplaint() {
    const t = (this.data.complaintText || '').trim();
    if (!t) return wx.showToast({ title: '请填写投诉内容', icon: 'none' });
    this.setData({ complaintShow: false });
    this.postAction(`neighbor-assist/orders/${this.data.id}/complaint`, { content: t });
  },

  goReview() {
    this.setData({ reviewShow: true, reviewScore: 5, reviewText: '' });
  },

  closeReview() {
    this.setData({ reviewShow: false });
  },

  onReviewText(e) {
    this.setData({ reviewText: e.detail.value });
  },

  setReviewScore(e) {
    const n = parseInt(e.currentTarget.dataset.score, 10);
    if (n >= 1 && n <= 5) this.setData({ reviewScore: n });
  },

  submitReview() {
    const { reviewScore, reviewText } = this.data;
    this.setData({ reviewShow: false });
    this.postAction(`neighbor-assist/orders/${this.data.id}/review`, {
      score: reviewScore,
      content: (reviewText || '').trim()
    });
  },

  noop() {},

  async openChat() {
    const { order, id, isMock } = this.data;
    let cid = order.conversationId;
    if (isMock) {
      wx.showToast({ title: '演示：无会话 ID', icon: 'none' });
      return;
    }
    if (!cid) {
      try {
        const res = await util.post('neighbor-assist/conversations/ensure', { order_id: id });
        cid = res && (res.conversation_id || res.id || res.conversationId);
      } catch (e) {
        wx.showToast({ title: (e && e.errmsg) || '创建会话失败', icon: 'none' });
        return;
      }
    }
    if (!cid) {
      wx.showToast({ title: '未返回会话 ID', icon: 'none' });
      return;
    }
    const name = encodeURIComponent(order.peerName || '帮帮聊天');
    const orderNo = encodeURIComponent(order.orderNo || '');
    wx.navigateTo({
      url: `/pages/chat/chat?conversationId=${cid}&name=${name}&orderNo=${orderNo}&orderScene=neighbor_assist&orderId=${id}`
    });
  }
});
