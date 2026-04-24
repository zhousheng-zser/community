const util = require('../../../utils/util.js');
const app = getApp();

Page({
  data: {
    refundId: '',
    orderNo: '',
    refundInfo: {},
    orderInfo: {},
    chatRecords: [],
    adminDecision: 'refund',
    adminRemark: '',
    loading: true,
    submitting: false
  },

  onLoad(options) {
    this.setData({
      refundId: options.refundId || '',
      orderNo: options.orderNo || ''
    });
    this.loadRefundDetail();
  },

  async loadRefundDetail() {
    const { refundId, orderNo } = this.data;
    this.setData({ loading: true });
    try {
      let refundRes;
      if (refundId) {
        refundRes = await util.get(`admin/refunds/${refundId}`);
      } else {
        refundRes = await util.get(`admin/orders/${orderNo}/refund-info`);
      }
      const refundData = refundRes && refundRes.data !== undefined ? refundRes.data : refundRes;
      this.setData({
        refundInfo: refundData.refund || refundData,
        orderInfo: refundData.order || {},
        chatRecords: refundData.chat_records || [],
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载退款详情失败', icon: 'none' });
    }
  },

  onDecisionChange(e) {
    this.setData({ adminDecision: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ adminRemark: e.detail.value });
  },

  async submitArbitration() {
    const { refundId, adminDecision, adminRemark, submitting } = this.data;
    if (submitting) return;
    if (!refundId) {
      wx.showToast({ title: '退款ID缺失', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中', mask: true });
    try {
      const endpoint = adminDecision === 'refund'
        ? `admin/refunds/${refundId}/force-refund`
        : `admin/refunds/${refundId}/dismiss`;
      await util.post(endpoint, {
        remark: adminRemark,
        decision: adminDecision
      });
      wx.hideLoading();
      wx.showToast({
        title: adminDecision === 'refund' ? '已强制退款' : '已驳回申请',
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: (err && err.errmsg) || '仲裁失败', icon: 'none' });
    }
  },

  contactUser(e) {
    const phone = e.currentTarget.dataset.phone;
    if (!phone) {
      wx.showToast({ title: '无联系电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({ phoneNumber: phone });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.refundInfo.images || []
    });
  }
});
