const util = require('../../utils/util.js');

Page({
  data: {
    orderNo: '',
    latitude: 39.90872,
    longitude: 116.39748,
    riderName: '',
    updatedAt: '',
    markers: [],
    loading: true
  },

  onLoad(options) {
    const orderNo = options.orderNo ? decodeURIComponent(options.orderNo) : '';
    this.setData({ orderNo });
    this.loadLoc();
  },

  loadLoc() {
    const app = getApp();
    const u = app.globalData.user || {};
    const q = { order_no: this.data.orderNo };
    if (u.shop_id || u.shopId) {
      q.shop_id = u.shop_id || u.shopId;
    }
    this.setData({ loading: true });
    util
      .get('messages/rider-location', q)
      .then((res) => {
        const d = res || {};
        const lat = Number(d.latitude);
        const lng = Number(d.longitude);
        const latitude = Number.isFinite(lat) ? lat : 39.90872;
        const longitude = Number.isFinite(lng) ? lng : 116.39748;
        const riderName = d.rider_name || '骑手';
        const updatedAt = d.updated_at || '';
        this.setData({
          latitude,
          longitude,
          riderName,
          updatedAt,
          markers: [
            {
              id: 1,
              latitude,
              longitude,
              title: riderName,
              width: 36,
              height: 36
            }
          ],
          loading: false
        });
      })
      .catch(() => {
        this.setData({ loading: false });
        wx.showToast({ title: '位置加载失败', icon: 'none' });
      });
  }
});
