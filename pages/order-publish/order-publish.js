const app = getApp();
const util = require('../../utils/util.js');
const { getActiveCommunityId, ensureCommunityForPublish } = require('../../utils/communityPortal.js');

function syncToCommunityPost(content, category, address, price, communityId, imageUrls) {
  const priceText = price && parseFloat(price) > 0 ? ` 悬赏¥${parseFloat(price).toFixed(2)}` : '';
  const postContent = `[${category}]${priceText}\n${content}\n📍${address}`;
  const postData = {
    content: postContent,
    category: '邻里互动',
    location: address,
    community_id: communityId
  };
  if (imageUrls && imageUrls.length > 0) postData.images = imageUrls;
  util.post('posts', postData).catch(() => {});
}

function buildTimeRanges() {
  const now = new Date();
  const years = [], months = [], days = [], hours = [];
  for (let y = now.getFullYear(); y <= now.getFullYear() + 1; y++) years.push(y + '年');
  for (let m = 1; m <= 12; m++) months.push(pad(m) + '月');
  for (let d = 1; d <= 31; d++) days.push(pad(d) + '日');
  for (let h = 0; h <= 23; h++) hours.push(pad(h) + ':00');
  return [years, months, days, hours];
}

function pad(n) { return String(n).padStart(2, '0'); }

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

Page({
  data: {
    activeMainTab: '邻里帮帮',
    categories: ['代取', '接送小孩', '陪诊', '陪读', '代扔垃圾', '宠物喂养', '跑腿', '其他'],
    activeCategory: '代取',
    helperForm: { pickup: '', delivery: '', remark: '', price: '', contactPhone: '' },
    form: { address: '', time: '', content: '', images: [], price: '', contactPhone: '' },
    agreed: false,
    submitting: false,
    canSubmit: false,
    timeRanges: [[], [], [], []],
    timeIndexes: [0, 0, 0, 8],
    recentList: []
  },

  onLoad(options) {
    const now = new Date();
    const ranges = buildTimeRanges();
    const monthIdx = now.getMonth();
    const dayCount = getDaysInMonth(now.getFullYear(), now.getMonth() + 1);
    ranges[2] = Array.from({ length: dayCount }, (_, i) => pad(i + 1) + '日');
    const updates = {
      timeRanges: ranges,
      timeIndexes: [0, monthIdx, now.getDate() - 1, 8]
    };
    if (options.tab === '邻里帮帮' || options.tab === '一键发布') {
      updates.activeMainTab = options.tab;
    }
    if (options.category && this.data.categories.includes(options.category)) {
      updates.activeCategory = options.category;
    }
    this.setData(updates);
    this.loadRecentList();
  },

  switchMainTab(e) {
    this.setData({ activeMainTab: e.currentTarget.dataset.tab });
  },

  switchCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.cat });
  },

  onHelperInput(e) {
    const field = e.currentTarget.dataset.field;
    let val = e.detail.value;
    if (field === 'contactPhone') val = String(val).replace(/\D/g, '').slice(0, 11);
    this.setData({ [`helperForm.${field}`]: val });
  },

  onAddressInput(e) {
    this.setData({ 'form.address': e.detail.value });
    this.updateCanSubmit();
  },

  chooseAddrFromBook(e) {
    const field = e.currentTarget.dataset.field;
    const self = this;
    function doChooseLocation() {
      wx.chooseLocation({
        success(res) {
          const addr = (res.address || '') + (res.name && res.name !== res.address ? ' ' + res.name : '');
          if (!addr.trim()) return;
          if (field === 'address') {
            self.setData({ 'form.address': addr.trim() });
            self.updateCanSubmit();
          } else {
            self.setData({ [`helperForm.${field}`]: addr.trim() });
          }
        },
        fail(err) {
          if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
            wx.showModal({
              title: '需要位置权限',
              content: '请在设置中开启位置权限以使用地图选址',
              confirmText: '去设置',
              cancelText: '手动输入',
              success(r) { if (r.confirm) wx.openSetting(); }
            });
          }
        }
      });
    }
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userLocation'] === false) {
          wx.showModal({
            title: '需要位置权限',
            content: '地图选址需要位置权限，请先在设置中开启',
            confirmText: '去设置',
            cancelText: '手动输入',
            success(r) { if (r.confirm) wx.openSetting(); }
          });
        } else {
          doChooseLocation();
        }
      },
      fail() { doChooseLocation(); }
    });
  },

  onTimeColumnChange(e) {
    const col = e.detail.column;
    const val = e.detail.value;
    const indexes = [...this.data.timeIndexes];
    indexes[col] = val;
    if (col === 0 || col === 1) {
      const now = new Date();
      const year = now.getFullYear() + indexes[0];
      const month = indexes[1] + 1;
      const dayCount = getDaysInMonth(year, month);
      const ranges = [...this.data.timeRanges];
      ranges[2] = Array.from({ length: dayCount }, (_, i) => pad(i + 1) + '日');
      if (indexes[2] >= dayCount) indexes[2] = dayCount - 1;
      this.setData({ timeRanges: ranges, timeIndexes: indexes });
    } else {
      this.setData({ timeIndexes: indexes });
    }
  },

  onTimeChange(e) {
    const indexes = e.detail.value;
    const r = this.data.timeRanges;
    const timeStr = `${r[0][indexes[0]]} ${r[1][indexes[1]]} ${r[2][indexes[2]]} ${r[3][indexes[3]]}`;
    this.setData({ 'form.time': timeStr, timeIndexes: indexes });
    this.updateCanSubmit();
  },

  onPriceInput(e) {
    const field = e.currentTarget.dataset.field;
    const val = e.detail.value;
    if (field === 'helperPrice') {
      this.setData({ 'helperForm.price': val });
    } else {
      this.setData({ 'form.price': val });
      this.updateCanSubmit();
    }
  },

  onContactPhoneInput(e) {
    const digits = String(e.detail.value).replace(/\D/g, '').slice(0, 11);
    this.setData({ 'form.contactPhone': digits });
  },

  onContentInput(e) {
    this.setData({ 'form.content': e.detail.value });
    this.updateCanSubmit();
  },

  addImage() {
    const remain = 3 - this.data.form.images.length;
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      success: (res) => {
        const imgs = this.data.form.images.concat(res.tempFiles.map((f) => f.tempFilePath));
        this.setData({ 'form.images': imgs });
      }
    });
  },

  delImage(e) {
    const arr = [...this.data.form.images];
    arr.splice(e.currentTarget.dataset.idx, 1);
    this.setData({ 'form.images': arr });
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
    this.updateCanSubmit();
  },

  updateCanSubmit() {
    const { form, agreed } = this.data;
    this.setData({ canSubmit: !!(form.content && form.address && agreed) });
  },

  async doAssistPay(orderRes, pickup, delivery, remark, rewardAmount, communityId) {
    const orderId = orderRes && (orderRes.id || orderRes.order_id);
    if (!orderId) {
      wx.showToast({ title: '订单创建异常', icon: 'none' });
      return;
    }
    const content = remark || `${pickup} → ${delivery}`;
    try {
      await util.post(`neighbor-assist/orders/${orderId}/pay`);
      wx.showToast({ title: '发布成功', icon: 'success' });
      syncToCommunityPost(content, this.data.activeCategory, pickup + ' → ' + delivery, rewardAmount, communityId);
      setTimeout(() => {
        wx.navigateTo({ url: `/pages/neighbor-assist-order-detail/neighbor-assist-order-detail?id=${orderId}` });
      }, 800);
    } catch (payErr) {
      console.warn('支付失败，订单已创建:', payErr);
      wx.showToast({ title: '订单已创建，请前往支付', icon: 'none', duration: 2000 });
      setTimeout(() => {
        wx.navigateTo({ url: `/pages/neighbor-assist-order-detail/neighbor-assist-order-detail?id=${orderId}` });
      }, 2200);
    }
  },

  /** 一键发布：与邻里帮帮同链路（建单 → 支付 → 详情） */
  async submitPublish() {
    const { form, activeCategory, agreed, submitting } = this.data;
    if (submitting) return;
    if (!agreed) {
      wx.showToast({ title: '请先同意服务协议', icon: 'none' });
      return;
    }
    if (!form.address || !form.content) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    let communityId;
    try {
      communityId = await ensureCommunityForPublish(app);
    } catch (e) {
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '发布中...' });
    const rewardAmount = form.price && parseFloat(form.price) > 0 ? parseFloat(form.price) : null;
    const contactPhone = form.contactPhone || '';
    const remark = [form.content, form.time ? `预约：${form.time}` : ''].filter(Boolean).join('\n');

    try {
      const orderRes = await util.post('neighbor-assist/orders', {
        assist_type: activeCategory,
        origin_address_snapshot: { address: form.address, detail: form.address },
        destination_address_snapshot: { address: form.address, detail: form.address },
        appointment_time: form.time || null,
        content: form.content,
        remark,
        community_id: communityId,
        reward_amount: rewardAmount,
        contact_phone: contactPhone
      });
      wx.hideLoading();
      await this.doAssistPay(
        orderRes || {},
        form.address,
        form.address,
        remark,
        rewardAmount,
        communityId
      );
      this.setData({
        form: { address: '', time: '', content: '', images: [], price: '', contactPhone: '' },
        agreed: false,
        canSubmit: false,
        submitting: false
      });
      this.loadRecentList();
    } catch (err) {
      wx.hideLoading();
      console.error('发布失败:', err);
      wx.showToast({
        title: (err && err.errmsg) || (err && err.message) || '发布失败，请重试',
        icon: 'none'
      });
      this.setData({ submitting: false });
    }
  },

  async submitHelper() {
    const { pickup, delivery, remark, price } = this.data.helperForm;
    if (!pickup || !delivery) {
      wx.showToast({ title: '请填写取送地址', icon: 'none' });
      return;
    }
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    let communityId;
    try {
      communityId = await ensureCommunityForPublish(app);
    } catch (e) {
      return;
    }

    const assistType = this.data.activeCategory;
    const rewardAmount = price && parseFloat(price) > 0 ? parseFloat(price) : null;
    const contactPhone = this.data.helperForm.contactPhone || '';
    const content = remark || `${pickup} → ${delivery}`;

    wx.showLoading({ title: '发布中...' });
    try {
      const res = await util.post('neighbor-assist/orders', {
        assist_type: assistType,
        content,
        community_id: communityId,
        origin_address_snapshot: { address: pickup, detail: pickup },
        destination_address_snapshot: { address: delivery, detail: delivery },
        remark: content,
        reward_amount: rewardAmount,
        contact_phone: contactPhone
      });
      wx.hideLoading();
      this.setData({ helperForm: { pickup: '', delivery: '', remark: '', price: '', contactPhone: '' } });
      await this.doAssistPay(res || {}, pickup, delivery, content, rewardAmount, communityId);
      this.loadRecentList();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: (err && err.errmsg) || '发布失败，请重试', icon: 'none' });
    }
  },

  loadRecentList() {
    if (!wx.getStorageSync('token')) {
      this.setData({ recentList: [] });
      return;
    }
    util.get('neighbor-assist/orders/my', { role: 'publisher', limit: 6, page: 1 })
      .then((data) => {
        const raw = (data && data.list) || (Array.isArray(data) ? data : []);
        const list = raw.map((item) => ({
          id: item.id,
          content: item.remark || item.content || item.assist_type_label || '邻里任务'
        }));
        this.setData({ recentList: list });
      })
      .catch(() => this.setData({ recentList: [] }));
  }
});
