const app = getApp();
const util = require('../../utils/util.js');
Page({
  data: { activeTab: 0, userList: [], postList: [] },
  onLoad() { this.loadData(); },
  switchTab(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ activeTab: idx });
  },
  loadData() {
    // API placeholder - return empty lists for now
    this.setData({ userList: [], postList: [] });
  }
});
