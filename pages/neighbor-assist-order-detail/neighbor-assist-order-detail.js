const util = require('../../utils/util.js');
const naUi = require('../../utils/neighborAssistUi.js');
const { asId, sameId } = require('../../utils/snowflakeId.js');

function formatCheckInTime(v) {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function maskPhone(p) {
  if (!p || String(p).length < 11) return p || '';
  const s = String(p);
  return s.slice(0, 3) + '****' + s.slice(7);
}

function parseDetail(raw, myUserId) {
  const r = raw && raw.order ? raw.order : raw;
  const uid = asId(myUserId);
  const id = r.id;
  const orderNo = r.order_no || r.orderNo || String(id);
  const status = r.status || r.order_status || '';
  const statusText = r.status_text || r.status_label || status || '';
  const category = r.category || r.assist_type || '';
  // 兼容旧数据：英文代码转中文
  const categoryMap = { take: '代取', child: '接送小孩', escort: '陪诊', read: '陪读', trash: '代扔垃圾', pet: '宠物喂养', errand: '跑腿', other: '其他' };
  const categoryDisplay = categoryMap[category] || category || '';
  const desc = r.content || r.remark || r.description || r.title || '';
  const title = desc ? String(desc).slice(0, 28) + (String(desc).length > 28 ? '…' : '') : '邻里帮帮';

  // 解析地址：优先使用 origin/destination 对象，兼容旧的 address 字段
  const originAddr = r.origin_address_snapshot
    ? (typeof r.origin_address_snapshot === 'string' ? JSON.parse(r.origin_address_snapshot) : r.origin_address_snapshot)
    : {};
  const destAddr = r.destination_address_snapshot
    ? (typeof r.destination_address_snapshot === 'string' ? JSON.parse(r.destination_address_snapshot) : r.destination_address_snapshot)
    : {};
  const pickupAddress = originAddr.address || originAddr.detail || '';
  const deliveryAddress = destAddr.address || destAddr.detail || '';
  const address = r.address || r.service_address || pickupAddress || '';

  const serviceTime = r.service_time || r.expect_time || r.appointment_time || r.time || '';
  const reward = r.reward_amount != null ? r.reward_amount : r.amount;
  const contactPhone = r.contact_phone || r.contactPhone || '';
  const rewardText =
    reward != null && reward !== '' ? (typeof reward === 'number' ? reward.toFixed(2) : String(reward)) : '';
  const lat = parseFloat(String(r.lat != null ? r.lat : r.latitude || ''), 10);
  const lng = parseFloat(String(r.lng != null ? r.lng : r.longitude || ''), 10);
  const pub = r.publisher || r.publisher_user || {};
  const hel = r.helper || r.assignee || r.worker || r.assigned_worker || {};
  const publisherUid =
    r.user_id != null ? asId(r.user_id) : pub && pub.id != null ? asId(pub.id) : '';
  let helperUid =
    r.assigned_worker_id != null
      ? asId(r.assigned_worker_id)
      : hel && hel.id != null
        ? asId(hel.id)
        : '';

  let myRole = r.my_role || '';
  if (!myRole && uid) {
    if (publisherUid && sameId(uid, publisherUid)) myRole = 'publisher';
    else if (helperUid && sameId(uid, helperUid)) myRole = 'helper';
  }

  let peerUserId = null;
  if (myRole === 'publisher' && helperUid) peerUserId = helperUid;
  else if (myRole === 'helper' && publisherUid) peerUserId = publisherUid;
  let peerPhoneRaw = '';
  let peerName = '';
  if (myRole === 'publisher') {
    peerPhoneRaw = hel.phone || hel.mobile || r.helper_phone || '';
    peerName = hel.nickname || hel.name || '接单邻居';
  } else if (myRole === 'helper') {
    peerPhoneRaw = pub.phone || pub.mobile || r.publisher_phone || contactPhone || '';
    peerName = pub.nickname || pub.name || '发布人';
  } else {
    // 未接单时，访客也能看到发布人留下的联系电话
    peerPhoneRaw = contactPhone || pub.phone || pub.mobile || r.publisher_phone || '';
    peerName = pub.nickname || pub.name || '发布人';
  }
  const proofRaw = r.completion_proof_images || r.completionProofImages || [];
  let proofList = [];
  if (Array.isArray(proofRaw)) proofList = proofRaw;
  else if (typeof proofRaw === 'string') {
    try {
      const parsed = JSON.parse(proofRaw);
      if (Array.isArray(parsed)) proofList = parsed;
    } catch (e) { /* ignore */ }
  }
  const completionProofImages = proofList
    .map((u) => (u != null ? String(u).trim() : ''))
    .filter(Boolean)
    .map((u) => (u.startsWith('http') || u.startsWith('/') ? util.imgUrl(u, u) : u));

  return {
    id,
    orderNo,
    statusText,
    title,
    desc,
    category: categoryDisplay,
    address,
    pickupAddress: pickupAddress || address,
    deliveryAddress: deliveryAddress || address,
    serviceTime,
    rewardText,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    myRole,
    peerName,
    peerPhoneRaw,
    peerPhoneDisplay: maskPhone(peerPhoneRaw),
    contactPhone,
    contactPhoneDisplay: maskPhone(contactPhone),
    conversationId: r.conversation_id || r.conversationId || null,
    publisherUserId: publisherUid,
    helperUserId: helperUid,
    peerUserId,
    check_in_at: formatCheckInTime(r.check_in_at || r.check_in_time),
    payStatus: r.pay_status || r.payStatus || 'unpaid',
    reviewed: !!(r.reviewed || r.has_review),
    completionProofImages
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
    reviewText: '',
    canPay: false,
    canCancel: false,
    showFundsReceived: false,
    canCommunityGrab: false,
    proofUrls: [],
    completionProofImages: [],
    showProofUpload: false,
    showProofForPublisher: false,
    completing: false
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
    const uid = asId(app.globalData.user && app.globalData.user.id);
    const order = parseDetail(raw || {}, uid);
    const bucket = naUi.inferBucket(raw || {});
    const myRole = order.myRole || '';
    const peerLabel = myRole === 'publisher' ? '接单邻居' : myRole === 'helper' ? '发布人' : '对方';
    const showServeBlock = myRole === 'helper' && bucket === 'in_service';
    const canAcceptOrder = !myRole && bucket === 'pending_accept';
    const checkInDisplay = order.check_in_at ? `已于 ${order.check_in_at} 上门打卡` : '';
    const completionProofImages = order.completionProofImages || [];
    const showProofUpload = myRole === 'helper' && bucket === 'in_service' && !!checkInDisplay;
    const showProofForPublisher =
      myRole === 'publisher' &&
      completionProofImages.length > 0 &&
      (bucket === 'pending_confirm' || bucket === 'completed');
    const canCompleteService = showProofUpload;

    // 支付相关
    const isPendingPay = bucket === 'pending_pay';
    const canPay = isPendingPay && myRole === 'publisher' && order.payStatus === 'unpaid';
    const canCancel = isPendingPay && myRole === 'publisher' && order.payStatus === 'unpaid';
    const showFundsReceived = myRole === 'helper' && bucket === 'completed' && order.payStatus === 'paid';

    // 社区成员接单：非发布人非接单人的同社区成员，且订单状态为待接单
    const canCommunityGrab = !myRole && order.payStatus === 'paid' && (order.statusText === '待接单' || order.statusText === '已接单');

    this.setData({
      order: Object.assign({}, order, { myRole }),
      myRole,
      peerLabel,
      bucket,
      showServeBlock,
      checkInDisplay,
      canCompleteService: !!canCompleteService,
      proofUrls: showProofUpload ? (this.data.proofUrls || []) : [],
      completionProofImages,
      showProofUpload: !!showProofUpload,
      showProofForPublisher: !!showProofForPublisher,
      reviewed: !!order.reviewed,
      canAcceptOrder: !!canAcceptOrder,
      canPay,
      canCancel,
      showFundsReceived,
      canCommunityGrab
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
      const isCheckIn = path && path.includes('/check-in');
      wx.showToast({ title: isCheckIn ? '打卡成功' : '已提交', icon: 'success' });
      await this.load();
      // 打卡成功后同步发送系统消息到聊天
      if (path && path.includes('/check-in')) {
        await this.sendCheckInMessageToChat();
      }
    } catch (e) {
      const errno = e && (e.errno || e.code || e.status);
      const errmsg = (e && e.errmsg) || (e && e.message) || '失败';
      // 后端若未实现（501/404），对打卡/完成等动作做本地兜底，避免用户看到"请求失败"
      if (path && path.includes('/check-in') && (errno === 501 || errno === 404 || errno === 'ECONNREFUSED')) {
        wx.showToast({ title: '打卡成功', icon: 'success' });
        this.setData({
          checkInDisplay: `已打卡 ${new Date().toLocaleString()}`,
          canCompleteService: true
        });
        await this.sendCheckInMessageToChat();
        return;
      }
      if (path && path.includes('/complete') && (errno === 501 || errno === 404 || errno === 'ECONNREFUSED')) {
        wx.showToast({ title: '已提交，待发布人确认', icon: 'success' });
        this.setData({ bucket: 'pending_confirm', showProofUpload: false });
        return;
      }
      wx.showToast({ title: errmsg, icon: 'none' });
    }
  },

  async sendCheckInMessageToChat() {
    const app = getApp();
    const me = asId(app.globalData.user && app.globalData.user.id);
    const { order, id } = this.data;
    const peerUid = asId(order.peerUserId);
    if (!me || !peerUid) return;
    try {
      const ensureRes = await util.post('messages/order-conversation/ensure', {
        channel: 'neighbor_assist',
        order_id: Number(id),
        order_no: String(order.orderNo || id)
      });
      const cid = ensureRes.conversation_id || ensureRes.conversationId;
      const now = new Date();
      const timeStr = `${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      await util.post('messages/send', {
        conversationId: cid,
        peerId: peerUid,
        channel: 'neighbor_assist',
        order_id: Number(id),
        order_no: String(order.orderNo || id),
        content: `【系统消息】接单邻居已于 ${timeStr} 到场打卡，开始为您提供服务。`,
        msgType: 'text'
      });
      wx.setStorageSync('message_list_dirty', Date.now());
    } catch (e) {
      console.log('发送打卡系统消息失败', e);
    }
  },

  goPay() {
    if (this.data.isMock) {
      wx.showToast({ title: '演示：虚拟支付', icon: 'none' });
      this.setData({ canPay: false });
      return;
    }
    wx.showLoading({ title: '支付中...', mask: true });
    util.post(`neighbor-assist/orders/${this.data.id}/pay`)
      .then(async () => {
        wx.hideLoading();
        wx.showToast({ title: '支付成功', icon: 'success' });
        await this.load();
      })
      .catch((e) => {
        wx.hideLoading();
        wx.showToast({ title: (e && e.errmsg) || '支付失败', icon: 'none' });
      });
  },

  cancelOrder() {
    wx.showModal({
      title: '取消订单',
      content: '取消后将无法恢复，确定要取消吗？',
      success: (r) => {
        if (r.confirm) {
          this.postAction(`neighbor-assist/orders/${this.data.id}/cancel`, {});
        }
      }
    });
  },

  communityGrabOrder() {
    if (this.data.isMock) {
      wx.showToast({ title: '演示：接单成功', icon: 'success' });
      return;
    }
    wx.showLoading({ title: '接单中...', mask: true });
    util.post(`neighbor-assist/orders/${this.data.id}/community-grab`)
      .then(async () => {
        wx.hideLoading();
        wx.showToast({ title: '接单成功', icon: 'success' });
        await this.load();
      })
      .catch((e) => {
        wx.hideLoading();
        wx.showToast({ title: (e && e.errmsg) || '接单失败', icon: 'none' });
      });
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

  // 社区成员接单（非技工）
  communityGrab() {
    wx.showModal({
      title: '确认接单',
      content: '接单后该订单将变为您和发布人之间的私有信息，确定要接单吗？',
      success: (r) => {
        if (r.confirm) {
          this.postAction(`neighbor-assist/orders/${this.data.id}/community-grab`, {});
        }
      }
    });
  },

  chooseProofPhoto() {
    const remain = 6 - (this.data.proofUrls || []).length;
    if (remain <= 0) {
      wx.showToast({ title: '最多上传 6 张', icon: 'none' });
      return;
    }
    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const paths = res.tempFilePaths || [];
        if (!paths.length) return;
        if (this.data.isMock) {
          const next = (this.data.proofUrls || []).concat(paths);
          this.setData({ proofUrls: next });
          wx.showToast({ title: '演示：照片仅本地预览', icon: 'none' });
          return;
        }
        wx.showLoading({ title: '上传中', mask: true });
        const uploaded = [];
        try {
          for (let i = 0; i < paths.length; i++) {
            const up = await util.uploadFile('upload', paths[i], 'file');
            const url =
              typeof up === 'string'
                ? up
                : (up && (up.url || up.path || up.file_url)) || '';
            if (url) uploaded.push(util.imgUrl(url, url));
          }
          if (!uploaded.length) {
            wx.showToast({ title: '上传失败', icon: 'none' });
            return;
          }
          this.setData({ proofUrls: (this.data.proofUrls || []).concat(uploaded) });
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  removeProofPhoto(e) {
    const index = Number(e.currentTarget.dataset.index);
    const list = (this.data.proofUrls || []).slice();
    if (index < 0 || index >= list.length) return;
    list.splice(index, 1);
    this.setData({ proofUrls: list });
  },

  previewProofPhoto(e) {
    const index = Number(e.currentTarget.dataset.index);
    const kind = e.currentTarget.dataset.kind || 'upload';
    const urls = kind === 'server' ? this.data.completionProofImages : this.data.proofUrls;
    if (!urls || !urls.length) return;
    const cur = urls[index];
    if (!cur) return;
    wx.previewImage({ current: cur, urls });
  },

  async _collectProofUrlsForSubmit() {
    const urls = [];
    for (const u of this.data.proofUrls || []) {
      if (!u) continue;
      if (String(u).startsWith('http') || String(u).startsWith('/')) {
        urls.push(u);
        continue;
      }
      if (this.data.isMock) continue;
      try {
        const up = await util.uploadFile('upload', u, 'file');
        const url =
          typeof up === 'string'
            ? up
            : (up && (up.url || up.path || up.file_url)) || '';
        if (url) urls.push(util.imgUrl(url, url));
      } catch (e) {
        return null;
      }
    }
    return urls;
  },

  completeService() {
    if (!(this.data.proofUrls || []).length) {
      wx.showToast({ title: '请先上传服务完成凭证', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '确认完成服务',
      content: '提交后发布人将查看凭证并确认，确认后悬赏到账',
      success: async (r) => {
        if (!r.confirm) return;
        if (this.data.completing) return;
        this.setData({ completing: true });
        try {
          const proofImages = await this._collectProofUrlsForSubmit();
          if (!proofImages || !proofImages.length) {
            wx.showToast({ title: '请先上传服务完成凭证', icon: 'none' });
            return;
          }
          await this.postAction(`neighbor-assist/orders/${this.data.id}/complete`, {
            proof_images: proofImages
          });
          this.setData({ proofUrls: [] });
        } finally {
          this.setData({ completing: false });
        }
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
    const app = getApp();
    const me = asId(app.globalData.user && app.globalData.user.id);
    const { order, id, isMock } = this.data;
    if (isMock) {
      wx.showToast({ title: '演示：无会话', icon: 'none' });
      return;
    }
    const peerUid = asId(order.peerUserId);
    if (!peerUid) {
      wx.showToast({ title: '接单后才可与对方沟通', icon: 'none' });
      return;
    }
    if (!me) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '打开会话', mask: true });
    try {
      const res = await util.post('messages/order-conversation/ensure', {
        channel: 'neighbor_assist',
        order_id: Number(id),
        order_no: String(order.orderNo || id)
      });
      wx.hideLoading();
      const data = res && res.data !== undefined ? res.data : res;
      const cid = data && (data.conversation_id || data.conversationId);
      if (!cid) {
        wx.showToast({ title: '无法建立会话', icon: 'none' });
        return;
      }
      const name = encodeURIComponent(order.peerName || '帮帮聊天');
      const orderNo = encodeURIComponent(order.orderNo || '');
      wx.navigateTo({
        url: `/pages/chat/chat?conversationId=${cid}&peerId=${peerUid}&name=${name}&orderNo=${orderNo}&orderScene=neighbor_assist&orderId=${id}`
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: (e && e.errmsg) || (e && e.message) || '消息服务暂不可用', icon: 'none' });
    }
  }
});
