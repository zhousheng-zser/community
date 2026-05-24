// pages/coupons-all/coupons-all.js
const util = require('../../../utils/util.js');
const api = require('../../../api/index.js');

Page({
  data: {
    coupons: [],
    loading: false,
    loadError: ''
  },

  onLoad() {
    this.getCoupons();
  },

  onPullDownRefresh() {
    this.getCoupons();
  },

  async getCoupons() {
    this.setData({ loading: true, loadError: '' });
    try {
      const res = await api.coupon.getCouponList({ page: 1, page_size: 50 });
      const list = res.list || (res.data && res.data.list) || res.data || res || [];
      const coupons = list.map((v) => {
        const time = util.formatTime(new Date(v.endTime || v.end_time));
        const received = !!v.received;
        const canReceive = v.can_receive != null ? v.can_receive : !received;
        return {
          ...v,
          time,
          couponMoney: v.couponMoney || v.coupon_money || v.discount_amount || v.amount,
          couponName: v.couponName || v.coupon_name || v.name,
          endTime: v.endTime || v.end_time,
          received,
          canReceive,
          remainCount: v.remain_count
        };
      });
      this.setData({ coupons, loading: false, loadError: '' });
      wx.stopPullDownRefresh();
    } catch (e) {
      console.log('优惠券列表加载失败', e);
      this.setData({
        coupons: [],
        loading: false,
        loadError: (e && (e.errmsg || e.message)) || '加载失败，请下拉重试'
      });
      wx.stopPullDownRefresh();
    }
  },

  async getCoupon(e) {
    const couponId = e.currentTarget.dataset.id;
    const item = this.data.coupons.find((c) => String(c.id) === String(couponId));
    if (item && item.received) {
      wx.showToast({ title: '您已领取该优惠券', icon: 'none' });
      return;
    }
    if (item && item.canReceive === false) {
      wx.showToast({ title: '暂不可领取', icon: 'none' });
      return;
    }
    try {
      await api.coupon.receiveCoupon({ coupon_id: couponId });
      wx.showToast({ title: '领取成功', icon: 'success' });
      this.getCoupons();
    } catch (err) {
      const errMsg = err.errmsg || err.message || '';
      if (errMsg.includes('已领取') || errMsg.includes('already')) {
        wx.showToast({ title: '您已领取该优惠券', icon: 'none' });
      } else if (errMsg.includes('领完') || errMsg.includes('库存')) {
        wx.showToast({ title: '优惠券已领完', icon: 'none' });
      } else {
        wx.showToast({ title: errMsg || '领取失败，请稍后重试', icon: 'none' });
      }
    }
  }
});
