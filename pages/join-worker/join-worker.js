const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    maskedPhone: '',
    agreed: false,
    submitting: false,
    communityList: ['阳光社区', '春风社区', '和谐社区', '幸福里', '翠竹苑', '其他'],
    communityIndex: -1,
    industryList: ['家政保洁', '水电维修', '木工装修', '管道疏通', '家电维修', '搬运安装', '其他'],
    industryIndex: -1,
    educationList: ['初中及以下', '高中/中专', '大专', '本科', '硕士及以上'],
    educationIndex: -1,
    form: {
      avatar: '', realName: '', gender: '男', phone: '', hometown: '',
      idCard: '', address: '', inviteCode: '', education: '', workExp: '',
      resume: '', workHistory: '', community: '', industry: '',
      idFront: '', workPhoto: '', cert: ''
    }
  },

  onLoad() {
    const user = app.globalData.user || {};
    const mobile = user.userMobile || '';
    const maskedPhone = mobile.length >= 11 ? mobile.slice(0, 3) + '****' + mobile.slice(7) : '';
    this.setData({ maskedPhone, 'form.phone': mobile });
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.key]: e.detail.value });
  },

  setGender(e) { this.setData({ 'form.gender': e.currentTarget.dataset.val }); },

  toggleAgree() { this.setData({ agreed: !this.data.agreed }); },

  comingSoon() { wx.showToast({ title: '敬请期待', icon: 'none' }); },

  onCommunityChange(e) {
    const idx = e.detail.value;
    this.setData({ communityIndex: idx, 'form.community': this.data.communityList[idx] });
  },

  onIndustryChange(e) {
    const idx = e.detail.value;
    this.setData({ industryIndex: idx, 'form.industry': this.data.industryList[idx] });
  },

  onEducationChange(e) {
    const idx = e.detail.value;
    this.setData({ educationIndex: idx, 'form.education': this.data.educationList[idx] });
  },

  chooseAvatar() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.avatar': r.tempFiles[0].tempFilePath });
    }});
  },

  chooseIdCard() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.idFront': r.tempFiles[0].tempFilePath });
    }});
  },

  chooseWorkPhoto() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.workPhoto': r.tempFiles[0].tempFilePath });
    }});
  },

  chooseCert() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.cert': r.tempFiles[0].tempFilePath });
    }});
  },

  delField(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.key]: '' });
  },

  async submit() {
    const { form, agreed, submitting } = this.data;
    if (submitting) return;
    if (!form.realName) return wx.showToast({ title: '请填写真实姓名', icon: 'none' });
    if (!form.idCard) return wx.showToast({ title: '请填写身份证号', icon: 'none' });
    if (!form.community) return wx.showToast({ title: '请选择接单社区', icon: 'none' });
    if (!form.industry) return wx.showToast({ title: '请选择意向行业', icon: 'none' });
    if (!form.idFront) return wx.showToast({ title: '请上传身份证照片', icon: 'none' });
    if (!agreed) return wx.showToast({ title: '请先同意入驻协议', icon: 'none' });
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });
    try {
      await util.post('worker/apply', {
        real_name: form.realName, gender: form.gender, phone: form.phone,
        hometown: form.hometown, id_card: form.idCard, address: form.address,
        invite_code: form.inviteCode, education: form.education, work_exp: form.workExp,
        resume: form.resume, work_history: form.workHistory,
        community: form.community, industry: form.industry
      });
      wx.hideLoading();
      wx.showToast({ title: '提交成功，等待审核', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: (err && err.errmsg) || '提交失败，请重试', icon: 'none' });
      this.setData({ submitting: false });
    }
  }
});
