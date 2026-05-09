const favoritesStore = require('../../utils/favoritesStore.js');

Page({
  data: {
    list: [],
    kindLabels: favoritesStore.KIND_LABELS
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({ list: favoritesStore.getList() });
  },

  onOpen(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    const item = this.data.list[idx];
    favoritesStore.open(item);
  },

  onRemove(e) {
    const key = e.currentTarget.dataset.key;
    if (!key) return;
    favoritesStore.remove(key);
    this.refresh();
  },

  onClear() {
    wx.showModal({
      title: '清空收藏',
      content: '确定清空全部收藏？',
      success: (res) => {
        if (res.confirm) {
          favoritesStore.clear();
          this.refresh();
        }
      }
    });
  }
});
