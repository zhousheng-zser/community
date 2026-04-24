// pages/coupons-my/coupons-my.js
const app = getApp();
const util = require('../../utils/util.js');
const api = require('../../api/index.js');

Page({
  data: {
    coupons: [],
    loading: false,
    activeTab: 'unused'
  },

  onLoad: function (options) {
    this.getCoupons();
  },

  onPullDownRefresh: function () {
    this.getCoupons();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (this.data.activeTab === tab) return;
    this.setData({ activeTab: tab });
    this.getCoupons();
  },

  async getCoupons() {
    this.setData({ loading: true });
    try {
      const params = { page: 1, page_size: 50 };
      if (this.data.activeTab === 'unused') {
        params.status = 'unused';
      } else if (this.data.activeTab === 'used') {
        params.status = 'used';
      } else if (this.data.activeTab === 'expired') {
        params.status = 'expired';
      }
      
      const res = await api.coupon.getMyCoupons(params);
      const list = res.list || res.data || res || [];
      const nowTime = new Date().getTime();
      const coupons = list.map(v => {
        const endTime = v.endTime || v.end_time;
        const time = util.formatTime(new Date(endTime)).split(" ")[0];
        const hasEnd = nowTime > new Date(endTime).getTime();
        return {
          ...v,
          time: time,
          hasEnd: hasEnd,
          couponMoney: v.couponMoney || v.coupon_money || v.amount,
          couponName: v.couponName || v.coupon_name || v.name,
          status: v.status || (hasEnd ? 'expired' : 'unused')
        };
      });
      this.setData({ coupons, loading: false });
      wx.stopPullDownRefresh();
    } catch (e) {
      console.log('我的优惠券加载失败，使用模拟数据', e);
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
      this.mockLoadCoupons();
    }
  },

  mockLoadCoupons() {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    
    this.setData({
      coupons: [
        { id: 1, couponMoney: '10', couponName: '满50减10优惠券', time: util.formatTime(futureDate).split(" ")[0], hasEnd: false, status: 'unused' },
        { id: 2, couponMoney: '20', couponName: '满100减20优惠券', time: util.formatTime(futureDate).split(" ")[0], hasEnd: false, status: 'unused' },
        { id: 3, couponMoney: '50', couponName: '满200减50优惠券', time: util.formatTime(pastDate).split(" ")[0], hasEnd: true, status: 'expired' }
      ]
    });
  },

  useCoupon(e) {
    const couponId = e.currentTarget.dataset.id;
    wx.showToast({ title: '正在跳转到可用商品列表', icon: 'none' });
  }
})