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
    // 每个 tab 独立存储表单值
    formData: {
      take:   { from: '', to: '', remark: '' },
      child:  { from: '', to: '', remark: '' },
      escort: { from: '', to: '', remark: '' },
      study:  { from: '', to: '', remark: '' },
      trash:  { from: '', to: '', remark: '' },
      pet:    { from: '', to: '', remark: '' }
    },
    history: [
      { tag: "代取", text: "帮取文件1件 重1公斤" }
    ]
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
    if (options.type) {
      this.setData({ activeServiceTab: options.type });
    }
  },

  switchServiceTab(e) {
    this.setData({ activeServiceTab: e.currentTarget.dataset.key });
  },

  // 地址文字输入
  onAddrInput(e) {
    const { tab, field } = e.currentTarget.dataset;
    this.setData({ [`formData.${tab}.${field}`]: e.detail.value });
  },

  // 📍 地图选址
  pickAddress(e) {
    const { tab, field } = e.currentTarget.dataset;
    const self = this;

    function doChooseLocation() {
      wx.chooseLocation({
        success(res) {
          // res.address 是详细地址，res.name 是地点名称
          const addr = (res.address || '') + (res.name && res.name !== res.address ? ' ' + res.name : '');
          if (addr.trim()) {
            self.setData({ [`formData.${tab}.${field}`]: addr.trim() });
          }
        },
        fail(err) {
          if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
            wx.showModal({
              title: '需要位置权限',
              content: '请在设置中开启位置权限以使用地图选址',
              confirmText: '去设置',
              cancelText: '手动输入',
              success(r) {
                if (r.confirm) wx.openSetting();
              }
            });
          }
        }
      });
    }

    // 先检查授权状态，避免直接弹失败
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userLocation'] === false) {
          // 已明确拒绝，引导去设置
          wx.showModal({
            title: '需要位置权限',
            content: '地图选址需要位置权限，请先在设置中开启',
            confirmText: '去设置',
            cancelText: '手动输入',
            success(r) {
              if (r.confirm) wx.openSetting();
            }
          });
        } else {
          doChooseLocation();
        }
      },
      fail() {
        doChooseLocation();
      }
    });
  },

  // 检查当前 tab 是否可以提交
  canSubmit(key) {
    const d = this.data.formData[key];
    const tab = this.data.serviceTabs.find(t => t.key === key);
    if (!d || !d.from) return false;
    if (tab && tab.secondLabel && !d.to) return false;
    return true;
  },

  doSubmit(e) {
    const key = e.currentTarget.dataset.key;
    if (!this.canSubmit(key)) {
      return wx.showToast({ title: '请填写完整地址', icon: 'none' });
    }
    wx.showToast({ title: '发布成功！', icon: 'success' });
    // 清空该 tab 表单
    const formData = Object.assign({}, this.data.formData, {
      [key]: { from: '', to: '', remark: '' }
    });
    this.setData({ formData });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  },

  goMonthCard() {
    wx.navigateTo({ url: "../book/book?tab=" + this.data.activeServiceTab });
  },

  goServiceList() {
    wx.navigateTo({ url: "../order-publish/order-publish" });
  }
});
