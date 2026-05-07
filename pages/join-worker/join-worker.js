const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    maskedPhone: '',
    agreed: false,
    submitting: false,
    communityList: [],
    communityIndex: -1,
    industryList: ['整理收纳', '家修急事', '家电清洗', '开荒保洁', '除螨服务', '家具养护', '宝宝家事', '房屋修缮', '上门美业', '其他'],
    industryIndex: -1,
    educationList: ['初中及以下', '高中/中专', '大专', '本科', '硕士及以上'],
    educationIndex: -1,
    showServiceForm: false,
    editingServiceIdx: -1,
    serviceForm: { name: '', price: '', desc: '' },
    services: [],
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
    // 去掉自动跳转，允许未入驻用户查看入驻页面
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

  // ===== 服务列表管理 =====
  toggleServiceForm() {
    this.setData({
      showServiceForm: !this.data.showServiceForm,
      editingServiceIdx: -1,
      serviceForm: { name: '', price: '', desc: '' }
    });
  },

  onServiceInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ ['serviceForm.' + key]: e.detail.value });
  },

  saveService() {
    const { serviceForm, editingServiceIdx, services } = this.data;
    if (!serviceForm.name.trim()) {
      wx.showToast({ title: '请填写服务名称', icon: 'none' });
      return;
    }
    const item = {
      name: serviceForm.name.trim(),
      price: serviceForm.price.trim(),
      desc: serviceForm.desc.trim()
    };
    let next;
    if (editingServiceIdx >= 0) {
      next = services.map((s, i) => (i === editingServiceIdx ? item : s));
    } else {
      next = [...services, item];
    }
    this.setData({ services: next, showServiceForm: false, editingServiceIdx: -1, serviceForm: { name: '', price: '', desc: '' } });
  },

  editService(e) {
    const idx = e.currentTarget.dataset.idx;
    const item = this.data.services[idx];
    this.setData({
      showServiceForm: true,
      editingServiceIdx: idx,
      serviceForm: { name: item.name, price: item.price, desc: item.desc || '' }
    });
  },

  delService(e) {
    const idx = e.currentTarget.dataset.idx;
    wx.showModal({
      title: '确认删除',
      content: '删除该服务项目？',
      success: (r) => {
        if (r.confirm) {
          const next = this.data.services.filter((_, i) => i !== idx);
          this.setData({ services: next });
        }
      }
    });
  },


  async submit() {
    const { form, agreed, submitting } = this.data;
    if (submitting) return;
    if (!form.realName) return wx.showToast({ title: '请填写真实姓名', icon: 'none' });
    if (!form.phone) return wx.showToast({ title: '系统未能获取到手机号', icon: 'none' });
    if (!form.idCard) return wx.showToast({ title: '请填写身份证号', icon: 'none' });
    if (!form.community) return wx.showToast({ title: '请选择接单社区', icon: 'none' });
    if (!form.industry) return wx.showToast({ title: '请选择意向行业', icon: 'none' });
    if (!form.idFront) return wx.showToast({ title: '请上传身份证照片', icon: 'none' });
    if (!agreed) return wx.showToast({ title: '请先同意入驻协议', icon: 'none' });
    this.setData({ submitting: true });
    wx.showLoading({ title: '图片上传中...', mask: true });
    try {
      let idCardUrl = form.idFront;
      let workPhotoUrl = form.workPhoto;
      let certUrl = form.cert;

      // 将本地临时图片上传换取服务器相对路径
      const uploadIfNeeded = async (path) => {
        if (!path || path.startsWith('http') && !path.startsWith('http://tmp')) return path;
        if (path.includes('/uploads/')) return path; // 已经是服务器路径
        const res = await util.uploadFile('upload', path, 'file');
        // 兼容后端返回结构：{ url: '/xx' } 或者是直接的字符串
        return (res && res.url) ? res.url : res;
      };

      idCardUrl = await uploadIfNeeded(idCardUrl);
      
      wx.showLoading({ title: '提交数据中...', mask: true });
      workPhotoUrl = await uploadIfNeeded(workPhotoUrl);
      certUrl = await uploadIfNeeded(certUrl);

      const certArr = certUrl ? [certUrl] : [];
      const { services } = this.data;
      let payload = {
        name: form.realName,
        phone: form.phone,
        industry: form.industry,
        education: form.education || '',
        city: form.hometown || form.address || '',
        resume: form.resume || '',
        id_card_url: idCardUrl,
        work_photo_url: workPhotoUrl || '',
        certificate_url: certArr,
        services: services.length > 0 ? services : undefined
      };

      // 剔除所有空字符串或空数组属性，避免后端发生意外的序列化错误或默认值覆盖失败
      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || (Array.isArray(payload[key]) && payload[key].length === 0)) {
          delete payload[key];
        }
      });

      const res = await util.post('worker/apply', payload);
      wx.hideLoading();
      // 提交成功后立即更新本地状态，避免用户返回"我的"页面后状态不同步
      const app = getApp();
      if (app.globalData.user) {
        app.globalData.user.worker_status = 'pending';
        app.globalData.user.workerStatus = 'pending';
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
