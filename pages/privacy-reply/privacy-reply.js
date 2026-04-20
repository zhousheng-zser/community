const lp = require('../../utils/localPrefs.js');

Page({
  data: {
    options: lp.visibilityOptions,
    current: 'all'
  },
  onLoad() {
    this.setData({ current: lp.getReplyVisibility() });
  },
  select(e) {
    const id = e.currentTarget.dataset.id;
    lp.setReplyVisibility(id);
    this.setData({ current: id });
    wx.showToast({ title: '已保存', icon: 'success' });
  }
});
