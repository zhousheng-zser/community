const browseFootprint = require('../../utils/browseFootprint.js');

Page({
  data: {
    list: [],
    kindLabels: browseFootprint.KIND_LABELS
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    const list = await browseFootprint.getList();
    this.setData({ list });
  },

  onOpen(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    const item = this.data.list[idx];
    browseFootprint.open(item);
  },

  onClear() {
    wx.showModal({
      title: '清空足迹',
      content: '确定清空全部浏览记录？',
      success: (res) => {
        if (res.confirm) {
          browseFootprint.clear();
          this.setData({ list: [] });
        }
      }
    });
  }
});
