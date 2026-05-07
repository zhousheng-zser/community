const api = require('../../../api/index.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    orderNo: '',
    mode: 'dispatch',
    logisticsType: 'platform_rider',
    logisticsCompany: '',
    logisticsNo: '',
    remark: '',
    deliveryProofImages: [],
    submitting: false,
    companies: ['顺丰速运', '中通快递', '圆通速递', '韵达快递', '申通快递', '极兔速递', '邮政快递', '京东物流', '其他']
  },

  onLoad(options) {
    const mode = options.mode === 'delivered' ? 'delivered' : 'dispatch';
    this.setData({ orderNo: options.orderNo || '', mode });
    wx.setNavigationBarTitle({ title: mode === 'delivered' ? '上门配送完成' : '开始配送' });
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

  chooseDeliveryProof() {
    const remain = 3 - (this.data.deliveryProofImages || []).length;
    if (remain <= 0) {
      wx.showToast({ title: '最多上传3张', icon: 'none' });
      return;
    }
    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: async (res) => {
        const files = res.tempFilePaths || [];
        if (!files.length) return;
        wx.showLoading({ title: '上传中', mask: true });
        try {
          const uploaded = [];
          for (const filePath of files) {
            const data = await util.uploadFile('upload', filePath, 'file');
            const p = data && (data.url || data.path || data.data);
            if (p) uploaded.push(p);
          }
          wx.hideLoading();
          const next = (this.data.deliveryProofImages || []).concat(uploaded).slice(0, 3);
          this.setData({ deliveryProofImages: next });
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      }
    });
  },

  removeDeliveryProof(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    const list = (this.data.deliveryProofImages || []).slice();
    if (idx >= 0 && idx < list.length) list.splice(idx, 1);
    this.setData({ deliveryProofImages: list });
  },

  async submitShip() {
    const { orderNo, logisticsType, logisticsCompany, logisticsNo, remark, submitting, mode, deliveryProofImages } = this.data;
    if (submitting) return;
    if (!orderNo) {
      wx.showToast({ title: '订单号缺失', icon: 'none' });
      return;
    }
    if (mode === 'dispatch' && logisticsType === 'self' && !logisticsCompany) {
      wx.showToast({ title: '请填写快递公司', icon: 'none' });
      return;
    }
    if (mode === 'dispatch' && logisticsType === 'self' && !logisticsNo) {
      wx.showToast({ title: '请填写快递单号', icon: 'none' });
      return;
    }
    if (mode === 'delivered' && (!deliveryProofImages || deliveryProofImages.length === 0)) {
      wx.showToast({ title: '请上传配送照片', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中', mask: true });
    try {
      if (mode === 'delivered') {
        await api.merchant.completeDelivery(orderNo, {
          note: remark || '商家已上门配送完成',
          proof_images: deliveryProofImages
        });
      } else {
        await api.merchant.startDelivery(orderNo, {
          logistics_type: logisticsType,
          logistics_company: logisticsCompany,
          logistics_no: logisticsNo,
          note: remark || '商家已开始配送'
        });
      }
      wx.hideLoading();
      wx.showToast({ title: mode === 'delivered' ? '已提交配送完成' : '开始配送成功', icon: 'success' });
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
