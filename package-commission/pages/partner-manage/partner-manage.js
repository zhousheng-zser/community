const app = getApp();
const api = require('../../../api/index.js');

Page({
  data: {
    form: {
      realName: '',
      phone: '',
      city: '',
      remark: ''
    },
    inviteCode: '',
    loadingInvite: false,
    submitting: false,
    isPartner: false,
    application: null
  },

  onShow() {
    this.prefillFromUser();
    this.loadInviteCode();
    this.loadApplicationStatus();
  },

  prefillFromUser() {
    const user = app.globalData.user || {};
    const patch = {};
    if (user.userName && !this.data.form.realName) patch.realName = user.userName;
    if (user.phone && !this.data.form.phone) patch.phone = user.phone;
    if (Object.keys(patch).length) {
      this.setData({ form: { ...this.data.form, ...patch } });
    }
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key;
    let val = (e.detail && e.detail.value) || '';
    if (key === 'phone') val = val.replace(/\D/g, '').slice(0, 11);
    this.setData({ form: { ...this.data.form, [key]: val } });
  },

  async loadInviteCode() {
    const token = wx.getStorageSync('token');
    if (!token) return;
    this.setData({ loadingInvite: true });
    try {
      const res = await api.user.getInviteCode();
      const data = res && res.data ? res.data : res;
      const code = data.invite_code || data.inviteCode || '';
      this.setData({ inviteCode: code });
      if (code && app.globalData.user) {
        app.globalData.user.inviteCode = code;
      }
    } catch (e) {
      console.error('获取邀请码失败:', e);
    } finally {
      this.setData({ loadingInvite: false });
    }
  },

  async loadApplicationStatus() {
    const token = wx.getStorageSync('token');
    if (!token) return;
    try {
      const res = await api.partner.getApplicationMe();
      const data = res && res.data ? res.data : res;
      this.setData({
        isPartner: !!data.is_partner,
        application: data.application || null
      });
      if (data.application) {
        const a = data.application;
        this.setData({
          form: {
            realName: a.real_name || this.data.form.realName,
            phone: a.phone || this.data.form.phone,
            city: a.city || this.data.form.city,
            remark: a.remark || ''
          }
        });
      }
    } catch (e) {
      console.error('获取申请状态失败:', e);
    }
  },

  async submitApply() {
    if (this.data.submitting || this.data.isPartner) return;
    const { realName, phone, city, remark } = this.data.form;
    const name = String(realName || '').trim();
    const mobile = String(phone || '').trim();
    const cityVal = String(city || '').trim();
    if (!name) {
      wx.showToast({ title: '请填写真实姓名', icon: 'none' });
      return;
    }
    if (!/^1\d{10}$/.test(mobile)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return;
    }
    if (!cityVal) {
      wx.showToast({ title: '请填写所在城市', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中', mask: true });
    try {
      await api.partner.applyPartner({
        role: 'promoter',
        real_name: name,
        phone: mobile,
        city: cityVal,
        remark: String(remark || '').trim()
      });
      wx.hideLoading();
      wx.showToast({ title: '申请成功', icon: 'success' });
      await this.loadApplicationStatus();
      await this.loadInviteCode();
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: (e && (e.msg || e.errmsg)) || '申请失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  copyInviteCode() {
    const code = this.data.inviteCode;
    if (!code) {
      wx.showToast({ title: '邀请码加载中', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    });
  }
});
