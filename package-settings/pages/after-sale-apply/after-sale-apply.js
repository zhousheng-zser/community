const util = require('../../utils/util.js');
const api = require('../../api/index.js');

Page({
  data: {
    orderNo: '',
    goodsId: '',
    refundType: 'refund_only',
    refundReason: '',
    refundAmount: '0.00',
    description: '',
    images: [],
    submitting: false
  },

  onLoad(options) {
    this.setData({
      orderNo: options.orderNo || '',
      goodsId: options.goodsId || ''
    });
  },

  onRefundTypeChange(e) {
    this.setData({ refundType: e.detail.value });
  },

  onReasonInput(e) {
    this.setData({ refundReason: e.detail.value });
  },

  onReasonSelect(e) {
    const reasons = ['商品质量问题', '商品与描述不符', '尺寸/规格不符', '未收到货', '多拍/错拍', '其他'];
    this.setData({ refundReason: reasons[e.detail.value] });
  },

  onAmountInput(e) {
    this.setData({ refundAmount: e.detail.value });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  uploadImage() {
    const that = this;
    wx.chooseImage({
      count: 3 - that.data.images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePaths = res.tempFilePaths;
        const newImages = [...that.data.images, ...tempFilePaths];
        that.setData({ images: newImages });
      }
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.filter((_, i) => i !== index);
    this.setData({ images });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.images
    });
  },

  async submitRefund() {
    const { orderNo, goodsId, refundType, refundReason, refundAmount, description, images, submitting } = this.data;
    if (submitting) return;
    const no = String(orderNo || '').trim();
    if (!no) {
      wx.showToast({ title: '订单号无效', icon: 'none' });
      return;
    }
    if (!refundReason.trim()) {
      wx.showToast({ title: '请填写退款原因', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中', mask: true });
    try {
      const imageUrls = [];
      for (const img of images) {
        const uploadRes = await util.uploadFile(img);
        imageUrls.push(uploadRes.url);
      }
      await api.market.applyRefund(no, {
        goods_id: goodsId || null,
        refund_type: refundType,
        reason: refundReason,
        refund_amount: refundAmount,
        description: description,
        images: imageUrls
      });
      wx.hideLoading();
      wx.showToast({ title: '退款申请已提交', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: (err && err.errmsg) || '申请失败', icon: 'none' });
    }
  }
});
