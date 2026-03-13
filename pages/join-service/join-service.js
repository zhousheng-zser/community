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
      industry: '', community: '', address: '杭州市西湖区文一西路 (临时填充)'
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
    if (!form.legalPerson) return wx.showToast({ title: '请填写联系人', icon: 'none' });
    if (!form.phone) return wx.showToast({ title: '请填写联系电话', icon: 'none' });
    if (!form.shopName) return wx.showToast({ title: '请填写门店名称', icon: 'none' });
    if (!form.license) return wx.showToast({ title: '请上传营业执照', icon: 'none' });
    if (!form.idCard) return wx.showToast({ title: '请上传法人身份证', icon: 'none' });
    if (!agreed) return wx.showToast({ title: '请先同意入驻协议', icon: 'none' });
    this.setData({ submitting: true });
    wx.showLoading({ title: '图片上传中...', mask: true });
    try {
      const uploadIfNeeded = async (path) => {
        if (!path || path.startsWith('http') && !path.startsWith('http://tmp')) return path;
        if (path.includes('/uploads/')) return path;
        const res = await util.uploadFile('upload', path, 'file');
        return (res && res.url) ? res.url : res;
      };

      let licenseUrl = await uploadIfNeeded(form.license);
      let idCardUrl = await uploadIfNeeded(form.idCard);
      
      wx.showLoading({ title: '稍等...', mask: true });
      let shopFrontUrl = await uploadIfNeeded(form.shopFront);
      
      let environmentUrl = [];
      if (form.envPhoto) environmentUrl.push(await uploadIfNeeded(form.envPhoto));

      let certificateUrl = [];
      if (form.cert) certificateUrl.push(await uploadIfNeeded(form.cert));
      if (form.specialCert) certificateUrl.push(await uploadIfNeeded(form.specialCert));

      wx.showLoading({ title: '提交数据中...', mask: true });
      let payload = {
        shop_name: form.shopName,
        contact_name: form.legalPerson || '负责人', // fallback as frontend doesn't have standalone contact string
        phone: form.phone,
        license_url: licenseUrl,
        shop_front_url: shopFrontUrl || '',
        environment_url: environmentUrl,
        id_card_url: idCardUrl,
        certificate_url: certificateUrl
      };

      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || (Array.isArray(payload[key]) && payload[key].length === 0)) {
          delete payload[key];
        }
      });

      await util.post('service-provider/apply', payload);
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
