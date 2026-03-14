Page({
  data: {
    navTopPadding: 20,
    serviceTabs: [
      { key: "take",   text: "代取",     label: "取", placeholder: "填写取货地址",       secondLabel: "收", secondPlaceholder: "填写收货地址" },
      { key: "child",  text: "接送小孩", label: "服", placeholder: "填写接送服务地址",   secondLabel: "",   secondPlaceholder: "" },
      { key: "escort", text: "陪诊",     label: "服", placeholder: "填写需陪诊服务地址", secondLabel: "",   secondPlaceholder: "" },
      { key: "study",  text: "陪读",     label: "服", placeholder: "填写需陪读服务地址", secondLabel: "",   secondPlaceholder: "" },
      { key: "trash",  text: "代扔垃圾", label: "服", placeholder: "填写上门服务地址",   secondLabel: "",   secondPlaceholder: "" },
      { key: "pet",    text: "宠物喂养", label: "服", placeholder: "填写宠物服务地址",   secondLabel: "",   secondPlaceholder: "" }
    ],
    activeServiceTab: "take",
    activeTabConfig: { key: "take", text: "代取", label: "取", placeholder: "填写取货地址", secondLabel: "收", secondPlaceholder: "填写收货地址" },
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
      const tab = this.data.serviceTabs.find(t => t.key === options.type);
      this.setData({
        activeServiceTab: options.type,
        activeTabConfig: tab || this.data.activeTabConfig
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
    const tab = this.data.serviceTabs.find(t => t.key === key);
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

  // 📍 地图选址
  pickAddress(e) {
    const field = e.currentTarget.dataset.field;
    const self = this;

    wx.authorize({
      scope: 'scope.userLocation',
      success() {
        wx.chooseLocation({
          success(res) {
            const name = res.name || '';
            const addr = res.address || '';
            const full = addr ? (name && name !== addr ? addr + ' ' + name : addr) : name;
            if (full) self.setData({ [`currentForm.${field}`]: full });
          },
          fail() {}
        });
      },
      fail() {
        wx.showModal({
          title: '需要位置权限',
          content: '请在设置中开启位置权限，或直接在输入框手动输入地址',
          confirmText: '去设置',
          cancelText: '手动输入',
          success(r) { if (r.confirm) wx.openSetting(); }
        });
      }
    });
  },

  doSubmit() {
    const { currentForm, activeTabConfig } = this.data;
    if (!currentForm.from) {
      return wx.showToast({ title: '请填写' + activeTabConfig.label + '地址', icon: 'none' });
    }
    if (activeTabConfig.secondLabel && !currentForm.to) {
      return wx.showToast({ title: '请填写' + activeTabConfig.secondLabel + '地址', icon: 'none' });
    }
    wx.showToast({ title: '发布成功！', icon: 'success' });
    this.setData({ currentForm: { from: '', to: '', remark: '' } });
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
