const util = require('../../../utils/util.js');
const workerOrderUi = require('../../../utils/workerOrderUi.js');
const workerOrderMock = require('../../../utils/workerOrderMock.js');

function maskPhone(p) {
  if (!p || String(p).length < 11) return p || '';
  const s = String(p);
  return s.slice(0, 3) + '****' + s.slice(7);
}

function normalizePhotoList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((u) => (u ? util.imgUrl(u, u) : '')).filter(Boolean);
}

function formatCheckInInfo(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const t =
    raw.check_in_at ||
    raw.check_in_time ||
    raw.worker_check_in_at ||
    raw.checkInAt ||
    (raw.check_in && raw.check_in.created_at);
  if (!t) return '';
  if (typeof t === 'string') return `打卡时间：${t}`;
  return '已完成定位打卡';
}

function parseDetail(raw) {
  const addr = raw.address || raw.service_address || (raw.user && raw.user.address) || '';
  const phone =
    raw.contact_phone ||
    raw.phone ||
    raw.user_mobile ||
    (raw.user && (raw.user.phone || raw.user.mobile)) ||
    '';
  const lat = parseFloat(String(raw.lat != null ? raw.lat : raw.latitude || raw.address_lat || ''), 10);
  const lng = parseFloat(String(raw.lng != null ? raw.lng : raw.longitude || raw.address_lng || ''), 10);
  const amount = raw.pay_amount != null ? raw.pay_amount : raw.amount != null ? raw.amount : raw.total_amount;
  const customerUserIdRaw =
    raw.customer_user_id != null
      ? raw.customer_user_id
      : raw.user_id != null
        ? raw.user_id
        : raw.userId != null
          ? raw.userId
          : raw.user && raw.user.id != null
            ? raw.user.id
            : null;
  const customerUserIdNum =
    customerUserIdRaw != null && customerUserIdRaw !== ''
      ? Number(customerUserIdRaw)
      : NaN;
  const customerUserId =
    Number.isFinite(customerUserIdNum) && customerUserIdNum > 0 ? customerUserIdNum : null;
  return {
    id: raw.id,
    orderNo: raw.order_no || raw.orderNo || String(raw.id),
    amountText:
      amount != null && amount !== ''
        ? (typeof amount === 'number' ? amount.toFixed(2) : String(amount))
        : '',
    statusText: raw.status_text || raw.status_label || raw.status || '',
    title: raw.service_title || raw.title || (raw.service && raw.service.title) || '到家服务订单',
    bookTime: raw.book_time || raw.appointment_time || raw.reserve_time || '',
    contactName: raw.contact_name || raw.contactName || '',
    phoneRaw: phone,
    phoneDisplay: maskPhone(phone),
    address: addr,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    customerUserId,
    raw
  };
}

Page({
  data: {
    id: null,
    isMock: false,
    order: {},
    showServeBlock: true,
    beforeUrls: [],
    afterUrls: [],
    checking: false,
    canAccept: false,
    canReject: false,
    canComplete: false,
    checkInDisplay: ''
  },

  onLoad(options) {
    if (options.mock === '1') {
      this.setData({ isMock: true, id: 'mock' });
      return;
    }
    const id = options.id != null ? options.id : options.orderId;
    if (!id) {
      wx.showToast({ title: '缺少订单', icon: 'none' });
      return;
    }
    this.setData({ id: String(id) });
  },

  onShow() {
    if (this.data.isMock || this.data.id) {
      this.load();
      this.tryRequestSubscribe();
    }
  },

  applyFromRaw(raw) {
    if (raw && raw.order && typeof raw.order === 'object') raw = raw.order;
    const order = parseDetail(raw || {});
    const bucket = workerOrderUi.inferBucket(
      Object.assign({}, raw || {}, {
        statusText: order.statusText,
        status_text: order.statusText
      })
    );
    const canAccept = bucket === 'pending_accept';
    const canReject = bucket === 'pending_accept';
    const canComplete = bucket === 'pending_visit' || bucket === 'in_service';
    const showServeBlock = bucket === 'pending_visit' || bucket === 'in_service';
    let beforeUrls = (raw && raw.before_photos) || (raw && raw.evidence_before) || [];
    let afterUrls = (raw && raw.after_photos) || (raw && raw.evidence_after) || [];
    beforeUrls = normalizePhotoList(Array.isArray(beforeUrls) ? beforeUrls : []);
    afterUrls = normalizePhotoList(Array.isArray(afterUrls) ? afterUrls : []);
    const checkInDisplay = formatCheckInInfo(raw);
    this.setData({
      order,
      canAccept,
      canReject,
      canComplete,
      showServeBlock,
      beforeUrls,
      afterUrls,
      checkInDisplay
    });
  },

  tryRequestSubscribe() {
    if (!wx.requestSubscribeMessage) return;
    const tmplIds = [];
    if (!tmplIds.length) return;
    wx.requestSubscribeMessage({ tmplIds, fail: () => {} });
  },

  copyOrderNo() {
    const no = this.data.order.orderNo;
    if (!no) return;
    wx.setClipboardData({
      data: String(no),
      success: () => wx.showToast({ title: '订单号已复制', icon: 'none' })
    });
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },

  async load() {
    if (this.data.isMock) {
      wx.showNavigationBarLoading();
      try {
        this.applyFromRaw(workerOrderMock.getMockOrderRaw());
      } finally {
        wx.hideNavigationBarLoading();
      }
      return;
    }
    const { id } = this.data;
    wx.showNavigationBarLoading();
    try {
      let raw;
      try {
        raw = await util.get(`worker/service-orders/${id}`);
      } catch (e1) {
        if (e1 && (Number(e1.errno) === 404 || Number(e1.errno) === 501)) {
          raw = await util.get(`service-orders/${id}`);
        } else {
          throw e1;
        }
      }
      this.applyFromRaw(raw || {});
    } catch (e) {
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
    } finally {
      wx.hideNavigationBarLoading();
    }
  },

  callUser() {
    const p = this.data.order.phoneRaw;
    if (!p) {
      wx.showToast({ title: '无联系电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({ phoneNumber: String(p) });
  },

  copyAddress() {
    const a = this.data.order.address;
    if (!a) {
      wx.showToast({ title: '无地址可复制', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: a,
      success: () => wx.showToast({ title: '地址已复制', icon: 'none' })
    });
  },

  openNav() {
    const { lat, lng, address } = this.data.order;
    if (lat != null && lng != null) {
      wx.openLocation({
        latitude: lat,
        longitude: lng,
        name: '客户地址',
        address: address || '',
        scale: 16
      });
      return;
    }
    if (!address) {
      wx.showToast({ title: '暂无地址信息', icon: 'none' });
      return;
    }
    wx.showActionSheet({
      itemList: ['地图选点导航（推荐）', '复制地址到地图 App'],
      success: (res) => {
        if (res.tapIndex === 0) {
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
            fail: () => {
              wx.showToast({ title: '需要位置权限以选点', icon: 'none' });
            }
          });
        } else if (res.tapIndex === 1) {
          this.copyAddress();
        }
      }
    });
  },

  async postAction(path, body, opt) {
    if (this.data.isMock) {
      wx.showToast({ title: '演示模式：未请求真实接口', icon: 'none' });
      return;
    }
    const skipReload = opt && opt.skipReload;
    try {
      await util.post(path, body || {});
      wx.showToast({ title: '已提交', icon: 'success' });
      if (!skipReload) await this.load();
    } catch (e) {
      wx.showToast({
        title: (e && e.errmsg) || '接口待上线或失败',
        icon: 'none'
      });
    }
  },

  checkIn() {
    this.setData({ checking: true });
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (loc) => {
        if (this.data.isMock) {
          const now = new Date();
          const t = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
          this.setData({
            checkInDisplay: `演示打卡成功（${t}） lat:${loc.latitude.toFixed(5)} lng:${loc.longitude.toFixed(5)}`
          });
          wx.showToast({ title: '演示：打卡成功', icon: 'success' });
          return;
        }
        const { id } = this.data;
        this.postAction(`worker/service-orders/${id}/check-in`, {
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy
        });
      },
      fail: () => {
        wx.showModal({
          title: '需要定位权限',
          content: '请在系统设置中允许小程序使用定位，以便上门打卡。',
          showCancel: false
        });
      },
      complete: () => this.setData({ checking: false })
    });
  },

  chooseBefore() {
    this._pickPhoto('before');
  },

  chooseAfter() {
    this._pickPhoto('after');
  },

  previewPhoto(e) {
    const kind = e.currentTarget.dataset.kind;
    const index = Number(e.currentTarget.dataset.index);
    const urls = kind === 'after' ? this.data.afterUrls : this.data.beforeUrls;
    if (!urls || !urls.length) return;
    const cur = urls[index];
    if (!cur) return;
    wx.previewImage({ current: cur, urls });
  },

  _pickPhoto(kind) {
    wx.chooseImage({
      count: 3,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const paths = res.tempFilePaths || [];
        const key = kind === 'before' ? 'beforeUrls' : 'afterUrls';
        if (this.data.isMock) {
          const next = (this.data[key] || []).concat(paths);
          this.setData({ [key]: next });
          wx.showToast({ title: '演示：照片仅本地预览', icon: 'none' });
          return;
        }
        const urls = [];
        for (let i = 0; i < paths.length; i++) {
          try {
            const up = await util.uploadFile('upload', paths[i], 'file');
            const url =
              typeof up === 'string'
                ? up
                : (up && (up.url || up.path || up.file_url)) || '';
            if (url) urls.push(util.imgUrl(url, url));
          } catch (e) {
            wx.showToast({ title: '图片上传失败', icon: 'none' });
            return;
          }
        }
        if (!urls.length) return;
        const { id } = this.data;
        const next = (this.data[key] || []).concat(urls);
        this.setData({ [key]: next });
        await this.postAction(
          `worker/service-orders/${id}/evidence`,
          { kind, urls },
          { skipReload: true }
        );
      }
    });
  },

  applyAddon() {
    const { id } = this.data;
    wx.showModal({
      title: '现场加项 / 加价申请',
      editable: true,
      placeholderText: '例：增加拆旧清运，加价 80 元',
      success: (res) => {
        if (!res.confirm) return;
        const remark = (res.content != null ? String(res.content) : '').trim();
        if (!remark) {
          wx.showToast({ title: '请填写加项说明与金额诉求', icon: 'none' });
          return;
        }
        this.postAction(`worker/service-orders/${id}/addon-request`, {
          remark,
          content: remark
        });
      }
    });
  },

  doAccept() {
    const { id } = this.data;
    this.postAction(`worker/service-orders/${id}/accept`, {});
  },

  doReject() {
    wx.showModal({
      title: '拒单',
      content: '确认拒绝该订单？',
      success: (res) => {
        if (res.confirm) {
          const { id } = this.data;
          this.postAction(`worker/service-orders/${id}/reject`, { reason: '技工拒单' });
        }
      }
    });
  },

  doComplete() {
    const { id } = this.data;
    wx.showModal({
      title: '服务完成确认',
      content: '确认已完成全部约定服务？提交后订单将进入完成流程。',
      confirmText: '确认完成',
      success: (r) => {
        if (r.confirm) this.postAction(`worker/service-orders/${id}/complete`, {});
      }
    });
  },

  async openCustomerChat() {
    const app = getApp();
    const uid = app.globalData.user && app.globalData.user.id;
    const { order, isMock } = this.data;
    const orderNo = order.orderNo;
    const customerId = order.customerUserId;
    if (!orderNo) {
      wx.showToast({ title: '缺少订单号', icon: 'none' });
      return;
    }
    if (!customerId) {
      wx.showToast({ title: '缺少客户信息', icon: 'none' });
      return;
    }
    if (!uid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '打开会话', mask: true });
    try {
      const res = await util.post('messages/order-conversation/ensure', {
        order_no: orderNo,
        channel: 'worker_customer',
        worker_user_id: uid,
        customer_user_id: customerId,
        buyer_name: order.contactName || ''
      });
      wx.hideLoading();
      const data = res && res.data !== undefined ? res.data : res;
      const cid = data && data.conversation_id;
      if (!cid) {
        wx.showToast({ title: '无法建立会话', icon: 'none' });
        return;
      }
      const title = order.contactName || '客户';
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
  }
});
