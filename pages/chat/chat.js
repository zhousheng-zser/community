const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    conversationId: null,
    peerId: null,
    orderNo: '',
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
          if (row.msg_type === 'image' && row.content) {
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
    const no = this.data.orderNo;
    if (!no) return;
    wx.navigateTo({
      url: `/pages/market-order-detail/market-order-detail?orderNo=${encodeURIComponent(no)}`
    });
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
