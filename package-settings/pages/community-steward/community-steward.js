Page({
  data: {
    phone: '400-000-0000'
  },
  copyPhone() {
    wx.setClipboardData({
      data: this.data.phone,
      success: () => wx.showToast({ title: '已复制', icon: 'none' })
    });
  },
  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  }
});
