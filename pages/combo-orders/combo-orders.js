Page({
  data: {
    tip: '组合套餐为营销活动配置，订单列表待与后端套餐接口对接后展示。'
  },
  goMarket() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
