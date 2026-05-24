const app = getApp();
const util = require('../../utils/util.js');
const api = require('../../api/index.js');
const joinUpload = require('../../utils/joinImageUpload.js');

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
    applyStatus: '',
    applyRejectReason: '',
    formLocked: false,
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
    if (!wx.getStorageSync('token')) return;
    this.loadApplicationStatus();
  },

  flattenCerts(v) {
    const out = [];
    const walk = (x) => {
      if (x == null || x === '') return;
      if (Array.isArray(x)) return x.forEach(walk);
      out.push(String(x));
    };
    walk(v);
    return out;
  },

  async loadApplicationStatus() {
    try {
      const row = await util.get('worker/application/me');
      if (!row || !row.status) return;
      const status = row.status;
      const certs = this.flattenCerts(row.certificate_url);
      const patch = {
        applyStatus: status,
        applyRejectReason: row.reject_reason || '',
        formLocked: status === 'pending' || status === 'approved'
      };
      const services = Array.isArray(row.services) ? row.services : [];
      const industryIdx = this.data.industryList.indexOf(row.industry);
      const educationIdx = row.education ? this.data.educationList.indexOf(row.education) : -1;
      const communityIdx = row.city ? this.data.communityList.indexOf(row.city) : -1;
      Object.assign(patch, {
        services,
        industryIndex: industryIdx >= 0 ? industryIdx : this.data.industryIndex,
        educationIndex: educationIdx >= 0 ? educationIdx : this.data.educationIndex,
        communityIndex: communityIdx >= 0 ? communityIdx : this.data.communityIndex,
        'form.realName': row.name || this.data.form.realName,
        'form.phone': row.phone || this.data.form.phone,
        'form.industry': row.industry || this.data.form.industry,
        'form.education': row.education || this.data.form.education,
        'form.hometown': row.city || this.data.form.hometown,
        'form.resume': row.resume || this.data.form.resume,
        'form.idFront': row.id_card_url || this.data.form.idFront,
        'form.workPhoto': row.work_photo_url || this.data.form.workPhoto,
        'form.cert': certs[0] || this.data.form.cert,
        'form.community': communityIdx >= 0 ? this.data.communityList[communityIdx] : this.data.form.community
      });
      this.setData(patch);
    } catch (e) {
      console.log('loadApplicationStatus', e);
    }
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

  compressImagePath(filePath) {
    return new Promise((resolve) => {
      if (!filePath) return resolve('');
      wx.compressImage({
        src: filePath,
        quality: 80,
        success: (r) => resolve(r.tempFilePath || filePath),
        fail: () => resolve(filePath)
      });
    });
  },

  pickImage(field) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (r) => {
        const raw = r.tempFiles && r.tempFiles[0] && r.tempFiles[0].tempFilePath;
        if (!raw) return;
        const path = await this.compressImagePath(raw);
        this.setData({ ['form.' + field]: path });
      }
    });
  },

  chooseAvatar() { this.pickImage('avatar'); },
  chooseIdCard() { this.pickImage('idFront'); },
  chooseWorkPhoto() { this.pickImage('workPhoto'); },
  chooseCert() { this.pickImage('cert'); },

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
    const { form, agreed, submitting, formLocked, applyStatus } = this.data;
    if (submitting) return;
    if (formLocked || applyStatus === 'pending') {
      wx.showToast({ title: '申请审核中，请耐心等待', icon: 'none' });
      return;
    }
    if (applyStatus === 'approved') {
      wx.showToast({ title: '您已是认证技工', icon: 'none' });
      return;
    }
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
      wx.showLoading({ title: '上传身份证照...', mask: true });
      const idCardUrl = await joinUpload.upload('worker', 'idFront', form.idFront);
      if (!idCardUrl) throw { errmsg: '「身份证人像面」上传失败，请重试' };

      if (form.workPhoto) {
        wx.showLoading({ title: '上传工作生活照...', mask: true });
      }
      const workPhotoUrl = form.workPhoto
        ? await joinUpload.upload('worker', 'workPhoto', form.workPhoto)
        : '';

      let certUrl = '';
      if (form.cert) {
        wx.showLoading({ title: '上传专业证书...', mask: true });
        certUrl = await joinUpload.upload('worker', 'cert', form.cert);
      }

      wx.showLoading({ title: '提交数据中...', mask: true });

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

      const applyRes = await util.post('worker/apply', payload);
      wx.hideLoading();
      if (applyRes && applyRes.status === 'approved') {
        wx.showToast({ title: '您已是认证技工，无需重复申请', icon: 'none' });
        this.setData({ applyStatus: 'approved', formLocked: true, submitting: false });
        return;
      }
      if (app.globalData.user) {
        app.globalData.user.worker_status = 'pending';
        app.globalData.user.workerStatus = 'pending';
      }
      try {
        const profile = await api.user.getUserProfile();
        if (app.globalData.user && profile) {
          Object.assign(app.globalData.user, profile);
          if (profile.worker_status != null) {
            app.globalData.user.worker_status = profile.worker_status;
            app.globalData.user.workerStatus = profile.worker_status;
          }
        }
      } catch (e) { /* ignore */ }
      this.setData({ applyStatus: 'pending', formLocked: true, submitting: false });
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
