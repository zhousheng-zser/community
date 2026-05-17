const app = getApp();
const util = require('../../utils/util.js');
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

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
        const compressed = await this.ensureUploadableImage(path);
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
        const compressed = await this.ensureUploadableImage(path);
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
        const compressed = await this.ensureUploadableImage(path);
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
            compressedList.push(await this.ensureUploadableImage(files[i]));
          } catch (e) {
            console.log('compress place photo failed', e);
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

  getFileSize(path) {
    return new Promise((resolve) => {
      if (!path) {
        resolve(Number.MAX_SAFE_INTEGER);
        return;
      }
      wx.getFileInfo({
        filePath: path,
        success: (res) => resolve(Number(res.size || 0)),
        fail: () => resolve(Number.MAX_SAFE_INTEGER)
      });
    });
  },

  compressImage(path, quality) {
    return new Promise((resolve, reject) => {
      wx.compressImage({
        src: path,
        quality,
        success: (res) => resolve(res.tempFilePath || path),
        fail: reject
      });
    });
  },

  async ensureUploadableImage(path) {
    if (!path || /^https?:\/\//i.test(path) || path.includes('/uploads/')) return path;
    let current = path;
    let size = await this.getFileSize(current);
    if (size <= MAX_UPLOAD_BYTES) return current;

    const qualities = [85, 75, 65, 55, 45, 35];
    for (let i = 0; i < qualities.length; i++) {
      try {
        current = await this.compressImage(current, qualities[i]);
        size = await this.getFileSize(current);
        if (size <= MAX_UPLOAD_BYTES) return current;
      } catch (e) {
        console.log('compress image failed', e);
        break;
      }
    }
    const finalSize = await this.getFileSize(current);
    if (finalSize > MAX_UPLOAD_BYTES) throw new Error('IMAGE_TOO_LARGE');
    return current;
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
      const uploadIfNeeded = async (path) => {
        if (!path || path.startsWith('http') && !path.startsWith('http://tmp')) return path;
        if (path.includes('/uploads/')) return path;
        let finalPath = await this.ensureUploadableImage(path);

        // 上传失败时自动再压缩重试（最多2次）
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await util.uploadFile('upload', finalPath, 'file');
            return (res && res.url) ? res.url : res;
          } catch (uploadErr) {
            const code = Number(uploadErr && uploadErr.code);
            const msg = String((uploadErr && (uploadErr.msg || uploadErr.errmsg)) || '');
            const raw = String((uploadErr && uploadErr.raw) || '');
            const isTooLarge = code === 40013 || /File too large|文件过大/i.test(msg) || /MulterError:\s*File too large/i.test(raw);
            if (!isTooLarge || attempt >= 2) throw uploadErr;
            try {
              finalPath = await this.compressImage(finalPath, 25 - attempt * 5);
              finalPath = await this.ensureUploadableImage(finalPath);
            } catch (compressErr) {
              console.log('retry compress failed', compressErr);
              throw uploadErr;
            }
          }
        }
        throw new Error('UPLOAD_RETRY_FAILED');
      };

      const logoUrl = await uploadIfNeeded(form.signboard);
      wx.showLoading({ title: '上传背景图...', mask: true });
      const backgroundUrl = await uploadIfNeeded(form.indoor);
      wx.showLoading({ title: '上传执照...', mask: true });
      const licenseUrl = await uploadIfNeeded(form.bizLicense);
      wx.showLoading({ title: '上传实地照...', mask: true });
      const placePhotoUrl = [];
      for (let i = 0; i < form.placePhotos.length; i++) {
        placePhotoUrl.push(await uploadIfNeeded(form.placePhotos[i]));
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
      const code = Number(err && err.code);
      const msg = (err && (err.msg || err.errmsg)) || '';
      if (code === 40013 || err.message === 'IMAGE_TOO_LARGE') {
        wx.showToast({ title: '图片超过2MB，请更换后重试', icon: 'none' });
      } else if (code === 40014) {
        wx.showToast({ title: '仅支持 jpg/jpeg/png/webp', icon: 'none' });
      } else if (code === 40015) {
        wx.showToast({ title: '上传文件字段异常，请重试', icon: 'none' });
      } else {
        wx.showToast({ title: msg || '提交失败，请重试', icon: 'none' });
      }
      this.setData({ submitting: false });
    }
  }
});
