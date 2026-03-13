const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    agreed: false,
    submitting: false,
    categoryList: ['餐饮美食', '生鲜果蔬', '超市便利', '美妆护肤', '服装配饰', '数码家电', '母婴用品', '其他'],
    categoryIndex: -1,
    communityList: ['阳光社区', '春风社区', '和谐社区', '幸福里', '翠竹苑', '其他'],
    communityIndex: -1,
    form: {
      contact: '', phone: '', shopName: '', category: '', address: '',
      intro: '', promoter: '', creditCode: '', bizName: '', legalPerson: '',
      signboard: '', indoor: '', bizLicense: '', community: ''
    }
  },

  onLoad() {
    const user = app.globalData.user || {};
    this.setData({
      'form.phone': user.userMobile || '',
      'form.contact': user.userName || ''
    });
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.key]: e.detail.value });
  },

  toggleAgree() { this.setData({ agreed: !this.data.agreed }); },

  comingSoon() { wx.showToast({ title: '敬请期待', icon: 'none' }); },

  onCategoryChange(e) {
    const idx = e.detail.value;
    this.setData({ categoryIndex: idx, 'form.category': this.data.categoryList[idx] });
  },

  onCommunityChange(e) {
    const idx = e.detail.value;
    this.setData({ communityIndex: idx, 'form.community': this.data.communityList[idx] });
  },

  chooseSignboard() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.signboard': r.tempFiles[0].tempFilePath });
    }});
  },

  chooseIndoor() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.indoor': r.tempFiles[0].tempFilePath });
    }});
  },

  chooseBizLicense() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (r) => {
      this.setData({ 'form.bizLicense': r.tempFiles[0].tempFilePath });
    }});
  },

  delField(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.key]: '' });
  },

  async submit() {
    const { form, agreed, submitting } = this.data;
    if (submitting) return;
    if (!form.contact) return wx.showToast({ title: '请填写联系人', icon: 'none' });
    if (!form.shopName) return wx.showToast({ title: '请填写商家名称', icon: 'none' });
    if (!form.category) return wx.showToast({ title: '请选择商家分类', icon: 'none' });
    if (!form.community) return wx.showToast({ title: '请选择所在社区', icon: 'none' });
    if (!form.signboard) return wx.showToast({ title: '请上传店铺招牌照片', icon: 'none' });
    if (!agreed) return wx.showToast({ title: '请先同意入驻协议', icon: 'none' });
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });
    try {
      await util.post('market/apply', {
        contact: form.contact, phone: form.phone, shop_name: form.shopName,
        category: form.category, intro: form.intro, promoter: form.promoter,
        credit_code: form.creditCode, biz_name: form.bizName,
        legal_person: form.legalPerson, community: form.community
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
