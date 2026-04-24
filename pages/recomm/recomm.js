const { SERVICE_TABS, getTabByKey, getSubmitBlockReason } = require('../../utils/recommConfig.js');

Page({
  data: {
    navTopPadding: 20,
    serviceTabs: SERVICE_TABS,
    activeServiceTab: 'take',
    activeTabConfig: getTabByKey('take'),
    // 当前 tab 表单（WXML 只访问这个，不用动态 key）
    currentForm: { from: '', to: '', remark: '' },
    // 各 tab 表单缓存
    _cache: {},
    history: [
      { tag: "代取", text: "帮取文件1件 重1公斤" }
    ]
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
    if (options.type) {
      const tab = getTabByKey(options.type);
      this.setData({
        activeServiceTab: tab.key,
        activeTabConfig: tab
      });
    }
  },

  switchServiceTab(e) {
    const key = e.currentTarget.dataset.key;
    // 保存当前表单到缓存
    const cache = Object.assign({}, this.data._cache, {
      [this.data.activeServiceTab]: Object.assign({}, this.data.currentForm)
    });
    // 读取目标 tab 缓存
    const form = cache[key] || { from: '', to: '', remark: '' };
    const tab = getTabByKey(key);
    this.setData({
      activeServiceTab: key,
      activeTabConfig: tab,
      currentForm: form,
      _cache: cache
    });
  },

  onAddrInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`currentForm.${field}`]: e.detail.value });
  },

  // 跳转地址填写子页面
  goPickAddr(e) {
    const field = e.currentTarget.dataset.field;
    wx.navigateTo({ url: `../address/address?mode=pick&field=currentForm.${field}` });
  },

  doSubmit() {
    const { currentForm, activeTabConfig } = this.data;
    const block = getSubmitBlockReason(activeTabConfig, currentForm);
    if (block) {
      return wx.showToast({ title: block, icon: 'none' });
    }

    wx.showLoading({ title: '发布中...' });
    util.post('neighbor-assist', {
      category: activeTabConfig.title,
      content: currentForm.remark || '',
      address: currentForm.from || currentForm.to,
      pickup_address: currentForm.from,
      delivery_address: currentForm.to,
      reward: 0
    })
      .then(() => {
        wx.hideLoading();
        wx.showToast({ title: '发布成功！', icon: 'success' });
        this.setData({ currentForm: { from: '', to: '', remark: '' } });
      })
      .catch((err) => {
        wx.hideLoading();
        const msg = (err && err.errmsg) || '发布失败，请重试';
        wx.showToast({ title: msg, icon: 'none' });
      });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) { wx.navigateBack({ delta: 1 }); return; }
    wx.switchTab({ url: '/pages/index/index' });
  },

  goMonthCard() {
    wx.navigateTo({ url: '../book/book?tab=' + this.data.activeServiceTab });
  },

  goServiceList() {
    wx.navigateTo({ url: '../order-publish/order-publish' });
  }
});
