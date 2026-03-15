Page({
  data: {
    navTopPadding: 20,
    hotGoods: [
      { image: '/img/placeholders/home_cleaning.png' },
      { image: '/img/placeholders/home_cleaning.png' },
      { image: '/img/placeholders/home_cleaning.png' }
    ]
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ 
      navTopPadding: (sys.statusBarHeight || 20) + 6 
    });
    
    // 如果有首页传过来的参数，则覆盖默认假数据
    if (options && options.username) {
      this.setData({
        finderUserName: options.username,
        brandName: options.brand || '品牌直播间',
        brandLogo: options.logo || '/img/placeholders/home_cleaning.png'
      });
      // 真实项目中如果只传了 goods=1 标记，你可能需要用 options.id 再次请求后端获取该场次的完整热销商品 JSON
      // 这里如果后续接口接通了，可扩充加载商品详情的方法
    }
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  },
  
  goLive() {
    // 拉起微信视频号直播间的官方 API
    const targetFinderUserName = this.data.finderUserName || 'sphJ1iCq7wE7Kj1'; // 默认提供测试ID以免报错
    // const targetFeedId = this.data.feedId; // 指定具体某场预约的单号，可选

    wx.openChannelsLive({
      finderUserName: targetFinderUserName,
      success(res) {
        console.log('成功拉起视频号直播间', res);
      },
      fail(err) {
        console.error('拉起视频号直播间失败', err);
        wx.showToast({
          title: '拉起直播间失败, 请检查ID或稍后再试',
          icon: 'none'
        });
      }
    });
  }
});
