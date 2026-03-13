const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    agreed: false,
    submitting: false,
    industryList: ['家政保洁', '上门维修', '管道疏通', '家电维修', '搬家安装', '其他'],
    industryIndex: -1,
    communityList: ['阳光社区', '春风社区', '和谐社区', '幸福里', '翠竹苑', '其他'],
    communityIndex: -1,
    form: {
      shopName: '', logo: '', phone: '', inviteCode: '',
      bizName: '', legalPerson: '', creditCode: '', license: '',
      shopFront: '', envPhoto: '', idCard: '', cert: '', specialCert: '',
      industry: '', community: '', address: ''
    }
  },

  onLoad() {
    const user = app.globalData.user || {};
    this.setData({ 'form.phone': user.userMobile || '' });
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.key]: e.detail.value });
  },

  toggleAgree() { this.setData({ agreed: !this.data.agreed }); },

  comingSoon() { wx.showToast({ title: '敬请期待', icon: 'none' }); },

  onIndustryChange(e) {
    const idx = e.detail.value;
    this.setData({ industryIndex: idx, 'form.industry': this.data.industryList[idx] });
  },

  onCommunityChange(e) {
    const idx = e.detail.value;
    this.setData({ communityIndex: idx, 'form.community': this.data.communityList[idx] });
  },

  chooseLogo() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.logo': r.tempFiles[0].tempFilePath });
    }});
  },

  chooseLicense() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.license': r.tempFiles[0].tempFilePath });
    }});
  },

  chooseShopFront() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.shopFront': r.tempFiles[0].tempFilePath });
    }});
  },

  chooseEnvPhoto() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.envPhoto': r.tempFiles[0].tempFilePath });
    }});
  },

  chooseIdCard() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.idCard': r.tempFiles[0].tempFilePath });
    }});
  },

  chooseCert() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.cert': r.tempFiles[0].tempFilePath });
    }});
  },

  chooseSpecialCert() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.specialCert': r.tempFiles[0].tempFilePath });
    }});
  },

  delField(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.key]: '' });
  },

  saveDraft() {
    wx.showToast({ title: '草稿已保存', icon: 'success' });
  },

  async submit() {
    const { form, agreed, submitting } = this.data;
    if (submitting) return;
    if (!form.shopName) return wx.showToast({ title: '请填写门店名称', icon: 'none' });
    if (!form.industry) return wx.showToast({ title: '请选择意向行业', icon: 'none' });
    if (!form.community) return wx.showToast({ title: '请选择接单社区', icon: 'none' });
    if (!form.bizName) return wx.showToast({ title: '请填写主体名称', icon: 'none' });
    if (!form.creditCode) return wx.showToast({ title: '请填写统一信用代码', icon: 'none' });
    if (!form.license) return wx.showToast({ title: '请上传营业执照', icon: 'none' });
    if (!form.idCard) return wx.showToast({ title: '请上传法人身份证', icon: 'none' });
    if (!agreed) return wx.showToast({ title: '请先同意入驻协议', icon: 'none' });
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });
    try {
      await util.post('service-provider/apply', {
        shop_name: form.shopName, phone: form.phone, invite_code: form.inviteCode,
        biz_name: form.bizName, legal_person: form.legalPerson,
        credit_code: form.creditCode, industry: form.industry, community: form.community
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
