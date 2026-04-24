const util = require('../../../utils/util.js');

Page({
  data: {
    orderNo: '',
    logisticsType: 'platform_rider',
    logisticsCompany: '',
    logisticsNo: '',
    remark: '',
    submitting: false,
    companies: ['顺丰速运', '中通快递', '圆通速递', '韵达快递', '申通快递', '极兔速递', '邮政快递', '京东物流', '其他']
  },

  onLoad(options) {
    this.setData({ orderNo: options.orderNo || '' });
  },

  onLogisticsTypeChange(e) {
    this.setData({ logisticsType: e.detail.value });
  },

  onCompanyInput(e) {
    this.setData({ logisticsCompany: e.detail.value });
  },

  onLogisticsNoInput(e) {
    this.setData({ logisticsNo: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  onCompanySelect(e) {
    const company = e.currentTarget.dataset.company;
    this.setData({ logisticsCompany: company });
  },

  async submitShip() {
    const { orderNo, logisticsType, logisticsCompany, logisticsNo, remark, submitting } = this.data;
    if (submitting) return;
    if (!orderNo) {
      wx.showToast({ title: '订单号缺失', icon: 'none' });
      return;
    }
    if (logisticsType === 'self' && !logisticsCompany) {
      wx.showToast({ title: '请填写快递公司', icon: 'none' });
      return;
    }
    if (logisticsType === 'self' && !logisticsNo) {
      wx.showToast({ title: '请填写快递单号', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中', mask: true });
    try {
      await util.post(`market/merchant/orders/${orderNo}/ship`, {
        logistics_type: logisticsType,
        logistics_company: logisticsCompany,
        logistics_no: logisticsNo,
        remark: remark
      });
      wx.hideLoading();
      wx.showToast({ title: '发货成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: (err && err.errmsg) || '发货失败', icon: 'none' });
    }
  }
});
