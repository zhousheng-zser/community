Page({
  goPublish() {
    wx.navigateTo({ url: '/pages/community-publish/community-publish' });
  },
  goMine() {
    wx.navigateTo({ url: '/pages/my-activities/my-activities' });
  }
});
