const util = require('../../../utils/util.js');

Page({
  data: {
    orderNo: '',
    refundId: '',
    refundInfo: {},
    actionType: 'approve',
    rejectReason: '',
    remark: '',
    submitting: false,
    loading: true
  },

  onLoad(options) {
    this.setData({
      orderNo: options.orderNo || '',
      refundId: options.refundId || ''
    });
    this.loadRefundInfo();
  },

  async loadRefundInfo() {
    const { orderNo, refundId } = this.data;
    this.setData({ loading: true });
    try {
      let res;
      if (refundId) {
        res = await util.get(`market/merchant/refunds/${refundId}`);
      } else {
        res = await util.get(`market/merchant/orders/${orderNo}/refund-info`);
      }
      const data = res && res.data !== undefined ? res.data : res;
      this.setData({ refundInfo: data, loading: false });
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载退款信息失败', icon: 'none' });
    }
  },

  onActionTypeChange(e) {
    this.setData({ actionType: e.detail.value });
  },

  onRejectReasonInput(e) {
    this.setData({ rejectReason: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  async submitHandle() {
    const { refundId, actionType, rejectReason, remark, submitting } = this.data;
    if (submitting) return;
    if (!refundId) {
      wx.showToast({ title: '退款ID缺失', icon: 'none' });
      return;
    }
    if (actionType === 'reject' && !rejectReason.trim()) {
      wx.showToast({ title: '请填写拒绝理由', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中', mask: true });
    try {
      const endpoint = actionType === 'approve'
        ? `market/merchant/refunds/${refundId}/approve`
        : `market/merchant/refunds/${refundId}/reject`;
      const payload = actionType === 'approve'
        ? { remark }
        : { reason: rejectReason, remark };
      await util.post(endpoint, payload);
      wx.hideLoading();
      wx.showToast({ title: actionType === 'approve' ? '已同意退款' : '已拒绝退款', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: (err && err.errmsg) || '操作失败', icon: 'none' });
    }
  }
});
