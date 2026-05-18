const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    maskedPhone: '',
    agreed: false,
    submitting: false,
    communityList: [],
    communityIndex: -1,
    form: {
      realName: '',
      gender: '男',
      phone: '',
      idCard: '',
      community: '',
      intro: '',
      idFront: ''
    }
  },

  onLoad() {
    const user = app.globalData.user || {};
    const mobile = user.userMobile || user.phone || '';
    const maskedPhone = mobile.length >= 11 ? mobile.slice(0, 3) + '****' + mobile.slice(7) : '';
    this.setData({ maskedPhone, 'form.phone': mobile });
    this.fetchCommunities();
  },

  fetchCommunities() {
    const applyNames = (res) => {
      const list = (res && res.list) || (res && res.data && res.data.list) || (Array.isArray(res && res.data) ? res.data : []) || [];
      const names = list.map((c) => c.name || c.community_name || c.title).filter(Boolean);
      if (names.length > 0) {
        this.setData({ communityList: names });
        return true;
      }
      return false;
    };
    util.get('geo/communities')
      .then((res) => {
        if (!applyNames(res)) this.setData({ communityList: ['其他'] });
      })
      .catch(() => {
        util.get('core/communities')
          .then((res2) => {
            if (!applyNames(res2)) this.setData({ communityList: ['其他'] });
          })
          .catch(() => {
            this.setData({ communityList: ['其他'] });
          });
      });
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.key]: e.detail.value });
  },

  setGender(e) {
    this.setData({ 'form.gender': e.currentTarget.dataset.val });
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  onCommunityChange(e) {
    const idx = e.detail.value;
    this.setData({ communityIndex: idx, 'form.community': this.data.communityList[idx] });
  },

  chooseIdCard() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (r) => {
        this.setData({ 'form.idFront': r.tempFiles[0].tempFilePath });
      }
    });
  },

  async submit() {
    const { form, agreed, submitting } = this.data;
    if (submitting) return;
    if (!form.realName) return wx.showToast({ title: '请填写真实姓名', icon: 'none' });
    if (!form.phone) return wx.showToast({ title: '系统未能获取到手机号', icon: 'none' });
    if (!form.idCard) return wx.showToast({ title: '请填写身份证号', icon: 'none' });
    if (!form.community) return wx.showToast({ title: '请选择服务社区', icon: 'none' });
    if (!form.idFront) return wx.showToast({ title: '请上传身份证照片', icon: 'none' });
    if (!agreed) return wx.showToast({ title: '请先同意入驻协议', icon: 'none' });

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });
    try {
      let idCardUrl = form.idFront;
      if (idCardUrl && !idCardUrl.includes('/uploads/') && !idCardUrl.startsWith('http')) {
        const up = await util.uploadFile('upload', idCardUrl, 'file');
        idCardUrl = (up && up.url) ? up.url : up;
      }
      await util.post('steward/apply', {
        name: form.realName,
        phone: form.phone,
        gender: form.gender,
        community_name: form.community,
        id_card: form.idCard,
        id_card_url: idCardUrl,
        intro: form.intro || ''
      });
      if (app.globalData.user) {
        app.globalData.user.steward_status = 'pending';
        app.globalData.user.stewardStatus = 'pending';
      }
      wx.hideLoading();
      wx.showToast({ title: '提交成功，等待审核', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: (err && err.errmsg) || '提交失败', icon: 'none' });
      this.setData({ submitting: false });
    }
  }
});
