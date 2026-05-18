const util = require('../../../utils/util.js');
const api = require('../../../api/index.js');

Page({
  data: {
    coupons: [],
    loading: false,
    activeTab: 'unused'
  },

  onLoad() {
    this.getCoupons();
  },

  onPullDownRefresh() {
    this.getCoupons();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (this.data.activeTab === tab) return;
    this.setData({ activeTab: tab });
    this.getCoupons();
  },

  async getCoupons() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      const params = { page: 1, page_size: 50 };
      if (this.data.activeTab === 'unused') params.status = 'unused';
      else if (this.data.activeTab === 'used') params.status = 'used';
      else if (this.data.activeTab === 'expired') params.status = 'expired';

      const res = await api.coupon.getMyCoupons(params);
      const list = (res && res.list) || (res && res.data && res.data.list) || (Array.isArray(res) ? res : []);
      const nowTime = Date.now();
      const coupons = list.map((v) => {
        const endTime = v.endTime || v.end_time;
        let time = '';
        let hasEnd = false;
        if (endTime) {
          try {
            time = util.formatTime(new Date(endTime)).split(' ')[0];
            hasEnd = nowTime > new Date(endTime).getTime();
          } catch (e) {
            time = String(endTime).slice(0, 10);
          }
        }
        const threshold = v.threshold_amount != null ? Number(v.threshold_amount) : 0;
        const money = v.couponMoney || v.coupon_money || v.discount_amount || 0;
        let status = v.status || 'unused';
        if (status === 'unused' && hasEnd) status = 'expired';
        return {
          ...v,
          time,
          hasEnd,
          couponMoney: money,
          couponName: v.couponName || v.coupon_name || v.name || '优惠券',
          thresholdText: threshold > 0 ? `满${threshold}可用` : '',
          status
        };
      });
      this.setData({ coupons, loading: false });
      wx.stopPullDownRefresh();
    } catch (e) {
      console.log('我的优惠券加载失败', e);
      this.setData({ coupons: [], loading: false });
      wx.stopPullDownRefresh();
      wx.showToast({ title: (e && e.errmsg) || '加载失败', icon: 'none' });
    }
  },

  goUse() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
