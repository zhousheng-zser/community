const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    conversationId: null,
    peerId: null,
    orderNo: '',
    orderId: '',
    orderScene: '',
    myUserId: null,
    history: [],
    inputText: '',
    scrollIntoView: '',
    shopIdForApi: null,
    emojis: ['😀', '😊', '👍', '❤️', '🙏', '✅', '📞', '📍', '⏰', '💰']
  },

  insertEmoji(e) {
    const em = e.currentTarget.dataset.e || '';
    if (!em) return;
    this.setData({ inputText: (this.data.inputText || '') + em });
  },

  onLoad(options) {
    const title = options.name ? decodeURIComponent(options.name) : '会话';
    wx.setNavigationBarTitle({ title: title.length > 12 ? title.slice(0, 12) + '…' : title });

    const uid = app.globalData.user && app.globalData.user.id ? parseInt(String(app.globalData.user.id), 10) : 0;
    const u = app.globalData.user || {};
    const sid = u.shop_id != null ? u.shop_id : u.shopId;
    const shopIdForApi = sid != null && sid !== '' ? sid : null;

    this.setData({
      conversationId: options.conversationId,
      peerId: options.peerId,
      orderNo: options.orderNo ? decodeURIComponent(options.orderNo) : '',
      orderId: options.orderId ? String(options.orderId) : '',
      orderScene: options.orderScene ? String(options.orderScene) : '',
      myUserId: uid,
      shopIdForApi
    });
    if (this.data.conversationId) {
      this.fetchHistory();
    } else {
      wx.showToast({ title: '缺少会话 ID', icon: 'none' });
    }
  },

  fetchHistory() {
    const q = {};
    if (this.data.shopIdForApi != null) {
      q.shop_id = this.data.shopIdForApi;
    }
    util
      .get(`messages/history/${this.data.conversationId}`, q)
      .then((res) => {
        const raw = Array.isArray(res) ? res : [];
        const history = raw.map((m) => {
          const row = Object.assign({}, m);
          const mt = row.msg_type || row.msgType;
          row.msg_type = mt;
          if (mt === 'image' && row.content) {
            row.content = util.imgUrl(row.content);
          }
          if (mt === 'audio' && row.content) {
            row.content = util.imgUrl(row.content);
          }
          return row;
        });
        this.setData({ history }, () => this.scrollToBottom());
      })
      .catch(() => {
        wx.showToast({ title: '加载历史失败', icon: 'none' });
      });
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  sendText() {
    if (!this.data.inputText.trim()) return;
    const text = this.data.inputText;
    const payload = {
      conversationId: this.data.conversationId,
      content: text,
      msgType: 'text'
    };
    if (this.data.shopIdForApi != null) {
      payload.shop_id = this.data.shopIdForApi;
    }

    const tempMsg = {
      id: 'temp_' + Date.now(),
      sender_id: this.data.myUserId,
      msg_type: 'text',
      content: text,
      created_at: new Date().toISOString()
    };
    this.setData(
      {
        history: [...this.data.history, tempMsg],
        inputText: ''
      },
      () => this.scrollToBottom()
    );

    util
      .post('messages/send', payload)
      .then(() => this.fetchHistory())
      .catch(() => {
        wx.showToast({ title: '发送失败', icon: 'none' });
        this.fetchHistory();
      });
  },

  sendImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '发送中', mask: true });
        const formData = {};
        if (this.data.shopIdForApi != null) {
          formData.shop_id = String(this.data.shopIdForApi);
        }
        util
          .uploadFile('messages/upload', tempFilePath, 'file', formData)
          .then((data) => {
            let path = data.url || data.path;
            if (!path) throw new Error('no url');
            const displayUrl = util.imgUrl(path);
            const payload = {
              conversationId: this.data.conversationId,
              content: displayUrl,
              msgType: 'image'
            };
            if (this.data.shopIdForApi != null) {
              payload.shop_id = this.data.shopIdForApi;
            }
            return util.post('messages/send', payload);
          })
          .then(() => {
            wx.hideLoading();
            this.fetchHistory();
          })
          .catch(() => {
            wx.hideLoading();
            wx.showToast({ title: '图片发送失败', icon: 'none' });
          });
      }
    });
  },

  goOrderDetail() {
    const { orderScene, orderId, orderNo } = this.data;
    if (orderScene === 'neighbor_assist' && orderId) {
      wx.navigateTo({
        url: `/pages/neighbor-assist-order-detail/neighbor-assist-order-detail?id=${encodeURIComponent(orderId)}`
      });
      return;
    }
    if (orderScene === 'service_home' && orderNo) {
      wx.navigateTo({
        url: `/pages/service-order-detail/service-order-detail?orderNo=${encodeURIComponent(orderNo)}`
      });
      return;
    }
    if (!orderNo) return;
    wx.navigateTo({
      url: `/pages/market-order-detail/market-order-detail?orderNo=${encodeURIComponent(orderNo)}`
    });
  },

  onVoiceTouchStart() {
    if (!this._recorder) {
      this._recorder = wx.getRecorderManager();
      this._recorder.onStop((res) => {
        const p = res.tempFilePath;
        if (!p || res.duration < 300) {
          if (res.duration < 300) wx.showToast({ title: '录音太短', icon: 'none' });
          return;
        }
        wx.showLoading({ title: '发送中', mask: true });
        const formData = { type: 'audio' };
        if (this.data.shopIdForApi != null) formData.shop_id = String(this.data.shopIdForApi);
        util
          .uploadFile('messages/upload', p, 'file', formData)
          .then((data) => {
            let path = data.url || data.path;
            if (!path) throw new Error('no url');
            const displayUrl = util.imgUrl(path);
            const payload = {
              conversationId: this.data.conversationId,
              content: displayUrl,
              msgType: 'audio'
            };
            if (this.data.shopIdForApi != null) payload.shop_id = this.data.shopIdForApi;
            return util.post('messages/send', payload);
          })
          .then(() => {
            wx.hideLoading();
            this.fetchHistory();
          })
          .catch(() => {
            wx.hideLoading();
            wx.showToast({ title: '语音发送失败', icon: 'none' });
          });
      });
    }
    this._recorder.start({ format: 'mp3', duration: 60000 });
  },

  onVoiceTouchEnd() {
    if (this._recorder) this._recorder.stop();
  },

  playAudio(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    if (!this.innerAudio) this.innerAudio = wx.createInnerAudioContext();
    this.innerAudio.stop();
    this.innerAudio.src = url;
    this.innerAudio.play();
  },

  scrollToBottom() {
    if (this.data.history.length > 0) {
      const lastMsg = this.data.history[this.data.history.length - 1];
      this.setData({
        scrollIntoView: 'msg_' + lastMsg.id
      });
    }
  }
});
