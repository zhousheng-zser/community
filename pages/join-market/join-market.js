const app = getApp();
const util = require('../../utils/util.js');
const joinUpload = require('../../utils/joinImageUpload.js');

const CATEGORY_CODE_MAP = {
  '食品生鲜': 'AAAA',
  '美妆洗护': 'AAAB',
  '居家百货': 'AAAC',
  '服装箱包': 'AAAD',
  '母婴系列': 'AAAE',
  '家用电器': 'AAAF',
  '数码产品': 'AAAG',
  '珠宝饰品': 'AAAH',
  '旅游出行': 'AAAI',
  '传统工艺': 'AAAJ'
};

Page({
  data: {
    agreed: false,
    submitting: false,
    categoryList: ['食品生鲜', '美妆洗护', '居家百货', '服装箱包', '母婴系列', '家用电器', '数码产品', '珠宝饰品', '旅游出行', '传统工艺'],
    categoryIndex: -1,
    communityList: [],
    communityIndex: -1,
    placePhotoCount: 0,
    form: {
      contact: '', phone: '', shopName: '', category: '', address: '',
      lat: 0, lng: 0,
      intro: '', promoter: '', creditCode: '', bizName: '', legalPerson: '',
      signboard: '', indoor: '', bizLicense: '', community: '', placePhotos: []
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
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (r) => {
        const path = r.tempFiles[0].tempFilePath;
        const compressed = await joinUpload.ensureUploadable(path, joinUpload.labelOf('market', 'signboard'));
        this.setData({ 'form.signboard': compressed });
      }
    });
  },

  chooseIndoor() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (r) => {
        const path = r.tempFiles[0].tempFilePath;
        const compressed = await joinUpload.ensureUploadable(path, joinUpload.labelOf('market', 'indoor'));
        this.setData({ 'form.indoor': compressed });
      }
    });
  },

  chooseBizLicense() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (r) => {
        const path = r.tempFiles[0].tempFilePath;
        const compressed = await joinUpload.ensureUploadable(path, joinUpload.labelOf('market', 'bizLicense'));
        this.setData({ 'form.bizLicense': compressed });
      }
    });
  },

  choosePlacePhotos() {
    const current = this.data.form.placePhotos || [];
    const remain = 5 - current.length;
    if (remain <= 0) {
      wx.showToast({ title: '实地照最多上传5张', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (r) => {
        const files = (r.tempFiles || []).map((f) => f.tempFilePath).filter(Boolean);
        const compressedList = [];
        for (let i = 0; i < files.length; i++) {
          try {
            compressedList.push(
              await joinUpload.ensureUploadable(
                files[i],
                joinUpload.labelOf('market', 'placePhoto', current.length + i)
              )
            );
          } catch (e) {
            const tip = joinUpload.formatUploadError(e, e && e.image_label);
            wx.showToast({ title: tip, icon: 'none', duration: 3500 });
          }
        }
        const merged = current.concat(compressedList).slice(0, 5);
        this.setData({ 'form.placePhotos': merged, placePhotoCount: merged.length });
      }
    });
  },

  delPlacePhoto(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    const list = (this.data.form.placePhotos || []).slice();
    if (Number.isNaN(idx) || idx < 0 || idx >= list.length) return;
    list.splice(idx, 1);
    this.setData({ 'form.placePhotos': list, placePhotoCount: list.length });
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
    if (!form.signboard) return wx.showToast({ title: '请上传品牌logo', icon: 'none' });
    if (!form.indoor) return wx.showToast({ title: '请上传商家背景图', icon: 'none' });
    if (!form.bizLicense) return wx.showToast({ title: '请上传执照照片/从业资格证', icon: 'none' });
    if (!Array.isArray(form.placePhotos) || form.placePhotos.length < 2) return wx.showToast({ title: '请至少上传2张实地照', icon: 'none' });
    if (!agreed) return wx.showToast({ title: '请先同意入驻协议', icon: 'none' });
    this.setData({ submitting: true });
    wx.showLoading({ title: '图片上传中...', mask: true });
    try {
      wx.showLoading({ title: '上传品牌Logo...', mask: true });
      const logoUrl = await joinUpload.upload('market', 'signboard', form.signboard);
      wx.showLoading({ title: '上传商家背景图...', mask: true });
      const backgroundUrl = await joinUpload.upload('market', 'indoor', form.indoor);
      wx.showLoading({ title: '上传执照照片...', mask: true });
      const licenseUrl = await joinUpload.upload('market', 'bizLicense', form.bizLicense);
      wx.showLoading({ title: '上传实地照...', mask: true });
      const placePhotoUrl = [];
      for (let i = 0; i < form.placePhotos.length; i++) {
        placePhotoUrl.push(await joinUpload.upload('market', 'placePhoto', form.placePhotos[i], { index: i }));
      }

      wx.showLoading({ title: '提交数据中...', mask: true });

      let payload = {
        contact_name: form.contact, 
        phone: form.phone, 
        shop_name: form.shopName,
        category: CATEGORY_CODE_MAP[form.category] || form.category, 
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

      await util.post('market/apply', payload);
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
      const tip = joinUpload.formatUploadError(err, err && err.image_label);
      wx.showToast({ title: tip || '提交失败，请重试', icon: 'none', duration: 3500 });
      this.setData({ submitting: false });
    }
  }
});
