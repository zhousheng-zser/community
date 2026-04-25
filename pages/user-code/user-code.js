// pages/user-code/user-code.js
const app = getApp();
const util = require('../../utils/util.js');
const api = require('../../api/index.js');

// 生成二维码图片（使用canvas）
function drawQRCode(ctx, text, size) {
  const w = size || 400;
  ctx.setFillStyle('#fff');
  ctx.fillRect(0, 0, w, w);
  ctx.setFillStyle('#333');
  ctx.setFontSize(24);
  ctx.setTextAlign('center');
  ctx.setTextBaseline('middle');
  ctx.fillText('邀请码', w / 2, w / 2 - 30);
  ctx.setFontSize(40);
  ctx.fillText(text, w / 2, w / 2 + 30);
  ctx.draw();
}

Page({
  data: {
    inviteCode: '',
    userAvatar: '',
    userNickname: '',
    inviteeCount: 0,
    invitees: [],
    hasInviter: false,
    inviterNickname: '',
    loading: true,
    binded: false
  },

  onLoad() {
    this.loadInviteCode();
  },

  onShow() {
    // 每次显示刷新数据
    if (!this.data.inviteCode) {
      this.loadInviteCode();
    }
  },

  async loadInviteCode() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      const res = await api.user.getInviteCode();
      const data = res && res.data ? res.data : res;
      this.setData({
        inviteCode: data.invite_code || '',
        userAvatar: data.avatar_url || (app.globalData.user && app.globalData.user.userPhoto) || '',
        userNickname: data.nickname || (app.globalData.user && app.globalData.user.userName) || '微信用户',
        hasInviter: !!data.inviter,
        inviterNickname: data.inviter ? data.inviter.nickname : '',
        binded: !!data.inviter,
        loading: false
      });
      // 加载邀请人数
      this.loadInviteeCount();
      // 绘制邀请码canvas
      this.drawInviteCode(data.invite_code || '');
    } catch (e) {
      console.error('获取邀请码失败:', e);
      wx.showToast({ title: '获取邀请码失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async loadInviteeCount() {
    try {
      const res = await api.user.getInvitees({ page: 1, limit: 1 });
      const data = res && res.data ? res.data : res;
      this.setData({
        inviteeCount: data.total || 0,
        invitees: data.list || []
      });
    } catch (e) {
      console.error('获取邀请列表失败:', e);
    }
  },

  drawInviteCode(text) {
    const query = wx.createSelectorQuery();
    query.select('#qr-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        const w = res[0].width;
        const h = res[0].height;
        // 背景
        ctx.fillStyle = '#f8f9ff';
        ctx.fillRect(0, 0, w, h);
        // 边框
        ctx.strokeStyle = '#ff7a00';
        ctx.lineWidth = 2;
        ctx.strokeRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);
        // 社区文字
        ctx.fillStyle = '#999';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('社区邀请', w / 2, h * 0.25);
        // 邀请码
        ctx.fillStyle = '#ff7a00';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w / 2, h * 0.5);
        // 提示文字
        ctx.fillStyle = '#999';
        ctx.font = '12px sans-serif';
        ctx.fillText('长按保存', w / 2, h * 0.75);
        ctx.textBaseline = 'alphabetic';
      });
  },

  copyInviteCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        wx.showToast({ title: '邀请码已复制', icon: 'success' });
      }
    });
  },

  scanQRCode() {
    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        if (res.result) {
          this.bindInviter(res.result);
        }
      },
      fail: () => {
        wx.showToast({ title: '扫码取消', icon: 'none' });
      }
    });
  },

  manualInput() {
    wx.showModal({
      title: '输入邀请码',
      editable: true,
      placeholderText: '请输入6位邀请码',
      success: (res) => {
        if (res.confirm && res.content) {
          this.bindInviter(res.content.trim());
        }
      }
    });
  },

  async bindInviter(code) {
    if (this.data.binded) {
      wx.showToast({ title: '已绑定邀请人', icon: 'none' });
      return;
    }
    if (code === this.data.inviteCode) {
      wx.showToast({ title: '不能使用自己的邀请码', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '绑定中...' });
    try {
      const res = await api.user.bindInviter(code);
      wx.hideLoading();
      wx.showToast({ title: '绑定成功', icon: 'success' });
      this.setData({
        hasInviter: true,
        inviterNickname: res && res.data && res.data.inviter ? res.data.inviter.nickname : '',
        binded: true
      });
    } catch (e) {
      wx.hideLoading();
      const msg = (e && e.msg) || (e && e.errmsg) || '绑定失败';
      wx.showToast({ title: msg, icon: 'none' });
    }
  },

  onShareAppMessage() {
    return {
      title: '快来加入社区，我的邀请码：' + this.data.inviteCode,
      path: '/pages/user/user'
    };
  }
});
