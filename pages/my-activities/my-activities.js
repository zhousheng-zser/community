const app = getApp();
const util = require('../../utils/util.js');
Page({
  data: { tabs: ['全部', '待参加', '已结束'], activeTab: '全部', list: [] },
  onLoad() { this.loadList(); },
  switchTab(e) { this.setData({ activeTab: e.currentTarget.dataset.tab }); this.loadList(); },
  loadList() {
    // API placeholder
    this.setData({ list: [] });
  }
});
