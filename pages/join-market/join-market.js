const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    agreed: false,
    submitting: false,
    categoryList: ['食品生鲜', '美妆洗护', '居家百货', '服装箱包', '母婴系列', '家用电器', '数码产品', '珠宝饰品', '旅游出行', '传统工艺'],
    categoryIndex: -1,
    communityList: [],
    communityIndex: -1,
    form: {
      contact: '', phone: '', shopName: '', category: '', address: '',
      lat: 0, lng: 0,
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
    this.fetchCommunities();
  },

  fetchCommunities() {
    util.get('core/communities')
      .then((res) => {
        const list = (res && res.list) || (res && res.data && res.data.list) || [];
        const names = list.map(c => c.name).filter(Boolean);
        if (names.length > 0) {
          this.setData({ communityList: names });
        } else {
          this.setData({ communityList: ['其他'] });
        }
      })
      .catch(() => {
        this.setData({ communityList: ['其他'] });
      });
  },

  onShow() {
    const user = app.globalData.user || {};
    const rp = require('../../utils/rolePortals.js');
    if (rp.canUseMarketPortal(user)) {
      wx.redirectTo({ url: '/package-market/pages/market-home/market-home' });
    }
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.key]: e.detail.value });
  },

  toggleAgree() { this.setData({ agreed: !this.data.agreed }); },

  comingSoon() { wx.showToast({ title: '敬请期待', icon: 'none' }); },

  chooseAddress() {
    wx.chooseLocation({
      success: (res) => {
        // res.name: 地点名称, res.address: 详细地址, res.latitude/longitude: 经纬度
        const addressStr = res.address ? res.address : res.name;
        this.setData({
          'form.address': addressStr,
          'form.lat': res.latitude,
          'form.lng': res.longitude
        });
      },
      fail: (err) => {
        // 用户取消或权限拒绝时不弹提示
        if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
          wx.showModal({
            title: '需要位置权限',
            content: '选择店铺地址需要开启位置权限，请在设置中允许',
            confirmText: '去设置',
            success: (r) => { if (r.confirm) wx.openSetting(); }
          });
        }
      }
    });
  },

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
    if (!form.phone) return wx.showToast({ title: '请填写联系电话', icon: 'none' });
    if (!form.shopName) return wx.showToast({ title: '请填写商家名称', icon: 'none' });
    if (!form.category) return wx.showToast({ title: '请选择商家分类', icon: 'none' });
    if (!form.address) return wx.showToast({ title: '请填写详细地址', icon: 'none' });
    if (!form.signboard && !form.bizLicense) return wx.showToast({ title: '请上传至少一张证件照片', icon: 'none' });
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

      let placePhotoUrl = [];
      let licenseUrl = '';

      if (form.signboard) placePhotoUrl.push(await uploadIfNeeded(form.signboard));
      wx.showLoading({ title: '稍等...', mask: true });
      if (form.indoor) placePhotoUrl.push(await uploadIfNeeded(form.indoor));
      if (form.bizLicense) licenseUrl = await uploadIfNeeded(form.bizLicense);

      wx.showLoading({ title: '提交数据中...', mask: true });
      
      let logoUrl = form.signboard ? await uploadIfNeeded(form.signboard) : '';
      let backgroundUrl = form.indoor ? await uploadIfNeeded(form.indoor) : '';
      
      let payload = {
        contact_name: form.contact, 
        phone: form.phone, 
        shop_name: form.shopName,
        category: form.category, 
        address: form.address,
        latitude: form.lat || undefined,
        longitude: form.lng || undefined,
        description: form.intro || '', 
        promoter_name: form.promoter || '',
        credit_code: form.creditCode || '', 
        legal_person: form.legalPerson || '', 
        entity_name: form.bizName || '',
        logo_url: logoUrl,
        background_url: backgroundUrl,
        license_url: licenseUrl,
        place_photo_url: placePhotoUrl
      };

      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || (Array.isArray(payload[key]) && payload[key].length === 0)) {
          delete payload[key];
        }
      });

      await util.post('market/merchant/apply', payload);
      wx.hideLoading();
      const app = getApp();
      if (app.globalData.user) {
        app.globalData.user.merchant_status = 'pending';
        app.globalData.user.merchantStatus = 'pending';
      }
      wx.showToast({ title: '提交成功，等待审核', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: (err && err.errmsg) || '提交失败，请重试', icon: 'none' });
      this.setData({ submitting: false });
    }
  }
});
