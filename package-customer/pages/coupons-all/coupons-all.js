// pages/coupons-all/coupons-all.js
const app = getApp()
const util = require('../../../utils/util.js');
const api = require('../../../api/index.js');

Page({
  data: {
    coupons: [],
    loading: false
  },

  onLoad: function (options) {
    this.getCoupons()
  },

  onPullDownRefresh: function () {
    this.getCoupons()
  },

  async getCoupons() {
    this.setData({ loading: true });
    try {
      const res = await api.coupon.getCouponList({ page: 1, page_size: 50 });
      const list = res.list || res.data || res || [];
      const coupons = list.map(v => {
        const time = util.formatTime(new Date(v.endTime || v.end_time));
        return {
          ...v,
          time: time,
          couponMoney: v.couponMoney || v.coupon_money || v.amount,
          couponName: v.couponName || v.coupon_name || v.name,
          endTime: v.endTime || v.end_time
        };
      });
      this.setData({ coupons, loading: false });
      wx.stopPullDownRefresh();
    } catch (e) {
      console.log('优惠券列表加载失败，使用模拟数据', e);
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
      this.mockLoadCoupons();
    }
  },

  mockLoadCoupons() {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const timeStr = util.formatTime(futureDate);
    
    this.setData({
      coupons: [
        { id: 1, couponMoney: '10', couponName: '满50减10优惠券', time: timeStr, sendType: 2 },
        { id: 2, couponMoney: '20', couponName: '满100减20优惠券', time: timeStr, sendType: 2 },
        { id: 3, couponMoney: '50', couponName: '满200减50优惠券', time: timeStr, sendType: 1 }
      ]
    });
  },

  async getCoupon(e) {
    const couponId = e.currentTarget.dataset.id;
    try {
      await api.coupon.receiveCoupon({ coupon_id: couponId });
      wx.showToast({ title: '领取成功', icon: 'success' });
      this.getCoupons();
    } catch (err) {
      const errMsg = err.errmsg || err.message || '';
      if (errMsg.includes('已领取') || errMsg.includes('already')) {
        wx.showToast({ title: '您已领取该优惠券', icon: 'none' });
      } else if (errMsg.includes('已使用') || errMsg.includes('used')) {
        wx.showToast({ title: '您已使用该优惠券', icon: 'none' });
      } else {
        wx.showToast({ title: '领取失败，请稍后重试', icon: 'none' });
      }
    }
  }
})