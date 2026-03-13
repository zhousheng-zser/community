const app = getApp();
const util = require('../../utils/util.js');
Page({
  data: { content: '', images: [] },
  onInput(e) { this.setData({ content: e.detail.value }); },
  chooseImages() {
    const remain = 5 - this.data.images.length;
    if (remain <= 0) return;
    wx.chooseMedia({ count: remain, mediaType: ['image'], success: (res) => {
      const newImgs = res.tempFiles.map(f => f.tempFilePath);
      this.setData({ images: [...this.data.images, ...newImgs] });
    }});
  },
  removeImage(e) {
    const idx = e.currentTarget.dataset.idx;
    const images = [...this.data.images];
    images.splice(idx, 1);
    this.setData({ images });
  },
  submit() {
    const { content } = this.data;
    if (!content.trim()) return wx.showToast({ title: '请填写建议内容', icon: 'none' });
    wx.showLoading({ title: '提交中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '感谢您的反馈！', icon: 'success' });
      setTimeout(() => { this.setData({ content: '', images: [] }); }, 1500);
    }, 800);
  }
});
