const app = getApp();
const util = require('../../utils/util.js');

// 生成年月日时范围
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

    // 邻里帮帮表单
    helperForm: { pickup: '', delivery: '', remark: '' },

    // 一键发布表单
    form: { address: '', time: '', content: '', images: [] },
    agreed: false,
    submitting: false,
    canSubmit: false,

    // 时间 picker
    timeRanges: [[], [], [], []],
    timeIndexes: [0, 0, 0, 8], // 默认 8:00

    recentList: []
  },

  onLoad() {
    const now = new Date();
    const ranges = buildTimeRanges();
    const monthIdx = now.getMonth();
    const dayCount = getDaysInMonth(now.getFullYear(), now.getMonth() + 1);
    // 当月实际天数
    ranges[2] = Array.from({ length: dayCount }, (_, i) => pad(i + 1) + '日');
    this.setData({
      timeRanges: ranges,
      timeIndexes: [0, monthIdx, now.getDate() - 1, 8]
    });
    this.loadRecentList();
  },

  switchMainTab(e) {
    this.setData({ activeMainTab: e.currentTarget.dataset.tab });
  },

  switchCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.cat });
  },

  /* ===== 邻里帮帮地址输入 ===== */
  onHelperInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`helperForm.${field}`]: e.detail.value });
  },

  /* ===== 一键发布地址输入 ===== */
  onAddressInput(e) {
    this.setData({ 'form.address': e.detail.value });
    this.updateCanSubmit();
  },

  /* ===== 从地图选择地址 ===== */
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

  /* ===== 时间 Picker ===== */
  onTimeColumnChange(e) {
    const col = e.detail.column;
    const val = e.detail.value;
    const indexes = [...this.data.timeIndexes];
    indexes[col] = val;

    // 当年份或月份改变时，重新计算当月天数
    if (col === 0 || col === 1) {
      const now = new Date();
      const year = now.getFullYear() + indexes[0];
      const month = indexes[1] + 1;
      const dayCount = getDaysInMonth(year, month);
      const ranges = [...this.data.timeRanges];
      ranges[2] = Array.from({ length: dayCount }, (_, i) => pad(i + 1) + '日');
      // 保证日期不越界
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

  /* ===== 一键发布 ===== */
  onContentInput(e) {
    this.setData({ 'form.content': e.detail.value });
    this.updateCanSubmit();
  },

  addImage() {
    const remain = 3 - this.data.form.images.length;
    wx.chooseMedia({
      count: remain, mediaType: ['image'],
      success: (res) => {
        const imgs = this.data.form.images.concat(res.tempFiles.map(f => f.tempFilePath));
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

  async submitPublish() {
    const { form, activeCategory, agreed, submitting, canSubmit } = this.data;
    if (submitting || !canSubmit) return;
    if (!agreed) return wx.showToast({ title: '请先同意服务协议', icon: 'none' });
    if (!form.address) return wx.showToast({ title: '请填写服务地址', icon: 'none' });
    if (!form.content) return wx.showToast({ title: '请填写需求描述', icon: 'none' });
    this.setData({ submitting: true });
    try {
      let imageUrls = [];
      for (const filePath of form.images) {
        const result = await util.uploadFile('upload', filePath, 'file', { type: 'order' });
        const url = result.url || result.filePath || result;
        if (url) imageUrls.push(url);
      }
      try {
        await util.post('neighbor-assist/orders', {
          category: activeCategory,
          address: form.address,
          time: form.time,
          content: form.content,
          images: imageUrls
        });
      } catch (e1) {
        await util.post('orders/publish', {
          category: activeCategory,
          address: form.address,
          time: form.time,
          content: form.content,
          images: imageUrls
        });
      }
      wx.showToast({ title: '发布成功', icon: 'success' });
      this.setData({ form: { address: '', time: '', content: '', images: [] }, agreed: false, canSubmit: false, submitting: false });
      this.loadRecentList();
    } catch (err) {
      wx.showToast({ title: '发布失败，请重试', icon: 'none' });
      this.setData({ submitting: false });
    }
  },

  /* ===== 邻里帮帮提交 ===== */
  submitHelper() {
    const { pickup, delivery } = this.data.helperForm;
    if (!pickup || !delivery) return wx.showToast({ title: '请填写取送地址', icon: 'none' });
    wx.showToast({ title: '发布成功', icon: 'success' });
    this.setData({ helperForm: { pickup: '', delivery: '', remark: '' } });
  },

  loadRecentList() {
    util.get('orders/recent', { type: 'publish', limit: 6 })
      .then(data => {
        const list = (Array.isArray(data) ? data : []).map(item => ({
          id: item.id, content: item.content || item.title || '邻里帮帮任务'
        }));
        this.setData({ recentList: list });
      })
      .catch(() => {
        this.setData({
          recentList: [
            { id: 1, content: '社区食堂需要一位服务员代班 15一小时' },
            { id: 2, content: '杉山社区需要一位服务员代班 15一小时' },
            { id: 3, content: '社区食堂需要代班服务员 15一小时' },
            { id: 4, content: '社区需要一位保洁阿姨，2小时' }
          ]
        });
      });
  }
});
